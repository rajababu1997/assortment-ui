import { useState, useRef, useEffect, type CSSProperties, type MouseEvent as ReactMouseEvent } from 'react';
import { createPortal } from 'react-dom';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, ChevronUp, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ── Date utilities ──────────────────────────────────────────────────────────

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function formatDate(date: Date | null, showTime?: boolean): string {
  if (!date || isNaN(date.getTime())) return '';
  const day = date.getDate();
  const month = MONTHS[date.getMonth()];
  const year = date.getFullYear();
  if (!showTime) return `${day} ${month} ${year}`;
  const h = date.getHours();
  const m = date.getMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${day} ${month} ${year}, ${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ampm}`;
}

function isSameDay(d1: Date | null, d2: Date | null): boolean {
  if (!d1 || !d2) return false;
  return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
}

function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

// ── Time Spinner ─────────────────────────────────────────────────────────────

function TimeSpinner({
  value,
  min,
  max,
  onChange,
  label,
}: {
  value: number;
  min: number;
  max: number;
  onChange: (_v: number) => void;
  label: string;
}) {
  const increment = () => onChange(value >= max ? min : value + 1);
  const decrement = () => onChange(value <= min ? max : value - 1);

  const btnStyle: CSSProperties = {
    width: 28,
    height: 24,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: 'none',
    background: 'transparent',
    borderRadius: 4,
    cursor: 'pointer',
    color: '#64748B',
    transition: 'background .12s',
    padding: 0,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      <span
        style={{
          fontSize: 10,
          fontWeight: 500,
          color: '#94A3B8',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          marginBottom: 2,
        }}
      >
        {label}
      </span>
      <button
        style={btnStyle}
        onMouseEnter={(e) => (e.currentTarget.style.background = '#F1F5F9')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        onClick={increment}
      >
        <ChevronUp size={14} />
      </button>
      <div
        style={{
          width: 40,
          height: 32,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 16,
          fontWeight: 600,
          color: '#0F172A',
          fontFamily: 'Inter, sans-serif',
          background: '#F8FAFC',
          borderRadius: 6,
          border: '1px solid #E2E8F0',
          userSelect: 'none',
        }}
      >
        {String(value).padStart(2, '0')}
      </div>
      <button
        style={btnStyle}
        onMouseEnter={(e) => (e.currentTarget.style.background = '#F1F5F9')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        onClick={decrement}
      >
        <ChevronDown size={14} />
      </button>
    </div>
  );
}

// ── Calendar Component ──────────────────────────────────────────────────────

interface CalendarProps {
  value: Date | null;
  onChange: (_date: Date) => void;
  onClose: () => void;
  minDate?: Date;
  maxDate?: Date;
  showTime?: boolean;
}

function Calendar({ value, onChange, onClose, minDate, maxDate, showTime }: CalendarProps) {
  // Intelligently set initial view date: use value, fallback to maxDate (for age constraints), or today
  const getInitialViewDate = (): Date => {
    if (value) return value;
    if (maxDate) return maxDate instanceof Date ? maxDate : new Date(maxDate);
    return new Date();
  };

  const [viewDate, setViewDate] = useState(getInitialViewDate());
  const [selectedDay, setSelectedDay] = useState<{ year: number; month: number; day: number } | null>(
    value ? { year: value.getFullYear(), month: value.getMonth(), day: value.getDate() } : null
  );
  const [hour12, setHour12] = useState(() => {
    const h = value ? value.getHours() % 12 : 0;
    return h === 0 ? 12 : h;
  });
  const [minute, setMinute] = useState(() => (value ? value.getMinutes() : 0));
  const [ampm, setAmpm] = useState<'AM' | 'PM'>(() => (value ? (value.getHours() >= 12 ? 'PM' : 'AM') : 'AM'));

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  const buildDate = (y: number, mo: number, d: number, h12: number, min: number, ap: 'AM' | 'PM'): Date => {
    let hours = h12 % 12;
    if (ap === 'PM') hours += 12;
    return new Date(y, mo, d, hours, min, 0, 0);
  };

  const handleDayClick = (day: number) => {
    const date = new Date(year, month, day);
    if (minDate && date < new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate())) return;
    if (maxDate && date > new Date(maxDate.getFullYear(), maxDate.getMonth(), maxDate.getDate())) return;

    setSelectedDay({ year, month, day });
    if (!showTime) {
      onChange(new Date(year, month, day));
      onClose();
    }
  };

  const handleDone = () => {
    if (!selectedDay) return;
    const { year: y, month: mo, day: d } = selectedDay;
    onChange(buildDate(y, mo, d, hour12, minute, ampm));
    onClose();
  };

  const isDateDisabled = (day: number): boolean => {
    const date = new Date(year, month, day);
    if (minDate && date < new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate())) return true;
    if (maxDate && date > new Date(maxDate.getFullYear(), maxDate.getMonth(), maxDate.getDate())) return true;
    return false;
  };

  const isSelected = (day: number) =>
    selectedDay?.year === year && selectedDay?.month === month && selectedDay?.day === day;

  // ── Boundary helpers ──────────────────────────────────────────────────────
  const minYear = minDate ? minDate.getFullYear() : 1900;
  const maxYear = maxDate ? maxDate.getFullYear() : new Date().getFullYear();

  const yearOptions: number[] = [];
  for (let y = minYear; y <= maxYear; y++) yearOptions.push(y);

  // Only show months that fall within [minDate, maxDate] for the current year
  const allowedMonths = MONTHS.map((m, i) => {
    if (maxDate && year === maxDate.getFullYear() && i > maxDate.getMonth()) return null;
    if (minDate && year === minDate.getFullYear() && i < minDate.getMonth()) return null;
    return { label: m, index: i };
  }).filter(Boolean) as { label: string; index: number }[];

  const canGoPrev = !(minDate && year === minDate.getFullYear() && month === minDate.getMonth());
  const canGoNext = !(maxDate && year === maxDate.getFullYear() && month === maxDate.getMonth());

  const handlePrevMonth = () => {
    if (!canGoPrev) return;
    setViewDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    if (!canGoNext) return;
    setViewDate(new Date(year, month + 1, 1));
  };

  // When year changes via dropdown, clamp month to allowed range
  const handleYearChange = (newYear: number) => {
    let clampedMonth = month;
    if (maxDate && newYear === maxDate.getFullYear() && month > maxDate.getMonth()) {
      clampedMonth = maxDate.getMonth();
    }
    if (minDate && newYear === minDate.getFullYear() && month < minDate.getMonth()) {
      clampedMonth = minDate.getMonth();
    }
    setViewDate(new Date(newYear, clampedMonth, 1));
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: -10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -10 }}
      transition={{ duration: 0.15 }}
      style={{
        width: 300,
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: 12,
        boxShadow: '0 10px 40px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)',
        padding: '14px 14px 12px',
        fontFamily: 'Inter, sans-serif',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* ── Month/Year navigation ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
        <button
          onClick={handlePrevMonth}
          disabled={!canGoPrev}
          style={{
            width: 26,
            height: 26,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: 'none',
            background: 'transparent',
            borderRadius: 6,
            cursor: canGoPrev ? 'pointer' : 'not-allowed',
            color: canGoPrev ? '#64748B' : '#CBD5E1',
            opacity: canGoPrev ? 1 : 0.4,
          }}
          onMouseEnter={(e) => {
            if (canGoPrev) {
              e.currentTarget.style.background = '#F1F5F9';
              e.currentTarget.style.color = '#1E293B';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = canGoPrev ? '#64748B' : '#CBD5E1';
          }}
        >
          <ChevronLeft size={15} />
        </button>

        <select
          value={month}
          onChange={(e) => setViewDate(new Date(year, parseInt(e.target.value), 1))}
          style={{
            flex: 1,
            padding: '4px 6px',
            border: '1px solid #E2E8F0',
            borderRadius: 6,
            fontSize: 13,
            fontWeight: 500,
            fontFamily: 'Inter, sans-serif',
            color: '#0F172A',
            background: '#FFF',
            cursor: 'pointer',
            outline: 'none',
          }}
        >
          {allowedMonths.map((m) => (
            <option key={m.index} value={m.index}>
              {m.label}
            </option>
          ))}
        </select>

        <select
          value={year}
          onChange={(e) => handleYearChange(parseInt(e.target.value))}
          style={{
            padding: '4px 6px',
            border: '1px solid #E2E8F0',
            borderRadius: 6,
            fontSize: 13,
            fontWeight: 500,
            fontFamily: 'Inter, sans-serif',
            color: '#0F172A',
            background: '#FFF',
            cursor: 'pointer',
            outline: 'none',
            minWidth: 66,
          }}
        >
          {yearOptions.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>

        <button
          onClick={handleNextMonth}
          disabled={!canGoNext}
          style={{
            width: 26,
            height: 26,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: 'none',
            background: 'transparent',
            borderRadius: 6,
            cursor: canGoNext ? 'pointer' : 'not-allowed',
            color: canGoNext ? '#64748B' : '#CBD5E1',
            opacity: canGoNext ? 1 : 0.4,
          }}
          onMouseEnter={(e) => {
            if (canGoNext) {
              e.currentTarget.style.background = '#F1F5F9';
              e.currentTarget.style.color = '#1E293B';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = canGoNext ? '#64748B' : '#CBD5E1';
          }}
        >
          <ChevronRight size={15} />
        </button>
      </div>

      {/* ── Weekday headers ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 4 }}>
        {DAYS.map((d) => (
          <div
            key={d}
            style={{
              textAlign: 'center',
              fontSize: 10,
              fontWeight: 600,
              color: '#94A3B8',
              padding: '3px 0',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            {d}
          </div>
        ))}
      </div>

      {/* ── Calendar grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
        {days.map((day, idx) => {
          if (day === null) return <div key={`e-${idx}`} />;
          const sel = isSelected(day);
          const today = isToday(new Date(year, month, day));
          const disabled = isDateDisabled(day);
          return (
            <button
              key={day}
              onClick={() => !disabled && handleDayClick(day)}
              disabled={disabled}
              style={{
                width: '100%',
                aspectRatio: '1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: today && !sel ? '1.5px solid #3B82F6' : 'none',
                background: sel ? '#2563EB' : 'transparent',
                borderRadius: 7,
                fontSize: 12,
                fontWeight: sel ? 600 : 400,
                color: sel ? '#FFF' : disabled ? '#CBD5E1' : '#1E293B',
                cursor: disabled ? 'not-allowed' : 'pointer',
                transition: 'all .12s',
                fontFamily: 'Inter, sans-serif',
              }}
              onMouseEnter={(e) => {
                if (!disabled && !sel) e.currentTarget.style.background = '#F1F5F9';
              }}
              onMouseLeave={(e) => {
                if (!disabled && !sel) e.currentTarget.style.background = 'transparent';
              }}
            >
              {day}
            </button>
          );
        })}
      </div>

      {/* ── Time picker ── */}
      {showTime && (
        <>
          <div style={{ margin: '12px 0 10px', height: 1, background: '#F1F5F9' }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <TimeSpinner value={hour12} min={1} max={12} onChange={setHour12} label="Hr" />
            <span style={{ fontSize: 20, fontWeight: 700, color: '#CBD5E1', marginTop: 20 }}>:</span>
            <TimeSpinner value={minute} min={0} max={59} onChange={setMinute} label="Min" />
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, marginTop: 14 }}>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 500,
                  color: '#94A3B8',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  marginBottom: 2,
                }}
              >
                AM/PM
              </span>
              <button
                onClick={() => setAmpm((p) => (p === 'AM' ? 'PM' : 'AM'))}
                style={{
                  width: 44,
                  height: 32,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid #E2E8F0',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 600,
                  color: ampm === 'AM' ? '#2563EB' : '#9333EA',
                  background: ampm === 'AM' ? '#EFF6FF' : '#FAF5FF',
                  fontFamily: 'Inter, sans-serif',
                  transition: 'all .15s',
                }}
              >
                {ampm}
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── Footer ── */}
      <div
        style={{
          marginTop: 10,
          paddingTop: 10,
          borderTop: '1px solid #F1F5F9',
          display: 'flex',
          gap: 6,
          justifyContent: showTime ? 'space-between' : 'center',
        }}
      >
        <button
          onClick={() => {
            const today = new Date();
            if (minDate && today < minDate) return;
            if (maxDate && today > maxDate) return;
            if (showTime) {
              setSelectedDay({ year: today.getFullYear(), month: today.getMonth(), day: today.getDate() });
              setViewDate(today);
              setHour12(today.getHours() % 12 || 12);
              setMinute(today.getMinutes());
              setAmpm(today.getHours() >= 12 ? 'PM' : 'AM');
            } else {
              onChange(new Date(today.getFullYear(), today.getMonth(), today.getDate()));
              onClose();
            }
          }}
          style={{
            flex: 1,
            padding: '6px 10px',
            border: 'none',
            background: 'transparent',
            borderRadius: 6,
            fontSize: 12,
            fontWeight: 500,
            color: '#2563EB',
            cursor: 'pointer',
            transition: 'background .15s',
            fontFamily: 'Inter, sans-serif',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#EFF6FF';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
          }}
        >
          Today
        </button>
        {showTime && (
          <button
            onClick={handleDone}
            disabled={!selectedDay}
            style={{
              flex: 1,
              padding: '6px 10px',
              border: 'none',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
              background: selectedDay ? '#2563EB' : '#E2E8F0',
              color: selectedDay ? '#FFF' : '#94A3B8',
              cursor: selectedDay ? 'pointer' : 'not-allowed',
              transition: 'background .15s',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            Done
          </button>
        )}
      </div>
    </motion.div>
  );
}

// ── DatePicker Component ────────────────────────────────────────────────────

export interface DatePickerProps {
  value?: string | Date | null;
  onChange?: (_value: string) => void;
  minDate?: string | Date;
  maxDate?: string | Date;
  placeholder?: string;
  disabled?: boolean;
  hasError?: boolean;
  className?: string;
  showTime?: boolean;
}

export function DatePicker({
  value,
  onChange,
  minDate,
  maxDate,
  placeholder = 'Select date',
  disabled = false,
  hasError = false,
  className = '',
  showTime = false,
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [openAbove, setOpenAbove] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  const dateValue = value ? (typeof value === 'string' ? new Date(value) : value) : null;
  const isValidDate = dateValue && !isNaN(dateValue.getTime());

  const minDateObj = minDate ? (typeof minDate === 'string' ? new Date(minDate) : minDate) : undefined;
  const maxDateObj = maxDate ? (typeof maxDate === 'string' ? new Date(maxDate) : maxDate) : undefined;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      const insideContainer = containerRef.current?.contains(target);
      const insidePopup = popupRef.current?.contains(target);
      if (!insideContainer && !insidePopup) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleToggle = () => {
    if (disabled) return;
    if (!isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const calendarHeight = showTime ? 500 : 400;
      setOpenAbove(spaceBelow < calendarHeight && spaceAbove > spaceBelow);
    }
    setIsOpen(!isOpen);
  };

  const handleDateChange = (date: Date) => {
    if (showTime) {
      const y = date.getFullYear();
      const mo = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      const h = String(date.getHours()).padStart(2, '0');
      const min = String(date.getMinutes()).padStart(2, '0');
      onChange?.(`${y}-${mo}-${d}T${h}:${min}`);
    } else {
      const y = date.getFullYear();
      const mo = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      onChange?.(`${y}-${mo}-${d}`);
    }
  };

  const handleClear = (e: ReactMouseEvent) => {
    e.stopPropagation();
    onChange?.('');
  };

  return (
    <div ref={containerRef} style={{ position: 'relative' }} className={className}>
      <div
        onClick={handleToggle}
        style={{
          cursor: disabled ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          height: 36,
          padding: '0 10px',
          background: disabled ? '#F8FAFC' : '#FFFFFF',
          border: `1px solid ${hasError ? '#EF4444' : isOpen ? '#2563EB' : '#E2E8F0'}`,
          borderRadius: 8,
          transition: 'border-color .15s, box-shadow .15s',
          boxShadow: isOpen ? '0 0 0 3px rgba(37,99,235,0.1)' : 'none',
          whiteSpace: 'nowrap',
        }}
      >
        <CalendarIcon size={14} style={{ color: disabled ? '#CBD5E1' : '#64748B', flexShrink: 0 }} />
        <span
          style={{
            flex: 1,
            fontSize: 13,
            fontFamily: 'Inter, sans-serif',
            color: isValidDate ? '#1E293B' : '#94A3B8',
            fontWeight: isValidDate ? 700 : 400,
          }}
        >
          {isValidDate ? formatDate(dateValue, showTime) : placeholder}
        </span>
        {isValidDate && !disabled && (
          <button
            onClick={handleClear}
            style={{
              width: 18,
              height: 18,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: 'none',
              background: 'transparent',
              borderRadius: 4,
              cursor: 'pointer',
              color: '#94A3B8',
              padding: 0,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#F1F5F9';
              e.currentTarget.style.color = '#64748B';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = '#94A3B8';
            }}
          >
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
              <path d="M9 3L3 9M3 3L9 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </div>

      {isOpen &&
        !disabled &&
        createPortal(
          <div
            ref={popupRef}
            data-datepicker-calendar
            style={{
              position: 'fixed',
              zIndex: 999999,
              ...(openAbove
                ? { bottom: `${window.innerHeight - (containerRef.current?.getBoundingClientRect().top || 0) + 4}px` }
                : { top: `${(containerRef.current?.getBoundingClientRect().bottom || 0) + 4}px` }),
              left: `${containerRef.current?.getBoundingClientRect().left || 0}px`,
            }}
          >
            <AnimatePresence>
              <Calendar
                key="calendar"
                value={isValidDate ? dateValue : null}
                onChange={handleDateChange}
                onClose={() => setIsOpen(false)}
                minDate={minDateObj}
                maxDate={maxDateObj}
                showTime={showTime}
              />
            </AnimatePresence>
          </div>,
          document.body
        )}
    </div>
  );
}

export { formatDate };
