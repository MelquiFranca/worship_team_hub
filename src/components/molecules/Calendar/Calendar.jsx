'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import styles from './Calendar.module.css';

const WEEKDAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];

function pad(value) {
  return String(value).padStart(2, '0');
}

function toIsoDate(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return '';
  }

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function fromDateLike(value) {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : new Date(value.getFullYear(), value.getMonth(), value.getDate());
  }

  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) {
    return null;
  }

  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }

  return date;
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date, amount) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function isSameDay(left, right) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function isSameMonth(left, right) {
  return left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth();
}

function isBeforeDay(left, right) {
  const leftTime = new Date(left.getFullYear(), left.getMonth(), left.getDate()).getTime();
  const rightTime = new Date(right.getFullYear(), right.getMonth(), right.getDate()).getTime();
  return leftTime < rightTime;
}

function isAfterDay(left, right) {
  const leftTime = new Date(left.getFullYear(), left.getMonth(), left.getDate()).getTime();
  const rightTime = new Date(right.getFullYear(), right.getMonth(), right.getDate()).getTime();
  return leftTime > rightTime;
}

function formatMonthLabel(date) {
  return new Intl.DateTimeFormat('pt-BR', {
    month: 'long',
    year: 'numeric'
  }).format(date);
}

function formatMonthName(date) {
  return new Intl.DateTimeFormat('pt-BR', {
    month: 'long'
  }).format(date);
}

function formatSelectedDate(date) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(date);
}

function getDaysInMonth(year, monthIndex) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

function setYearPreservingDate(currentDate, targetYear) {
  const monthIndex = currentDate.getMonth();
  const safeDay = Math.min(currentDate.getDate(), getDaysInMonth(targetYear, monthIndex));
  return new Date(targetYear, monthIndex, safeDay);
}

function buildCalendarDays(viewDate) {
  const firstDay = startOfMonth(viewDate);
  const startWeekday = firstDay.getDay();
  const totalDays = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
  const days = [];

  for (let index = 0; index < startWeekday; index += 1) {
    days.push(null);
  }

  for (let day = 1; day <= totalDays; day += 1) {
    days.push(new Date(viewDate.getFullYear(), viewDate.getMonth(), day));
  }

  while (days.length % 7 !== 0) {
    days.push(null);
  }

  return days;
}

