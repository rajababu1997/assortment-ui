import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { NavIcon } from '@/components/NavIcon';
import { Tooltip } from '@/components/primitives/Tooltip';
import { environment } from '@/config/environment';
import { useNavigation } from '@/hooks/useNavigation';
import { useTheme } from '@/hooks/useTheme';
import { useBreakpoint } from '@/hooks/useMediaQuery';
import type { NavigationItem } from '@/types/navigation';
import { UserMenu } from './UserMenu';

// ── Figma design tokens ────────────────────────────────────────────────────────

const C = {
  bg: '#F8FAFC',
  border: '#D2DBE6',
  logoIconBg: '#2176FF',
  logoText: '#0F172B',
  text: '#465265',
  icon: '#596A81',
  chevron: '#8190A5',
  activeBg: '#E9F1FF',
  activeText: '#2176FF',
  hoverBg: 'rgba(15,23,43,0.04)',
  activeChildText: '#2176FF',
  userName: '#0F172B',
  roleColor: '#62748E',
  notifDot: '#FB2C36',
  divider: '#D2DBE6',
  flyoutBg: '#FFFFFF',
  flyoutBorder: '#E2E8F0',
  flyoutText: '#334155',
  flyoutHover: '#F1F5F9',
  flyoutActive: '#EFF6FF',
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function isItemActive(item: NavigationItem, pathname: string): boolean {
  if (item.link && pathname.startsWith(item.link)) return true;
  if (item.children) return item.children.some((c) => isItemActive(c, pathname));
  return false;
}

function itemHasRecordings(_item: NavigationItem): boolean {
  return false;
}

// ── NavChildItem (child leaf, no icon, 40px) ──────────────────────────────────

function NavChildItem({
  item,
  onNavigate,
  deeper,
}: {
  item: NavigationItem;
  onNavigate?: () => void;
  deeper?: boolean;
}) {
  const { pathname } = useLocation();
  const active = item.link ? pathname.startsWith(item.link) : false;
  const [hovered, setHovered] = useState(false);

  const el = (
    <Tooltip content={item.title} placement="bottom" portal wrapStyle={{ display: 'block', width: '100%' }}>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: `6px 12px 6px ${deeper ? 54 : 40}px`,
          height: 40,
          borderRadius: 8,
          cursor: 'pointer',
          background: hovered ? C.hoverBg : 'transparent',
          transition: 'background 0.12s',
        }}
      >
        <span
          style={{
            fontFamily: "'Inter', system-ui, sans-serif",
            fontWeight: 500,
            fontSize: 14,
            lineHeight: '1.3',
            letterSpacing: '-0.15px',
            color: active ? C.activeChildText : C.text,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            transition: 'color 0.12s',
          }}
        >
          {item.title}
        </span>
        {/* recording indicator placeholder */}
      </div>
    </Tooltip>
  );

  return item.link ? (
    <Link to={item.link} onClick={onNavigate} style={{ textDecoration: 'none', display: 'block' }}>
      {el}
    </Link>
  ) : (
    el
  );
}

// ── NavNestedParentItem (collapsable child inside a parent, text-only style) ──

