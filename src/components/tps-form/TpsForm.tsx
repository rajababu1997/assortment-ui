import { Info, Sparkles, ChevronDown, type LucideIcon } from 'lucide-react';
import { logger } from '@/lib/logger';
import { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import type { ResolvedField, FormLayout, FormMode } from './tpsFormInterfaceTypes';
import { FIELD_MAP } from './fields';
import { motion, AnimatePresence } from 'framer-motion';

interface TpsFormProps {
  form: UseFormReturn<any>;
  fields: ResolvedField[];
  mode: FormMode;
  layout?: FormLayout;
  columns?: 1 | 2 | 3;
  className?: string;
  /** When true, form body scrolls and footer stays pinned. Parent must provide a constrained height. */
  scrollable?: boolean;
  /** Header content (e.g. title, back button). Rendered above the form body, pinned when scrollable. */
  header?: ReactNode;
  /** Footer content (e.g. action buttons). Rendered below the form, pinned when scrollable. */
  footer?: ReactNode;
  /** Show sticky section navigation bar for forms with 4+ sections */
  showSectionNav?: boolean;
  /** Hide the "Fields marked with (*) are mandatory" info banner */
  hideInfoBanner?: boolean;
}

interface FieldSection {
  title: string;
  icon?: LucideIcon;
  color?: 'primary' | 'info' | 'success' | 'warning' | 'danger' | 'purple';
  description?: string;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  aiPowered?: boolean;
  fields: ResolvedField[];
}

/** Color palette for section icon pills */
const SECTION_COLORS: Record<string, { bg: string; text: string }> = {
  primary: { bg: 'var(--color-primary-50)', text: 'var(--color-primary-700)' },
  info:    { bg: 'var(--color-info-50)',    text: 'var(--color-info-700)' },
  success: { bg: 'var(--color-success-50)', text: 'var(--color-success-700)' },
  warning: { bg: 'var(--color-warning-50)', text: 'var(--color-warning-700)' },
  danger:  { bg: 'var(--color-danger-50)',  text: 'var(--color-danger-700)' },
  purple:  { bg: 'var(--color-purple-50)',  text: 'var(--color-purple-700)' },
};

/** Auto-assign color based on section index if not explicitly set */
const COLOR_ROTATION: Array<'primary' | 'info' | 'success' | 'warning' | 'purple' | 'danger'> = [
  'primary', 'info', 'success', 'warning', 'purple', 'danger',
];

function groupBySection(fields: ResolvedField[]): FieldSection[] {
  const sections: FieldSection[] = [];
  let currentSection: FieldSection | null = null;

  for (const field of fields) {
    if (field.section && field.section !== currentSection?.title) {
      currentSection = {
        title: field.section,
        icon: field.sectionIcon,
        color: field.sectionColor,
        description: field.sectionDescription,
        collapsible: field.sectionCollapsible,
        defaultCollapsed: field.sectionDefaultCollapsed,
        aiPowered: field.sectionAiPowered,
        fields: [],
      };
      sections.push(currentSection);
    }

    if (!currentSection) {
      currentSection = { title: '', icon: undefined, fields: [] };
      sections.push(currentSection);
    }

    currentSection.fields.push(field);
  }

  return sections;
}

/* ── Collapse animation variants ─────────────────────────────────────────── */
const collapseVariants = {
  open: { height: 'auto', opacity: 1, transition: { duration: 0.25, ease: [0.4, 0, 0.2, 1] } },
  collapsed: { height: 0, opacity: 0, transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] } },
};

/* ── Section Nav ─────────────────────────────────────────────────────────── */
function SectionNav({ sections, activeIndex, onSelect }: {
  sections: FieldSection[];
  activeIndex: number;
  onSelect: (idx: number) => void;
}) {
  const titled = sections.filter((s) => s.title);
  if (titled.length < 4) return null;

  return (
    <div className="tps-form-section-nav sticky top-0 z-10 mb-4">
      {titled.map((s, i) => (
        <button
          key={s.title}
          type="button"
          className={`tps-form-section-nav__item ${activeIndex === i ? 'tps-form-section-nav__item--active' : ''}`}
          onClick={() => onSelect(i)}
        >
          {s.title}
        </button>
      ))}
    </div>
  );
}

