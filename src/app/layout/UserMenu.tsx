import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { User, LogOut, ChevronUp } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const ROLE_COLORS: Record<string, { bg: string; text: string }> = {
  ADMIN: { bg: 'rgba(239,68,68,0.15)', text: '#f87171' },
  MANAGER: { bg: 'rgba(245,158,11,0.15)', text: '#fbbf24' },
  OPERATOR: { bg: 'rgba(59,130,246,0.15)', text: '#60a5fa' },
  VIEWER: { bg: 'rgba(100,116,139,0.15)', text: '#94a3b8' },
};

function getRoleBadge(role?: string) {
  if (!role) return ROLE_COLORS.VIEWER;
  return ROLE_COLORS[role.toUpperCase()] ?? { bg: 'rgba(96,165,250,0.15)', text: '#93c5fd' };
}

function getInitials(
  user: { fullName?: string; userName?: string; firstName?: string; lastName?: string } | null
): string {
  if (!user) return '?';
  if (user.firstName && user.lastName) return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
  if (user.fullName) {
    const parts = user.fullName.trim().split(/\s+/);
    return parts.length >= 2
      ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
      : parts[0].slice(0, 2).toUpperCase();
  }
  return (user.userName ?? '?').slice(0, 2).toUpperCase();
}

interface UserMenuProps {
  collapsed?: boolean;
}

export function UserMenu({ collapsed = false }: UserMenuProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });

  // Recalculate portal position whenever it opens
  useEffect(() => {
    if (!open || !triggerRef.current) return;
    const r = triggerRef.current.getBoundingClientRect();
    setPos({ top: r.top, left: r.left, width: r.width });
  }, [open]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      )
        setOpen(false);
    }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const go = useCallback(
    (path: string) => {
      setOpen(false);
      navigate(path);
    },
    [navigate]
  );
  const handleSignOut = () => {
    // Route through /sign-out (SignOutPage) — it awaits the async signOut
    // thunk before navigating. Doing it inline here caused a race: the
    // navigate('/sign-in') fired before isAuthenticated flipped, so the
    // GuestRoute on /sign-in briefly redirected to /home, then the
    // ProtectedRoute on /home bounced back to /sign-in?redirectURL=/home.
    setOpen(false);
    navigate('/sign-out');
  };

  const initials = getInitials(user);
  const roleBadge = getRoleBadge(user?.role);

  // Card popup width
  const CARD_W = 256;

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      {/* ── Trigger ── */}
      <button
        ref={triggerRef}
        onClick={() => setOpen((p) => !p)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          width: '100%',
          padding: collapsed ? '4px 0' : '0',
          background: 'transparent',
          border: 'none',
          borderRadius: 8,
          cursor: 'pointer',
          transition: 'background .15s',
          justifyContent: collapsed ? 'center' : 'flex-start',
        }}
        aria-expanded={open}
        aria-haspopup="true"
      >
        {/* Avatar — 32×32 circle */}
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            flexShrink: 0,
            background: '#2176FF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: "'Inter', system-ui, sans-serif",
            fontSize: 12,
            fontWeight: 700,
            color: '#FFFFFF',
          }}
        >
          {initials}
        </div>

        {!collapsed && (
          <>
            <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
              <div
                style={{
                  fontFamily: "'Inter', system-ui, sans-serif",
                  fontSize: 14,
                  fontWeight: 500,
                  lineHeight: '17px',
                  letterSpacing: '-0.15px',
                  color: '#0F172B',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {user?.fullName || user?.firstName || user?.userName || 'User'}
              </div>
              <div
                style={{
                  fontFamily: "'Inter', system-ui, sans-serif",
                  fontSize: 12,
                  fontWeight: 400,
                  lineHeight: '15px',
                  color: '#62748E',
                  marginTop: 1,
                  textTransform: 'uppercase',
                }}
              >
                {user?.role || 'User'}
              </div>
            </div>
            <ChevronUp
              size={14}
              strokeWidth={1.5}
              style={{
                color: '#8190A5',
                flexShrink: 0,
                transform: open ? 'rotate(0deg)' : 'rotate(180deg)',
                transition: 'transform .2s',
              }}
            />
          </>
        )}
      </button>

      {/* ── Dropdown (portal) ── */}
      {open &&
        createPortal(
          <div
            ref={menuRef}
            style={{
              position: 'fixed',
              bottom: `calc(100vh - ${pos.top}px + 8px)`,
              left: pos.left,
              width: CARD_W,
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: 12,
              boxShadow: '0 12px 40px rgba(15,23,43,0.18), 0 2px 8px rgba(15,23,43,0.08)',
              zIndex: 9999,
              overflow: 'hidden',
              fontFamily: "'Inter', system-ui, sans-serif",
            }}
            role="menu"
          >
            {/* Profile header */}
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #F1F5F9' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    flexShrink: 0,
                    background: '#2176FF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 14,
                    fontWeight: 700,
                    color: '#FFFFFF',
                  }}
                >
                  {initials}
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 14,
                      fontWeight: 600,
                      lineHeight: '18px',
                      letterSpacing: '-0.15px',
                      color: '#0F172A',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {user?.fullName || user?.firstName || user?.userName || 'User'}
                  </p>
                  <p
                    style={{
                      margin: '2px 0 0',
                      fontSize: 12,
                      fontWeight: 400,
                      lineHeight: '16px',
                      color: '#64748B',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {user?.email || ''}
                  </p>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      marginTop: 6,
                      padding: '2px 8px',
                      borderRadius: 6,
                      fontSize: 10,
                      fontWeight: 600,
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                      background: roleBadge.bg,
                      color: roleBadge.text,
                    }}
                  >
                    {user?.role || 'User'}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div style={{ padding: '4px 0' }}>
              <DropItem
                icon={<User size={15} strokeWidth={1.5} />}
                label="View Profile"
                onClick={() => go('/user-profile')}
              />
            </div>

            {/* Sign out */}
            <div style={{ padding: '4px 0', borderTop: '1px solid #F1F5F9' }}>
              <button
                onClick={handleSignOut}
                role="menuitem"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  width: '100%',
                  padding: '9px 16px',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: 500,
                  color: '#DC2626',
                  transition: 'background .1s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(239,68,68,0.06)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <LogOut size={15} strokeWidth={1.5} style={{ color: '#DC2626' }} />
                Sign Out
              </button>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}

function DropItem({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      role="menuitem"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        width: '100%',
        padding: '9px 16px',
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        fontSize: 14,
        fontWeight: 500,
        color: '#334155',
        transition: 'background .1s, color .1s',
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = '#F8FAFC';
        e.currentTarget.style.color = '#0F172A';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent';
        e.currentTarget.style.color = '#334155';
      }}
    >
      <span style={{ color: '#64748B', display: 'flex' }}>{icon}</span>
      {label}
    </button>
  );
}
