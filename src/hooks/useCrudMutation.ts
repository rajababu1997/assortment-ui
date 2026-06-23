/**
 * Metadata-driven mutation factory — eliminates boilerplate across 22 feature modules.
 *
 * Instead of writing 4-6 nearly identical useMutation hooks per module,
 * define a MutationConfig and get a fully wired hook with:
 *   - invokeService call
 *   - HTTP status validation
 *   - Toast success/error messages (convention-based or custom)
 *   - Logger integration
 *   - Query cache invalidation
 *   - Type safety throughout
 *
 * Message convention: just provide `entity` + `action` and messages are auto-generated:
 *   Success: "{name} {entity} {action}d successfully" or "New {entity} {action}d successfully"
 *   Error:   "Failed to {action} {entity}"
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { UseMutationOptions, UseMutationResult } from '@tanstack/react-query';
import { invokeService } from '@/services/invokeService';
import type { ApiEndpoint, UrlParams } from '@/constants/apiConfig.types';
import { isHttpSuccess } from '@/constants/enums';
import { toast } from '@/lib/toast';
import { logger } from '@/lib/logger';

// ── CRUD action constants ────────────────────────────────────────────────────

export const CRUD_ACTIONS = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  ACTIVATE: 'activate',
  DEACTIVATE: 'de-activate',
  SAVE: 'save',
  DISCOVER: 'discover',
  FETCH: 'fetch',
} as const;

export type CrudAction = typeof CRUD_ACTIONS[keyof typeof CRUD_ACTIONS];

// ── Message resolver ─────────────────────────────────────────────────────────

type MessageInput = string | ((input: any) => string);

/**
 * Builds standard CRUD messages from entity + action.
 *
 * Convention:
 *   success → "{displayName} {entity} {action}d successfully"
 *   error   → "Failed to {action} {entity}"
 *
 * If input has a `name` field, it's used as displayName.
 * For 'create', success → "New {entity} created successfully"
 */
function buildSuccessMessage(entity: string, action: CrudAction, nameField: string): (input: any) => string {
  return (input: any) => {
    const name = input?.[nameField];
    if (action === CRUD_ACTIONS.CREATE) {
      return `New ${entity} ${action}d successfully`;
    }
    return name
      ? `${name} ${entity} ${action}d successfully`
      : `${entity} ${action}d successfully`;
  };
}

function buildErrorMessage(entity: string, action: CrudAction, nameField: string): (input: any) => string {
  return (input: any) => {
    const name = input?.[nameField];
    return name
      ? `Failed to ${action} ${name}`
      : `Failed to ${action} ${entity}`;
  };
}

function buildLogLabel(entity: string, action: CrudAction): string {
  return `${action.charAt(0).toUpperCase() + action.slice(1)} ${entity}`;
}

// ── Mutation config (metadata) ───────────────────────────────────────────────

export interface MutationConfig<TInput, TResponse = { code: number | string; message?: string }> {
  /** API_CONFIG endpoint to call */
  endpoint: ApiEndpoint;

  // ── Convention-based messages (preferred) ──────────────────────────────
  /** Entity name for auto-generated messages (e.g., 'facility', 'category') */
  entity?: string;
  /** CRUD action type — drives message templates */
  action?: CrudAction;
  /** Field name on TInput to use as display name in messages — default: 'name' */
  nameField?: string;

  // ── Custom overrides (takes precedence over convention) ────────────────
  /** Toast message on success. Overrides convention if provided. */
  successMessage?: MessageInput;
  /** Toast message on error. Overrides convention if provided. */
  errorMessage?: MessageInput;
  /** Logger context label. Overrides convention if provided. */
  logLabel?: string;

  // ── Request mapping ────────────────────────────────────────────────────
  /** Extract URL path params from input (e.g., row => ({ facilityUid: row.uuid })) */
  params?: (input: TInput) => UrlParams;
  /** Transform input into request body. Omit for no-body requests (activate/deactivate). */
  payload?: (input: TInput) => unknown;

  // ── Behavior options ───────────────────────────────────────────────────
  /** Query keys to invalidate on success */
  invalidateKeys?: readonly unknown[];
  /** Skip HTTP status code validation (for endpoints that don't return { code }) */
  skipStatusCheck?: boolean;
  /** Toast type for success — default: 'success'. Use 'info' for fire-and-forget actions. */
  successToast?: 'success' | 'info';
  /** Additional TanStack Query mutation options (retry, onSettled, etc.) */
  mutationOptions?: Partial<UseMutationOptions<TResponse, Error, TInput>>;
}

// ── Factory hook ─────────────────────────────────────────────────────────────

export function useCrudMutation<TInput, TResponse = { code: number | string; message?: string }>(
  config: MutationConfig<TInput, TResponse>,
): UseMutationResult<TResponse, Error, TInput> {
  const queryClient = useQueryClient();

  const nameField = config.nameField ?? 'name';
  const entity = config.entity ?? 'record';
  const action = config.action ?? CRUD_ACTIONS.SAVE;

  // Resolve messages: custom override > convention-based
  const successMsg = config.successMessage ?? buildSuccessMessage(entity, action, nameField);
  const errorMsg = config.errorMessage ?? buildErrorMessage(entity, action, nameField);
  const logLabel = config.logLabel ?? buildLogLabel(entity, action);

  const resolveMessage = (msg: MessageInput, input: TInput): string =>
    typeof msg === 'function' ? msg(input) : msg;

  return useMutation({
    mutationFn: async (input: TInput) => {
      const params = config.params?.(input);
      const payload = config.payload?.(input);

      const response = await invokeService<TResponse>(
        config.endpoint,
        params,
        payload,
      );

      if (!config.skipStatusCheck) {
        const code = (response as { code?: unknown })?.code;
        if (code !== undefined && !isHttpSuccess(code)) {
          const msg = (response as { message?: string })?.message ?? `${logLabel} failed`;
          throw new Error(msg);
        }
      }

      return response;
    },

    onSuccess: (_data, input) => {
      const toastFn = config.successToast === 'info' ? toast.info : toast.success;
      toastFn(resolveMessage(successMsg, input));

      if (config.invalidateKeys) {
        queryClient.invalidateQueries({ queryKey: config.invalidateKeys as unknown[] });
      }
    },

    onError: (error, input) => {
      logger.error(`${logLabel} failed`, { input, error });
      // error.message is the backend Status.message when thrown from the status check above
      toast.error(error?.message || resolveMessage(errorMsg, input));
    },

    ...config.mutationOptions,
  });
}
