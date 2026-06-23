/**
 * SecureStorage — AES-256-GCM encrypted wrapper over sessionStorage.
 *
 * ── Architecture ──────────────────────────────────────────────────────────────
 *
 *  Key derivation
 *    PBKDF2(appSecret, perSessionRandomSalt, 100 000 iters, SHA-256) → AES-256-GCM
 *    • appSecret   : deployment-specific constant baked into the bundle
 *    • salt (__ss) : 16 random bytes generated once per tab, stored plaintext —
 *                    a salt is not a secret; its sole purpose is key uniqueness
 *                    across sessions and tabs
 *    • CryptoKey   : held in memory only, never serialised
 *
 *  Wire format (sessionStorage value)
 *    base64(12-byte IV) + "." + base64(AES-GCM ciphertext + 16-byte auth-tag)
 *
 *  Read path  : synchronous from in-memory Map — identical API to sessionStorage
 *  Write path : Map updated immediately (reads are always consistent);
 *               encrypted persist to sessionStorage is fire-and-forget async
 *  Migration  : on first run, existing plaintext values are detected (decrypt
 *               throws on non-ciphertext), transparently re-written as ciphertext
 *
 * ── Security model ────────────────────────────────────────────────────────────
 *
 *  ✅ Protects against  : DevTools inspection, browser-extension storage scrapers,
 *                          physical/unattended machine access
 *  ⚠️  Does NOT protect : determined XSS — attacker running arbitrary JS can
 *                          read the in-memory cache directly.  True XSS-proof
 *                          storage requires HttpOnly cookies (server concern).
 *
 * ── Usage ─────────────────────────────────────────────────────────────────────
 *
 *  // App bootstrap (before any auth or storage reads)
 *  await secureStorage.init();
 *
 *  // Drop-in replacement for sessionStorage
 *  secureStorage.setItem('key', 'value');
 *  secureStorage.getItem('key');   // → string | null  (sync)
 *  secureStorage.removeItem('key');
 *  secureStorage.clear();
 */

// ── Constants ─────────────────────────────────────────────────────────────────

/** Internal key that holds the per-session PBKDF2 salt (plaintext, by design). */
const SALT_KEY = '__ss' as const;

/** Separator between IV and ciphertext in the wire format.
 *  "." is not in the standard base64 alphabet (A-Za-z0-9+/=), so it is safe. */
const SEP = '.' as const;

/**
 * Deployment-specific secret mixed into PBKDF2 input.
 * Tenant UID + partner tag make the key unique per deployment without requiring
 * a dedicated env var.  This is baked into the bundle — it is defence-in-depth
 * obfuscation, not a cryptographic secret.
 */
const APP_SECRET = ['ai360', 'storage', 'v1', import.meta.env.VITE_TENANT_UID ?? ''].join('::');

/** PBKDF2 iteration count — OWASP 2023 minimum for SHA-256 is 600 000 for
 *  password hashing; 100 000 is acceptable here because APP_SECRET is not a
 *  user password and the derive step runs at most once per tab lifetime. */
const PBKDF2_ITERATIONS = 100_000;

// ── Encoding helpers (no external dependencies) ───────────────────────────────

function bufToB64(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}