function NavNestedParentItem({ item, onNavigate }: { item: NavigationItem; onNavigate?: () => void }) {
  const { pathname } = useLocation();
  const hasActive = isItemActive(item, pathname);
  const [open, setOpen] = useState(hasActive);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    if (hasActive) setOpen(true);
  }, [hasActive]);

  return (
    <div>
      <Tooltip content={item.title} placement="bottom" portal wrapStyle={{ display: 'block', width: '100%' }}>
        <div
          onClick={() => setOpen((p) => !p)}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '6px 12px 6px 40px',
            height: 36,
            borderRadius: 8,
            cursor: 'pointer',
            background: hovered ? C.hoverBg : 'transparent',
            transition: 'background 0.12s',
          }}
        >
          <span
            style={{
              fontFamily: "'Inter', system-ui, sans-serif",
              fontWeight: 500,
              fontSize: 14,
              lineHeight: '1.3',
              letterSpacing: '-0.15px',
              color: hasActive ? C.activeChildText : C.text,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              transition: 'color 0.12s',
            }}
          >
            {item.title}
          </span>
          <span style={{ flexShrink: 0, color: C.chevron, display: 'flex', alignItems: 'center' }}>
            {open ? <ChevronDown size={12} strokeWidth={1.5} /> : <ChevronRight size={12} strokeWidth={1.5} />}
          </span>
        </div>
      </Tooltip>

      <AnimatePresence initial={false}>
        {open && item.children && (
          <motion.div
            key={item.id}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', paddingTop: 2, paddingBottom: 2 }}>
              {item.children.map((child) => (
                <NavChildItem key={child.id} item={child} onNavigate={onNavigate} deeper />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── NavParentItem (collapsable group, 48px) ────────────────────────────────────

function NavParentItem({
  item,
  onNavigate,
  forceExpand,
}: {
  item: NavigationItem;
  onNavigate?: () => void;
  forceExpand?: boolean;
}) {
  const { pathname } = useLocation();
  const hasActive = isItemActive(item, pathname);
  const [open, setOpen] = useState(hasActive || !!forceExpand);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    if (hasActive || forceExpand) setOpen(true);
  }, [hasActive, forceExpand]);

  const isActiveParent = hasActive || open;

  return (
    <div>
      <Tooltip content={item.title} placement="bottom" portal wrapStyle={{ display: 'block', width: '100%' }}>
        <button
          onClick={() => setOpen((p) => !p)}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          style={{
            width: '100%',
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '8px 12px',
            gap: 8,
            height: 40,
            borderRadius: 8,
            border: 'none',
            cursor: 'pointer',
            background: isActiveParent ? C.activeBg : hovered ? C.hoverBg : 'transparent',
            transition: 'background 0.12s',
            fontFamily: 'inherit',
            textAlign: 'left',
          }}
        >
          {/* Left: icon + label */}
          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
            {item.icon && (
              <span
                style={{
                  flexShrink: 0,
                  width: 20,
                  height: 20,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: hasActive ? C.activeText : C.icon,
                }}
              >
                <NavIcon icon={item.icon} size={20} />
              </span>
            )}
            <span
              style={{
                fontFamily: "'Inter', system-ui, sans-serif",
                fontWeight: 500,
                fontSize: 14,
                lineHeight: '19px',
                letterSpacing: '-0.150391px',
                color: hasActive ? C.activeText : C.text,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {item.title}
            </span>
          </div>

          {/* Right: chevron */}
          <span style={{ flexShrink: 0, color: C.chevron, display: 'flex', alignItems: 'center' }}>
            {open ? <ChevronDown size={16} strokeWidth={1.5} /> : <ChevronRight size={16} strokeWidth={1.5} />}
          </span>
        </button>
      </Tooltip>

      <AnimatePresence initial={false}>
        {open && item.children && (
          <motion.div
            key={item.id}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', paddingTop: 2, paddingBottom: 2 }}>
              {item.children.map((child) =>
                child.type === 'collapsable' ? (
                  <NavNestedParentItem key={child.id} item={child} onNavigate={onNavigate} />
                ) : (
                  <NavChildItem key={child.id} item={child} onNavigate={onNavigate} />
                )
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── NavLeafItem (no children, 48px) ───────────────────────────────────────────

function NavLeafItem({ item, onNavigate }: { item: NavigationItem; onNavigate?: () => void }) {
  const { pathname } = useLocation();
  const active = item.link ? pathname.startsWith(item.link) : false;
  const [hovered, setHovered] = useState(false);

  const el = (
    <Tooltip content={item.title} placement="bottom" portal wrapStyle={{ display: 'block', width: '100%' }}>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          padding: '8px 12px',
          gap: 8,
          height: 40,
          borderRadius: 8,
          cursor: 'pointer',
          background: active ? C.activeBg : hovered ? C.hoverBg : 'transparent',
          transition: 'background 0.12s',
        }}
      >
        {item.icon && (
          <span
            style={{
              flexShrink: 0,
              width: 20,
              height: 20,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: active ? C.activeText : C.icon,
            }}
          >
            <NavIcon icon={item.icon} size={20} />
          </span>
        )}
        <span
          style={{
            fontFamily: "'Inter', system-ui, sans-serif",
            fontWeight: 500,
            fontSize: 14,
            lineHeight: '19px',
            letterSpacing: '-0.150391px',
            color: active ? C.activeText : C.text,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            flex: 1,
            transition: 'color 0.12s',
          }}
        >
          {item.title}
        </span>
        {/* recording indicator placeholder */}
      </div>
    </Tooltip>
  );

  return item.link ? (
    <Link to={item.link} onClick={onNavigate} style={{ textDecoration: 'none', display: 'block' }}>
      {el}
    </Link>
  ) : (
    el
  );
}

// ── NavEntry (type router) ────────────────────────────────────────────────────

function NavEntry({
  item,
  onNavigate,
  forceExpand,
}: {
  item: NavigationItem;
  onNavigate?: () => void;
  forceExpand?: boolean;
}) {
  if (item.type === 'basic') {
    return <NavLeafItem item={item} onNavigate={onNavigate} />;
  }
  if (item.type === 'collapsable') {
    return <NavParentItem item={item} onNavigate={onNavigate} forceExpand={forceExpand} />;
  }
  if (item.type === 'divider') {
    return <div style={{ height: 1, margin: '6px 0', background: C.divider }} />;
  }
  return null;
}

// ── FlyoutLink (children inside flyout for collapsed icon mode) ───────────────

function FlyoutLink({ item, onNavigate }: { item: NavigationItem; onNavigate?: () => void }) {
  const { pathname } = useLocation();
  const active = item.link ? pathname.startsWith(item.link) : false;
  const hasChildren = item.type === 'collapsable' && !!item.children?.length;
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState(false);

  if (hasChildren) {
    const isActive = isItemActive(item, pathname);
    return (
      <div>
        <button
          onClick={() => setOpen((p) => !p)}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '6px 12px',
            border: 'none',
            cursor: 'pointer',
            height: 36,
            borderRadius: 8,
            background: hovered ? C.hoverBg : 'transparent',
            color: isActive ? C.activeText : C.text,
            fontSize: 14,
            fontWeight: 500,
            lineHeight: '1.3',
            letterSpacing: '-0.15px',
            fontFamily: "'Inter', system-ui, sans-serif",
            textAlign: 'left' as const,
            transition: 'background 0.12s, color 0.12s',
          }}
        >
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</span>
          {open ? <ChevronDown size={12} strokeWidth={1.5} /> : <ChevronRight size={12} strokeWidth={1.5} />}
        </button>
        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.12 }}
              style={{ overflow: 'hidden', paddingLeft: 12 }}
            >
              {item.children?.map((child) => <FlyoutLink key={child.id} item={child} onNavigate={onNavigate} />)}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  const el = (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '6px 12px',
        cursor: 'pointer',
        height: 36,
        borderRadius: 8,
        background: hovered ? C.hoverBg : 'transparent',
        color: active ? C.activeText : C.text,
        fontSize: 14,
        fontWeight: 500,
        lineHeight: '1.3',
        letterSpacing: '-0.15px',
        fontFamily: "'Inter', system-ui, sans-serif",
        transition: 'background 0.1s, color 0.1s',
        gap: 8,
      }}
    >
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{item.title}</span>
    </div>
  );

  return item.link ? (
    <Link to={item.link} onClick={onNavigate} style={{ textDecoration: 'none', display: 'block' }}>
      {el}
    </Link>
  ) : (
    el
  );
}

// ── CollapsedNavItem (icon-only strip mode) ───────────────────────────────────

function CollapsedNavItem({ item, onNavigate }: { item: NavigationItem; onNavigate?: () => void }) {
  const { pathname } = useLocation();
  const active = isItemActive(item, pathname);
  const hasChildren = item.type === 'collapsable' && !!item.children?.length;
  const [flyout, setFlyout] = useState(false);
  const [hovered, setHovered] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const ref = useRef<HTMLDivElement>(null);

  const enter = () => {
    clearTimeout(timer.current);
    if (hasChildren) setFlyout(true);
  };
  const leave = () => {
    timer.current = setTimeout(() => setFlyout(false), 100);
  };
  useEffect(() => () => clearTimeout(timer.current), []);

  if (item.type === 'divider' || item.type === 'group') {
    return <div style={{ height: 1, margin: '6px 8px', background: C.divider }} />;
  }

  const btn = (
    <div
      ref={ref}
      onMouseEnter={() => {
        setHovered(true);
        enter();
      }}
      onMouseLeave={() => {
        setHovered(false);
        leave();
      }}
      style={{ padding: '2px 0', display: 'flex', justifyContent: 'center' }}
    >
      <Tooltip content={item.title} placement="bottom" portal wrapStyle={{ display: 'flex', justifyContent: 'center' }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            position: 'relative',
            background: active ? C.activeBg : hovered ? C.hoverBg : 'transparent',
            color: active ? C.activeText : C.icon,
            transition: 'background 0.12s, color 0.12s',
          }}
        >
          <NavIcon icon={item.icon} size={20} />
          {item.badge && (
            <span
              style={{
                position: 'absolute',
                top: 4,
                right: 4,
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: C.notifDot,
              }}
            />
          )}
          {/* recording indicator placeholder */}
        </div>
      </Tooltip>

      {flyout &&
        hasChildren &&
        (() => {
          const itemTop = ref.current?.getBoundingClientRect().top ?? 0;
          const maxTop = window.innerHeight - 60;
          const top = Math.min(itemTop, maxTop);
          const availableHeight = window.innerHeight - top - 20;
          return createPortal(
            <div
              onMouseEnter={enter}
              onMouseLeave={leave}
              style={{
                position: 'fixed',
                left: 'var(--sidebar-collapsed)',
                top: `${top}px`,
                maxHeight: `${Math.max(availableHeight, 200)}px`,
                minWidth: 200,
                background: C.flyoutBg,
                border: `1px solid ${C.flyoutBorder}`,
                borderRadius: 10,
                boxShadow: '0 8px 24px rgba(15,23,43,.12)',
                zIndex: 1000,
                overflowY: 'auto',
                padding: '4px 8px 6px',
              }}
            >
              <div
                style={{
                  padding: '8px 12px 6px',
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: '0.5px',
                  color: '#94A3B8',
                  textTransform: 'uppercase' as const,
                  borderBottom: `1px solid ${C.flyoutBorder}`,
                  marginBottom: 2,
                  fontFamily: "'Inter', system-ui, sans-serif",
                }}
              >
                {item.title}
              </div>
              {item.children?.map((child) => <FlyoutLink key={child.id} item={child} onNavigate={onNavigate} />)}
            </div>,
            document.body
          );
        })()}
    </div>
  );

  if (item.link && !hasChildren) {
    return (
      <Link to={item.link} onClick={onNavigate} style={{ textDecoration: 'none', display: 'block' }}>
        {btn}
      </Link>
    );
  }
  return btn;
}

// ── CollapsedLogoButton ───────────────────────────────────────────────────────

function CollapsedLogoButton({ onToggle }: { onToggle: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onClick={onToggle}
      title="Expand sidebar"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: 40,
        height: 40,
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: hovered ? 'transparent' : '#fff',
        borderRadius: 10,
        boxShadow: hovered ? 'none' : '0 1px 4px rgba(0,0,0,0.10)',
        cursor: 'pointer',
        transition: 'background 0.15s, box-shadow 0.15s',
      }}
    >
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: 8,
          background: 'linear-gradient(135deg, #2176FF 0%, #6e8df0 100%)',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: "'Inter', system-ui, sans-serif",
          fontWeight: 800,
          fontSize: 13,
          letterSpacing: '-0.5px',
          opacity: hovered ? 0.7 : 1,
          transition: 'opacity .15s',
        }}
      >
        {(environment.appTitle ?? 'U').slice(0, 2).toUpperCase()}
      </div>
    </div>
  );
}

