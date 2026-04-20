'use client';

import { useEffect, useMemo, useState } from 'react';
import { requestJson } from '@/lib/api/http';
import { useAuthSession } from '@/context/AuthSessionContext';
import styles from './ComponentUnavailabilityForm.module.css';

const WEEKDAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];

function pad(value) {
  return String(value).padStart(2, '0');
}

function getTomorrowDate() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
}

function toIsoDate(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function fromIsoDate(value) {
  if (typeof value !== 'string') {
    return null;
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

function buildCalendarDays(viewDate) {
  const firstDay = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
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

function formatMonthLabel(date) {
  return new Intl.DateTimeFormat('pt-BR', {
    month: 'long',
    year: 'numeric'
  }).format(date);
}

function formatDateLabel(date) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(date);
}

export default function ComponentUnavailabilityForm() {
  const { permissions } = useAuthSession();
  const minSelectableDate = useMemo(() => getTomorrowDate(), []);
  const minSelectableIso = useMemo(() => toIsoDate(minSelectableDate), [minSelectableDate]);
  const [viewDate, setViewDate] = useState(() => getTomorrowDate());
  const [selectedDates, setSelectedDates] = useState([]);
  const [feedback, setFeedback] = useState({ type: 'idle', message: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const selectedSet = useMemo(() => new Set(selectedDates), [selectedDates]);
  const calendarDays = useMemo(() => buildCalendarDays(viewDate), [viewDate]);
  const sortedSelectedDates = useMemo(() => [...selectedDates].sort((left, right) => left.localeCompare(right)), [selectedDates]);
  const startOfMinMonth = useMemo(
    () => new Date(minSelectableDate.getFullYear(), minSelectableDate.getMonth(), 1),
    [minSelectableDate]
  );
  const previousMonthDate = useMemo(() => new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1), [viewDate]);
  const isPreviousMonthDisabled = previousMonthDate.getTime() < startOfMinMonth.getTime();
  const profileLabel = permissions?.isGroupApp ? 'Perfil do grupo' : 'Perfil do componente';

  useEffect(() => {
    let active = true;

    async function loadAvailability() {
      setIsLoading(true);
      setFeedback({ type: 'idle', message: '' });

      try {
        const payload = await requestJson('/api/components/me/unavailability');
        const unavailableDates = Array.isArray(payload?.item?.unavailableDates) ? payload.item.unavailableDates : [];

        if (!active) {
          return;
        }

        const normalized = unavailableDates
          .map((entry) => (typeof entry === 'string' ? entry.trim() : ''))
          .filter((entry) => Boolean(entry) && entry >= minSelectableIso)
          .sort((left, right) => left.localeCompare(right));

        setSelectedDates(normalized);
      } catch (error) {
        if (!active) {
          return;
        }

        setFeedback({
          type: 'error',
          message: error instanceof Error ? error.message : 'Nao foi possivel carregar sua indisponibilidade.'
        });
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    loadAvailability();

    return () => {
      active = false;
    };
  }, [minSelectableIso]);

  function toggleDate(date) {
    const isoDate = toIsoDate(date);
    if (isoDate < minSelectableIso) {
      return;
    }

    setFeedback({ type: 'idle', message: '' });
    setSelectedDates((current) => {
      const next = new Set(current);

      if (next.has(isoDate)) {
        next.delete(isoDate);
      } else {
        next.add(isoDate);
      }

      return Array.from(next).sort((left, right) => left.localeCompare(right));
    });
  }

  async function handleSave() {
    const futureDates = sortedSelectedDates.filter((date) => date >= minSelectableIso);

    setIsSaving(true);
    setFeedback({ type: 'idle', message: '' });

    try {
      const payload = await requestJson('/api/components/me/unavailability', {
        method: 'PATCH',
        body: { unavailableDates: futureDates }
      });

      setSelectedDates(futureDates);

      setFeedback({
        type: 'success',
        message:
          typeof payload?.message === 'string' && payload.message.trim()
            ? payload.message.trim()
            : 'Dias indisponiveis atualizados com sucesso.'
      });
    } catch (error) {
      setFeedback({
        type: 'error',
        message: error instanceof Error ? error.message : 'Nao foi possivel salvar sua indisponibilidade.'
      });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className={styles.card} aria-labelledby="component-unavailability-title">
      <div className={styles.header}>
        <p className={styles.kicker}>{profileLabel}</p>
        <h1 id="component-unavailability-title" className={styles.title}>
          Minha indisponibilidade
        </h1>
        <p className={styles.description}>
          Toque nos dias futuros em que voce nao pode servir. Dias marcados ficam destacados.
        </p>
      </div>

      {feedback.message ? (
        <p
          className={`${styles.feedback} ${feedback.type === 'error' ? styles.feedbackError : styles.feedbackSuccess}`}
          role={feedback.type === 'error' ? 'alert' : 'status'}
          aria-live="polite"
        >
          {feedback.message}
        </p>
      ) : null}

      <div className={styles.calendarCard} aria-busy={isLoading || isSaving}>
        <div className={styles.calendarHeader}>
          <button
            type="button"
            className={styles.navButton}
            onClick={() => setViewDate((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))}
            disabled={isLoading || isSaving || isPreviousMonthDisabled}
          >
            Anterior
          </button>

          <strong className={styles.monthLabel}>{formatMonthLabel(viewDate)}</strong>

          <button
            type="button"
            className={styles.navButton}
            onClick={() => setViewDate((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))}
            disabled={isLoading || isSaving}
          >
            Proximo
          </button>
        </div>

        <div className={styles.weekdays} aria-hidden="true">
          {WEEKDAY_LABELS.map((weekday) => (
            <span key={weekday}>{weekday}</span>
          ))}
        </div>

        <div className={styles.grid} role="grid" aria-label={`Calendario de ${formatMonthLabel(viewDate)}`}>
          {calendarDays.map((date, index) => {
            if (!date) {
              return <span key={`empty-${index}`} className={styles.emptyCell} aria-hidden="true" />;
            }

            const isoDate = toIsoDate(date);
            const isSelected = selectedSet.has(isoDate);
            const isDisabledDay = isoDate < minSelectableIso;

            return (
              <button
                key={isoDate}
                type="button"
                className={`${styles.dayButton} ${isSelected ? styles.dayButtonSelected : ''}`}
                onClick={() => toggleDate(date)}
                disabled={isLoading || isSaving || isDisabledDay}
                aria-pressed={isSelected}
                aria-label={`${isSelected ? 'Remover indisponibilidade em' : 'Marcar indisponibilidade em'} ${formatDateLabel(
                  date
                )}`}
              >
                {date.getDate()}
              </button>
            );
          })}
        </div>
      </div>

      <div className={styles.footer}>
        <p className={styles.counter}>
          {sortedSelectedDates.length === 1
            ? '1 dia marcado como indisponivel.'
            : `${sortedSelectedDates.length} dias marcados como indisponiveis.`}
        </p>
        <button type="button" className={styles.saveButton} onClick={handleSave} disabled={isLoading || isSaving}>
          {isSaving ? 'Salvando...' : 'Salvar indisponibilidade'}
        </button>
      </div>

      {sortedSelectedDates.length > 0 ? (
        <ul className={styles.selectedList} aria-label="Dias indisponiveis selecionados">
          {sortedSelectedDates.map((isoDate) => {
            const parsedDate = fromIsoDate(isoDate);

            return (
              <li key={isoDate} className={styles.selectedItem}>
                <span>{parsedDate ? formatDateLabel(parsedDate) : isoDate}</span>
                <button
                  type="button"
                  className={styles.removeButton}
                  onClick={() => {
                    setFeedback({ type: 'idle', message: '' });
                    setSelectedDates((current) => current.filter((entry) => entry !== isoDate));
                  }}
                  disabled={isLoading || isSaving}
                >
                  Remover
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </section>
  );
}