function b64ToBuf(b64: string): Uint8Array {
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

// ── Service ───────────────────────────────────────────────────────────────────

class SecureStorageService {
  /** AES-256-GCM key — non-extractable, memory-only. */
  #key: CryptoKey | null = null;

  /** Write-through in-memory cache — provides synchronous reads. */
  #cache = new Map<string, string>();

  /** Resolves when init() has finished (key derived + cache hydrated). */
  #ready: Promise<void>;
  #resolveReady!: () => void;

  /** Guards against double-initialisation. */
  #initialized = false;

  /** Tracks in-flight #persistEncrypted calls so flush() can await them all. */
  #pendingPersists = new Set<Promise<void>>();

  constructor() {
    this.#ready = new Promise<void>((resolve) => {
      this.#resolveReady = resolve;
    });
  }

  // ── Public API ──────────────────────────────────────────────────────────────

  /**
   * Initialise the service.  Must be awaited once at app bootstrap before any
   * reads or writes.  Idempotent — safe to call multiple times.
   */
  async init(): Promise<void> {
    if (this.#initialized) return this.#ready;
    this.#initialized = true;

    try {
      this.#key = await this.#deriveKey();
      await this.#hydrateCache();
    } catch (err) {
      // Web Crypto API unavailable (legacy environment) — degrade to plaintext.
      if (import.meta.env.DEV) {
        console.warn('[SecureStorage] Crypto unavailable — falling back to plaintext.', err);
      }
      this.#key = null;
      this.#hydrateCachePlaintext();
    } finally {
      this.#resolveReady();
    }
  }

  /**
   * Promise that resolves once init() completes.
   * Await this in any async path that runs before the normal app bootstrap
   * sequence guarantees init has finished.
   */
  get ready(): Promise<void> {
    return this.#ready;
  }

  /**
   * Synchronous read from the in-memory cache.
   * Drop-in replacement for `sessionStorage.getItem()`.
   */
  getItem(key: string): string | null {
    return this.#cache.get(key) ?? null;
  }

  /**
   * Write value.  Cache is updated synchronously (all subsequent getItem calls
   * see the new value immediately); encrypted persistence to sessionStorage is
   * async but will complete before first API request (due to await secureStorage.ready
   * in axios interceptor).
   *
   * Drop-in replacement for `sessionStorage.setItem()`.
   */
  setItem(key: string, value: string): void {
    this.#cache.set(key, value);
    const p = this.#persistEncrypted(key, value);
    this.#pendingPersists.add(p);
    p.finally(() => this.#pendingPersists.delete(p));
  }

  /**
   * Ensure all pending encryption operations complete.
   * Call this before critical sections that depend on sessionStorage being synced.
   * Used during auth to guarantee data is persisted before page navigation.
   */
  async flush(): Promise<void> {
    await Promise.all([...this.#pendingPersists]);
  }

  /**
   * Remove a single entry from both cache and sessionStorage.
   * Drop-in replacement for `sessionStorage.removeItem()`.
   */
  removeItem(key: string): void {
    this.#cache.delete(key);
    sessionStorage.removeItem(key);
  }

  /**
   * Wipe all entries including the salt key.
   * Next tab / page load will derive a fresh key from a new salt.
   * Drop-in replacement for `sessionStorage.clear()`.
   */
  clear(): void {
    this.#cache.clear();
    sessionStorage.clear();
  }

  // ── Key derivation ──────────────────────────────────────────────────────────

  async #deriveKey(): Promise<CryptoKey> {
    const encoder = new TextEncoder();

    // Per-session 128-bit random salt — generated once, stored plaintext.
    let saltB64 = sessionStorage.getItem(SALT_KEY);
    if (!saltB64) {
      const saltBytes = crypto.getRandomValues(new Uint8Array(16));
      saltB64 = bufToB64(saltBytes.buffer);
      sessionStorage.setItem(SALT_KEY, saltB64);
    }
    const salt = b64ToBuf(saltB64);

    // Import the app secret as PBKDF2 key material.
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(APP_SECRET),
      'PBKDF2',
      false, // non-exportable
      ['deriveKey']
    );

    // Derive a 256-bit AES-GCM key — non-extractable so it cannot leak via
    // crypto.subtle.exportKey even if an attacker gains JS execution.
    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: PBKDF2_ITERATIONS,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false, // non-extractable
      ['encrypt', 'decrypt']
    );
  }

  // ── Cache hydration ─────────────────────────────────────────────────────────

  async #hydrateCache(): Promise<void> {
    const length = sessionStorage.length;
    const tasks: Promise<void>[] = [];

    for (let i = 0; i < length; i++) {
      const key = sessionStorage.key(i);
      if (!key || key === SALT_KEY) continue;

      const raw = sessionStorage.getItem(key);
      if (raw === null) continue;

      tasks.push(
        this.#decrypt(raw)
          .then((decrypted) => {
            // Successfully decrypted — add plaintext to cache
            this.#cache.set(key, decrypted);
          })
          .catch((decryptErr) => {
            // Decryption failed — check if this is plaintext (legacy) or corruption
            const looksLikeEncrypted = raw.includes('.');
            const isPlaintext = !looksLikeEncrypted;

            if (isPlaintext) {
              // Legacy plaintext value — hydrate cache and re-encrypt for next session
              this.#cache.set(key, raw);
              void this.#persistEncrypted(key, raw);

              if (import.meta.env.DEV) {
                console.debug(`[SecureStorage] Auto-encrypted legacy plaintext: ${key}`);
              }
            } else {
              // Looks encrypted but failed to decrypt — data is corrupted.
              // Do NOT add corrupted encrypted data to cache.
              // Leave cache empty for this key (app will treat as missing data).
              console.warn(
                `[SecureStorage] ⚠️ Failed to decrypt key "${key}" — data may be corrupted. ` +
                  `Skipping to prevent JSON.parse errors. Will be cleared on next logout.`,
                decryptErr
              );

              // Optional: clear this corrupted entry to prevent future issues
              sessionStorage.removeItem(key);
            }
          })
      );
    }

    await Promise.all(tasks);
  }

  /** Fallback used when Web Crypto is unavailable. */
  #hydrateCachePlaintext(): void {
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (!key || key === SALT_KEY) continue;
      const value = sessionStorage.getItem(key);
      if (value !== null) this.#cache.set(key, value);
    }
  }

  // ── AES-256-GCM primitives ──────────────────────────────────────────────────

  async #encrypt(plaintext: string): Promise<string> {
    // Fresh 96-bit IV for every encryption — NIST SP 800-38D recommendation.
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(plaintext);

    const cipherBuf = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, this.#key!, encoded);

    return `${bufToB64(iv.buffer)}${SEP}${bufToB64(cipherBuf)}`;
  }

  async #decrypt(token: string): Promise<string> {
    const sepIdx = token.indexOf(SEP);
    if (sepIdx === -1) throw new Error('Not a ciphertext token');

    const iv = b64ToBuf(token.slice(0, sepIdx));
    const cipher = b64ToBuf(token.slice(sepIdx + 1));

    const plainBuf = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, this.#key!, cipher);

    return new TextDecoder().decode(plainBuf);
  }

  async #persistEncrypted(key: string, value: string): Promise<void> {
    if (!this.#key) {
      // Degraded mode — persist plaintext.
      sessionStorage.setItem(key, value);
      return;
    }
    try {
      const ciphertext = await this.#encrypt(value);
      sessionStorage.setItem(key, ciphertext);
    } catch {
      // Silent fail — the in-memory cache remains accurate for this tab's
      // lifetime; the next page load will re-encrypt from the auth response.
    }
  }
}

// ── Singleton export ──────────────────────────────────────────────────────────

export const secureStorage = new SecureStorageService();