export default function Calendar({
  id,
  label,
  value,
  onChange,
  placeholder = 'Selecione uma data',
  required = false,
  error = '',
  helperText = '',
  name,
  disabled = false,
  minDate,
  maxDate
}) {
  const generatedId = useId();
  const fieldId = id || generatedId;
  const labelId = `${fieldId}-label`;
  const panelId = `${fieldId}-calendar`;
  const rootRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => fromDateLike(value) || new Date());
  const resolvedLabel = label || placeholder || 'Selecionar data';

  const selectedDate = useMemo(() => fromDateLike(value), [value]);
  const minDateValue = useMemo(() => (minDate ? fromDateLike(minDate) : null), [minDate]);
  const maxDateValue = useMemo(() => (maxDate ? fromDateLike(maxDate) : null), [maxDate]);
  const yearOptions = useMemo(() => {
    const currentYear = viewDate.getFullYear();
    const startYear = minDateValue ? minDateValue.getFullYear() : currentYear - 100;
    const endYear = maxDateValue ? maxDateValue.getFullYear() : currentYear + 20;
    const normalizedStart = Math.min(startYear, endYear);
    const normalizedEnd = Math.max(startYear, endYear);

    return Array.from({ length: normalizedEnd - normalizedStart + 1 }, (_, index) => normalizedStart + index);
  }, [maxDateValue, minDateValue, viewDate]);
  const describedBy = useMemo(
    () =>
      [helperText ? `${fieldId}-description` : null, error ? `${fieldId}-error` : null]
        .filter(Boolean)
        .join(' '),
    [error, fieldId, helperText]
  );

  useEffect(() => {
    if (!isOpen) {
      setViewDate(selectedDate || new Date());
    }
  }, [isOpen, selectedDate]);

  useEffect(() => {
    function onPointerDown(event) {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('pointerdown', onPointerDown);
    }

    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [isOpen]);

  const calendarDays = useMemo(() => buildCalendarDays(viewDate), [viewDate]);

  const previousMonth = addMonths(viewDate, -1);
  const nextMonth = addMonths(viewDate, 1);
  const isPreviousDisabled =
    Boolean(minDateValue) &&
    isBeforeDay(previousMonth, startOfMonth(minDateValue)) &&
    !isSameMonth(previousMonth, minDateValue);
  const isNextDisabled =
    Boolean(maxDateValue) &&
    isAfterDay(nextMonth, startOfMonth(maxDateValue)) &&
    !isSameMonth(nextMonth, maxDateValue);

  function handleToggle() {
    if (disabled) {
      return;
    }

    setViewDate(selectedDate || new Date());
    setIsOpen((current) => !current);
  }

  function handleSelect(date) {
    onChange(date);
    setViewDate(date);
    setIsOpen(false);
  }

  function isDateDisabled(date) {
    if (disabled) {
      return true;
    }

    if (minDateValue && isBeforeDay(date, minDateValue)) {
      return true;
    }

    if (maxDateValue && isAfterDay(date, maxDateValue)) {
      return true;
    }

    return false;
  }

  function handleYearChange(event) {
    const nextYear = Number(event.target.value);
    if (!Number.isInteger(nextYear)) {
      return;
    }

    setViewDate((current) => setYearPreservingDate(current, nextYear));
  }

  return (
    <div className={styles.calendarField} ref={rootRef}>
      {label ? (
        <span className={styles.label} id={labelId}>
          {label}
          {required ? <span aria-hidden="true"> *</span> : null}
        </span>
      ) : null}

      <div className={styles.controlWrap}>
        <button
          id={fieldId}
          type="button"
          className={`${styles.trigger} ${error ? styles.triggerError : ''}`}
          onClick={handleToggle}
          aria-haspopup="dialog"
          aria-expanded={isOpen}
          aria-controls={panelId}
          aria-labelledby={label ? labelId : undefined}
          aria-label={resolvedLabel}
          aria-describedby={describedBy || undefined}
          disabled={disabled}
        >
          <span className={selectedDate ? styles.triggerValue : styles.triggerPlaceholder}>
            {selectedDate ? formatSelectedDate(selectedDate) : placeholder}
          </span>
          <span className={styles.triggerIcon} aria-hidden="true">
            ▾
          </span>
        </button>

        {isOpen ? (
          <div className={styles.popover} id={panelId} role="dialog" aria-label={resolvedLabel}>
            <div className={styles.popoverHeader}>
              <button
                type="button"
                className={styles.navButton}
                onClick={() => setViewDate((current) => addMonths(current, -1))}
                disabled={isPreviousDisabled}
                aria-label="Mês anterior"
              >
                Anterior
              </button>

              <div className={styles.headerCenter}>
                <strong className={styles.monthLabel}>{formatMonthName(viewDate)}</strong>
                <label htmlFor={`${fieldId}-year`} className={styles.yearLabel}>
                  Ano
                </label>
                <select
                  id={`${fieldId}-year`}
                  className={styles.yearSelect}
                  value={viewDate.getFullYear()}
                  onChange={handleYearChange}
                  aria-label="Selecionar ano do calendário"
                >
                  {yearOptions.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                className={styles.navButton}
                onClick={() => setViewDate((current) => addMonths(current, 1))}
                disabled={isNextDisabled}
                aria-label="Próximo mês"
              >
                Próximo
              </button>
            </div>

            <div className={styles.weekdays} aria-hidden="true">
              {WEEKDAY_LABELS.map((weekday) => (
                <span key={weekday}>{weekday}</span>
              ))}
            </div>

            <div className={styles.grid} role="grid" aria-label={`Dias de ${formatMonthLabel(viewDate)}`}>
              {calendarDays.map((date, index) => {
                if (!date) {
                  return <span key={`empty-${index}`} className={styles.emptyCell} aria-hidden="true" />;
                }

                const selected = selectedDate ? isSameDay(date, selectedDate) : false;
                const disabledDay = isDateDisabled(date);

                return (
                  <button
                    key={date.toISOString()}
                    type="button"
                    className={`${styles.dayButton} ${selected ? styles.dayButtonSelected : ''}`}
                    onClick={() => handleSelect(date)}
                    disabled={disabledDay}
                    aria-pressed={selected}
                    aria-label={new Intl.DateTimeFormat('pt-BR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    }).format(date)}
                  >
                    {date.getDate()}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>

      {helperText ? (
        <p className={styles.helper} id={`${fieldId}-description`}>
          {helperText}
        </p>
      ) : null}
      {error ? (
        <p className={styles.error} id={`${fieldId}-error`}>
          {error}
        </p>
      ) : null}

      {name ? (
        <input
          type="hidden"
          name={name}
          value={toIsoDate(selectedDate)}
          readOnly
        />
      ) : null}
    </div>
  );
}