/* ── Single Section Card ─────────────────────────────────────────────────── */
function FormSectionCard({
  section,
  sectionIdx,
  columns,
  layout,
  mode,
  form,
  sectionRef,
}: {
  section: FieldSection;
  sectionIdx: number;
  columns: 1 | 2 | 3;
  layout: FormLayout;
  mode: FormMode;
  form: UseFormReturn<any>;
  sectionRef?: (el: HTMLDivElement | null) => void;
}) {
  const [collapsed, setCollapsed] = useState(section.defaultCollapsed ?? false);
  const isCollapsible = section.collapsible ?? false;
  const hasTitle = !!section.title;

  const fieldsContent = (
    <div className="flex flex-wrap w-full justify-between">
      {section.fields.map((field) => {
        const Component = FIELD_MAP[field.type];
        if (!Component) {
          logger.warn(`[DynamicForm] Unknown field type: "${field.type}" for field "${field.fieldName}"`);
          return null;
        }

        const isFullRow = field.colSpan === 2 || columns === 1;

        return (
          <div
            key={field.fieldName}
            className={`w-full mb-[0.75rem] ${isFullRow ? 'md:w-full' : 'md:w-[43%]'}`}
          >
            <Component
              field={field}
              form={form}
              layout={layout}
              mode={mode}
            />
          </div>
        );
      })}
    </div>
  );

  /* No title = untitled section, render fields without card wrapper */
  if (!hasTitle) {
    return <div ref={sectionRef}>{fieldsContent}</div>;
  }

  return (
    <div className="tps-form-section" ref={sectionRef}>
      {/* Section Header — colored icon + title + left border accent */}
      {(() => {
        const colorKey = section.color ?? 'info';
        const colors = SECTION_COLORS[colorKey] ?? SECTION_COLORS.primary;
        return (
      <div
        className={`tps-form-section__header ${isCollapsible ? 'tps-form-section__header--collapsible' : ''}`}
        style={{ borderBottom: `1px solid ${colors.text}` }}
        onClick={isCollapsible ? () => setCollapsed((c) => !c) : undefined}
        role={isCollapsible ? 'button' : undefined}
        aria-expanded={isCollapsible ? !collapsed : undefined}
        tabIndex={isCollapsible ? 0 : undefined}
        onKeyDown={isCollapsible ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setCollapsed((c) => !c); } } : undefined}
      >
        {section.icon && (
          <div
            className="tps-form-section__icon"
            style={{ background: colors.bg, color: colors.text }}
          >
            <section.icon size={14} strokeWidth={2} />
          </div>
        )}
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            <span className="tps-form-section__title" style={{ color: colors.text }}>{section.title}</span>
            {section.aiPowered && (
              <span
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[0.625rem] font-bold uppercase tracking-wider text-white shrink-0"
                style={{ background: 'linear-gradient(135deg, var(--color-info-500), var(--color-purple-500))' }}
              >
                <Sparkles size={16} strokeWidth={2} className="text-[0.5rem]" />
                AI
              </span>
            )}
          </div>
          {section.description && (
            <span className="tps-form-section__description">{section.description}</span>
          )}
        </div>
        {isCollapsible && (
          <ChevronDown size={14} strokeWidth={2} className={`tps-form-section__chevron ${!collapsed ? 'tps-form-section__chevron--expanded' : ''}`} />
        )}
      </div>
        );
      })()}

      {/* Section Body — animated collapse */}
      {isCollapsible ? (
        <AnimatePresence initial={false}>
          {!collapsed && (
            <motion.div
              key="body"
              initial="collapsed"
              animate="open"
              exit="collapsed"
              variants={collapseVariants}
              style={{ overflow: 'hidden' }}
            >
              <div className="tps-form-section__body">
                {fieldsContent}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      ) : (
        <div className="tps-form-section__body">
          {fieldsContent}
        </div>
      )}
    </div>
  );
}