// ── SidebarContent ────────────────────────────────────────────────────────────

function SidebarContent({
  collapsed,
  onToggle,
  onNavigate,
}: {
  collapsed: boolean;
  onToggle: () => void;
  onNavigate?: () => void;
}) {
  const navItems = useNavigation();
  const scrollRef = useRef<HTMLElement>(null);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        fontFamily: "'Inter', system-ui, sans-serif",
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale',
        background: C.bg,
      }}
    >
      {/* ── Header 80px ─────────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: collapsed ? 'center' : 'space-between',
          alignItems: 'center',
          padding: '0 20px',
          height: 64,
          flexShrink: 0,
          transition: 'padding 250ms',
        }}
      >
        {/* Collapsed: logo centred — hover reveals expand icon */}
        {collapsed && <CollapsedLogoButton onToggle={onToggle} />}

        {/* Expanded: logo centred + collapse toggle */}
        {!collapsed && (
          <>
            <div
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-start',
                gap: 10,
                paddingLeft: 4,
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: 'linear-gradient(135deg, #2176FF 0%, #6e8df0 100%)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: "'Inter', system-ui, sans-serif",
                  fontWeight: 800,
                  fontSize: 14,
                  letterSpacing: '-0.5px',
                  flexShrink: 0,
                }}
              >
                {(environment.appTitle ?? 'U').slice(0, 2).toUpperCase()}
              </div>
              <span
                style={{
                  fontFamily: "'Inter', system-ui, sans-serif",
                  fontWeight: 700,
                  fontSize: 15,
                  letterSpacing: '-0.3px',
                  color: '#0F172B',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {environment.appTitle}
              </span>
            </div>

            <button
              onClick={onToggle}
              title="Collapse sidebar"
              style={{
                width: 24,
                height: 24,
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                borderRadius: 4,
                opacity: 0.7,
                transition: 'opacity 0.12s',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.opacity = '1';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.opacity = '0.7';
              }}
            >
              <ChevronRight size={16} strokeWidth={1.5} style={{ transform: 'rotate(180deg)' }} />
            </button>
          </>
        )}
      </div>

      {/* ── Navigation area ─────────────────────────────────────────────────── */}
      <nav
        ref={scrollRef as React.RefObject<HTMLElement>}
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: collapsed ? '8px 8px' : '8px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          background: C.bg,
          scrollbarWidth: 'thin',
          scrollbarColor: `${C.border} transparent`,
        }}
      >
        <style>{`
          nav::-webkit-scrollbar { width: 4px; }
          nav::-webkit-scrollbar-track { background: transparent; }
          nav::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 4px; }
          nav::-webkit-scrollbar-thumb:hover { background: #B0BEC5; }
        `}</style>

        {collapsed
          ? navItems.map((item) => <CollapsedNavItem key={item.id} item={item} onNavigate={onNavigate} />)
          : navItems.map((item) => <NavEntry key={item.id} item={item} onNavigate={onNavigate} />)}
      </nav>

      {/* ── Bottom section ───────────────────────────────────────────────────── */}
      <div
        style={{
          flexShrink: 0,
          borderTop: `1px solid ${C.divider}`,
          padding: collapsed ? '12px 8px' : '12px',
        }}
      >
        {collapsed ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <UserMenu collapsed />
          </div>
        ) : (
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '8px 12px',
              gap: 8,
              height: 48,
              borderRadius: 8,
              isolation: 'isolate',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
              <UserMenu collapsed={false} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Sidebar (exported) ────────────────────────────────────────────────────────

export function Sidebar({ mobileOpen, onMobileClose }: { mobileOpen: boolean; onMobileClose: () => void }) {
  const { sidebarCollapsed, toggleSidebar } = useTheme();
  const { isLg } = useBreakpoint();
  const { pathname } = useLocation();

  useEffect(() => {
    if (!isLg && mobileOpen) onMobileClose();
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!isLg && mobileOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isLg, mobileOpen]);

  const handleMobileNavClick = useCallback(() => {
    onMobileClose();
  }, [onMobileClose]);

  if (isLg) {
    return (
      <aside
        style={{
          position: 'fixed',
          inset: 0,
          right: 'auto',
          zIndex: 'var(--z-sidebar)' as unknown as number,
          width: sidebarCollapsed ? 'var(--sidebar-collapsed)' : 'var(--sidebar-width)',
          background: C.bg,
          borderRight: `1px solid ${C.border}`,
          display: 'flex',
          flexDirection: 'column',
          transition: 'width var(--transition-sidebar) cubic-bezier(0.4, 0, 0.2, 1)',
          overflow: 'visible',
        }}
      >
        <SidebarContent collapsed={sidebarCollapsed} onToggle={toggleSidebar} />
      </aside>
    );
  }

  if (!mobileOpen) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 'var(--z-sidebar)' as unknown as number }}>
      <div
        style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,43,0.35)' }}
        onClick={handleMobileNavClick}
      />
      <aside
        style={{
          position: 'relative',
          width: 'var(--sidebar-width)',
          height: '100%',
          background: C.bg,
          borderRight: `1px solid ${C.border}`,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <SidebarContent collapsed={false} onToggle={handleMobileNavClick} onNavigate={handleMobileNavClick} />
      </aside>
    </div>
  );
}