/* ── Main TpsForm Component ──────────────────────────────────────────────── */
export function TpsForm({
  form,
  fields,
  mode,
  layout = 'row',
  columns = 2,
  className = '',
  scrollable = false,
  header,
  footer,
  showSectionNav = false,
  hideInfoBanner = false,
}: TpsFormProps) {
  const visibleFields = useMemo(
    () => fields.filter((f) => f.show !== false),
    [fields]
  );

  const sections = useMemo(() => groupBySection(visibleFields), [visibleFields]);
  const titledSections = useMemo(() => sections.filter((s) => s.title), [sections]);

  /* ── Section nav: track active section via IntersectionObserver ───────── */
  const [activeNavIndex, setActiveNavIndex] = useState(0);
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const setSectionRef = useCallback(
    (idx: number) => (el: HTMLDivElement | null) => {
      sectionRefs.current[idx] = el;
    },
    []
  );

  useEffect(() => {
    if (!showSectionNav || titledSections.length < 4) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const idx = sectionRefs.current.indexOf(entry.target as HTMLDivElement);
            if (idx >= 0) setActiveNavIndex(idx);
          }
        }
      },
      { threshold: 0.3, root: scrollContainerRef.current }
    );

    sectionRefs.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [showSectionNav, titledSections.length]);

  const handleNavSelect = useCallback((idx: number) => {
    const el = sectionRefs.current[idx];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveNavIndex(idx);
    }
  }, []);

  /* ── Determine if this is a "compact" form (few fields, no sections — typical dialog) */
  const isCompact = titledSections.length === 0 && visibleFields.length <= 8;

  /* ── Form fields content ─────────────────────────────────────────────── */
  const formContent = (
    <div className={scrollable ? `flex flex-col ${isCompact ? 'gap-2' : 'gap-5'}` : `flex flex-col ${isCompact ? 'gap-2' : 'gap-5'} ${className}`}>
      {/* Required fields note (only in create/edit mode, unless hidden by parent) */}
      {mode !== 'view' && !hideInfoBanner && (
        <div className={`tps-form-info-banner ${isCompact ? 'tps-form-info-banner--compact' : ''}`}>
          <Info size={16} strokeWidth={2} className="text-sm flex-shrink-0" />
          <span>Fields marked with (<span className="font-bold text-[var(--color-danger)]">*</span>) are mandatory</span>
        </div>
      )}

      {/* Section Nav — sticky at top */}
      {showSectionNav && (
        <SectionNav
          sections={titledSections}
          activeIndex={activeNavIndex}
          onSelect={handleNavSelect}
        />
      )}

      {/* Section Cards */}
      {sections.map((section, sIdx) => (
        <FormSectionCard
          key={section.title || sIdx}
          section={section}
          sectionIdx={sIdx}
          columns={columns}
          layout={layout}
          mode={mode}
          form={form}
          sectionRef={section.title ? setSectionRef(sections.filter((s, i) => s.title && i <= sIdx).length - 1) : undefined}
        />
      ))}
    </div>
  );

  /* ── Scrollable mode: flex-col container with scrollable body + pinned footer */
  if (scrollable) {
    return (
      <div className={`flex flex-col h-full min-h-0 overflow-hidden ${className}`}>
        {header && (
          <div className="shrink-0 px-[1.5rem] py-[0.75rem] border-b border-[var(--color-divider)]">
            {header}
          </div>
        )}
        <div
          ref={scrollContainerRef}
          className="flex-1 min-h-0 overflow-y-auto px-[1.5rem] py-[1rem]"
        >
          {formContent}
        </div>
        {footer && (
          <div className="shrink-0 px-[1.5rem] py-[0.5rem] border-t border-[var(--color-divider)]">
            {footer}
          </div>
        )}
      </div>
    );
  }

  /* ── Default mode: just render fields + optional footer inline */
  return (
    <>
      {header}
      {formContent}
      {footer}
    </>
  );
}
