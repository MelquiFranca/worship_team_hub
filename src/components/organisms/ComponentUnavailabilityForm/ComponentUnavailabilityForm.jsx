'use client';

import { useEffect, useMemo, useState } from 'react';
import { requestJson } from '@/lib/api/http';
import { useAuthSession } from '@/context/AuthSessionContext';
import { useAppDataCache } from '@/context/AppDataCacheContext';
import { useActionFeedback } from '@/context/ToastContext';
import AppDataRefreshButton from '@/components/molecules/AppDataRefreshButton/AppDataRefreshButton';
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

function getInitials(name) {
  const value = typeof name === 'string' ? name.trim() : '';
  if (!value) {
    return '?';
  }

  const parts = value.split(/\s+/).filter(Boolean);

  if (parts.length === 1) {
    return parts[0].slice(0, 1).toUpperCase();
  }

  return `${parts[0].slice(0, 1)}${parts[parts.length - 1].slice(0, 1)}`.toUpperCase();
}

function getCategoryTagLabel(categoryTags, categoryTagId) {
  const found = categoryTags.find((entry) => entry?.id === categoryTagId);
  return found?.label || categoryTagId;
}

export default function ComponentUnavailabilityForm() {
  const { permissions, isLoading: isAuthLoading } = useAuthSession();
  const { groupSettings, componentUnavailability, myUnavailability, isHydrating, isRefreshing, error, refreshAppData } =
    useAppDataCache();
  const isGroupApp = Boolean(permissions?.isGroupApp);
  const minSelectableDate = useMemo(() => getTomorrowDate(), []);
  const minSelectableIso = useMemo(() => toIsoDate(minSelectableDate), [minSelectableDate]);
  const [viewDate, setViewDate] = useState(() => getTomorrowDate());
  const [selectedDates, setSelectedDates] = useState([]);
  const [selectedCategoryTagIdsByDate, setSelectedCategoryTagIdsByDate] = useState({});
  const [userCategoryTagIds, setUserCategoryTagIds] = useState([]);
  const [groupCategoryTags, setGroupCategoryTags] = useState([]);
  const [groupedItems, setGroupedItems] = useState([]);
  const [groupedTotalEntries, setGroupedTotalEntries] = useState(0);
  const [groupedFeedback, setGroupedFeedback] = useState({ type: 'idle', message: '' });
  const [, setFeedback] = useState({ type: 'idle', message: '' });
  const { showActionFeedback } = useActionFeedback();
  const [isLoading, setIsLoading] = useState(true);
  const [isGroupedLoading, setIsGroupedLoading] = useState(false);
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
  const profileLabel = isGroupApp ? 'Perfil do grupo' : 'Perfil do componente';

  useEffect(() => {
    if (isAuthLoading || isHydrating) {
      return;
    }

    const grouped = Array.isArray(componentUnavailability)
      ? componentUnavailability
          .map((item) => {
            const date = typeof item?.date === 'string' ? item.date.trim() : '';
            const components = Array.isArray(item?.components) ? item.components : [];

            if (!date) {
              return null;
            }

            return {
              date,
              components: components
                .map((component) => ({
                  componentId: typeof component?.componentId === 'string' ? component.componentId : '',
                  fullName: typeof component?.fullName === 'string' && component.fullName.trim() ? component.fullName.trim() : 'Sem nome',
                  photoUrl: typeof component?.photoUrl === 'string' ? component.photoUrl.trim() : ''
                }))
                .filter((component) => component.componentId)
            };
          })
          .filter(Boolean)
      : [];

    setGroupedItems(isGroupApp ? grouped : []);
    setGroupedTotalEntries(isGroupApp ? grouped.reduce((accumulator, item) => accumulator + item.components.length, 0) : 0);
    setGroupedFeedback({ type: 'idle', message: '' });
    setIsGroupedLoading(false);
    setGroupCategoryTags(Array.isArray(groupSettings?.categoryTags) ? groupSettings.categoryTags : []);

    const unavailableDates = Array.isArray(myUnavailability?.unavailableDates) ? myUnavailability.unavailableDates : [];
    const unavailabilityByDate = Array.isArray(myUnavailability?.unavailabilityByDate)
      ? myUnavailability.unavailabilityByDate
      : [];
    const categoryTagIds = Array.isArray(myUnavailability?.categoryTagIds)
      ? myUnavailability.categoryTagIds.filter((entry) => typeof entry === 'string' && entry.trim())
      : [];

    const normalizedByDateDates = unavailabilityByDate
      .map((entry) => (typeof entry?.date === 'string' ? entry.date.trim() : ''))
      .filter((entry) => Boolean(entry) && entry >= minSelectableIso);
    const normalizedLegacyDates = unavailableDates
      .map((entry) => (typeof entry === 'string' ? entry.trim() : ''))
      .filter((entry) => Boolean(entry) && entry >= minSelectableIso);
    const normalized = Array.from(new Set(normalizedByDateDates.length > 0 ? normalizedByDateDates : normalizedLegacyDates)).sort((left, right) => left.localeCompare(right));

    setSelectedDates(normalized);
    setUserCategoryTagIds(categoryTagIds);
    setSelectedCategoryTagIdsByDate(() => {
      const next = {};
      unavailabilityByDate.forEach((entry) => {
        if (!entry || typeof entry !== 'object') {
          return;
        }

        const date = typeof entry.date === 'string' ? entry.date.trim() : '';
        const categoryIds = Array.isArray(entry.categoryTagIds)
          ? entry.categoryTagIds.filter((item) => typeof item === 'string' && item.trim())
          : [];

        if (date && categoryIds.length > 0) {
          next[date] = categoryIds;
        }
      });

      normalized.forEach((date) => {
        if (!next[date]) {
          next[date] = categoryTagIds;
        }
      });

      return next;
    });
    setIsLoading(false);
  }, [componentUnavailability, groupSettings, isAuthLoading, isGroupApp, isHydrating, myUnavailability, minSelectableIso]);

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
        setSelectedCategoryTagIdsByDate((currentMap) => {
          const nextMap = { ...currentMap };
          delete nextMap[isoDate];
          return nextMap;
        });
      } else {
        next.add(isoDate);
        setSelectedCategoryTagIdsByDate((currentMap) => ({
          ...currentMap,
          [isoDate]: currentMap[isoDate]?.length ? currentMap[isoDate] : userCategoryTagIds
        }));
      }

      return Array.from(next).sort((left, right) => left.localeCompare(right));
    });
  }

  async function handleSave() {
    const futureDates = sortedSelectedDates.filter((date) => date >= minSelectableIso);
    const unavailabilityByDate = futureDates.map((date) => ({
      date,
      categoryTagIds: selectedCategoryTagIdsByDate[date]?.length
        ? selectedCategoryTagIdsByDate[date]
        : userCategoryTagIds
    }));

    const hasInvalidCategorySelection = unavailabilityByDate.some(
      (entry) => !Array.isArray(entry.categoryTagIds) || entry.categoryTagIds.length === 0
    );

    if (hasInvalidCategorySelection) {
      setFeedback({
        type: 'error',
        message: 'Selecione ao menos uma categoria para cada data marcada.'
      });
      return;
    }

    setIsSaving(true);
    setFeedback({ type: 'idle', message: '' });

    try {
      const payload = await requestJson('/api/components/me/unavailability', {
        method: 'PATCH',
        body: { unavailabilityByDate }
      });

      setSelectedDates(futureDates);

      setFeedback({
        type: 'success',
        message:
          typeof payload?.message === 'string' && payload.message.trim()
            ? payload.message.trim()
            : 'Dias indisponiveis atualizados com sucesso.'
      });
      showActionFeedback({
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
      showActionFeedback({
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
          {isGroupApp ? 'Minha indisponibilidade e equipe' : 'Minha indisponibilidade'}
        </h1>
        <p className={styles.description}>
          {isGroupApp
            ? 'Marque sua indisponibilidade e acompanhe as indisponibilidades futuras da equipe agrupadas por data.'
            : 'Toque nos dias futuros em que voce nao pode servir. Dias marcados ficam destacados.'}
        </p>
        {error ? (
          <div className={styles.headerError} role="status" aria-live="polite">
            <p className={styles.feedbackError}>{error}</p>
            <AppDataRefreshButton onClick={refreshAppData} isRefreshing={isRefreshing} label="Atualizar" compact />
          </div>
        ) : null}
      </div>

      <div className={styles.calendarCard} aria-busy={isLoading || isSaving || isHydrating}>
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
            const selectedCategoryTagIds = selectedCategoryTagIdsByDate[isoDate] || userCategoryTagIds;

            return (
              <li key={isoDate} className={styles.selectedItem}>
                <div className={styles.selectedItemBody}>
                  <span>{parsedDate ? formatDateLabel(parsedDate) : isoDate}</span>
                  <div className={styles.selectedCategoryTags}>
                    {groupCategoryTags
                      .filter((tag) => userCategoryTagIds.includes(tag.id))
                      .map((tag) => {
                        const checked = selectedCategoryTagIds.includes(tag.id);
                        return (
                          <label key={`${isoDate}-${tag.id}`} className={styles.selectedCategoryCheck}>
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => {
                                setFeedback({ type: 'idle', message: '' });
                                setSelectedCategoryTagIdsByDate((current) => {
                                  const currentIds = current[isoDate] || userCategoryTagIds;
                                  const nextIds = currentIds.includes(tag.id)
                                    ? currentIds.filter((id) => id !== tag.id)
                                    : [...currentIds, tag.id];
                                  return {
                                    ...current,
                                    [isoDate]: nextIds
                                  };
                                });
                              }}
                              disabled={isLoading || isSaving}
                            />
                            <span>{getCategoryTagLabel(groupCategoryTags, tag.id)}</span>
                          </label>
                        );
                      })}
                  </div>
                </div>
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

      {isGroupApp ? (
        <div className={styles.groupedCard} aria-busy={isGroupedLoading}>
          <h2 className={styles.groupedSectionTitle}>Indisponibilidades da equipe</h2>
          {groupedFeedback.message ? (
            <p
              className={`${styles.feedback} ${
                groupedFeedback.type === 'error' ? styles.feedbackError : styles.feedbackSuccess
              }`}
              role={groupedFeedback.type === 'error' ? 'alert' : 'status'}
              aria-live="polite"
            >
              {groupedFeedback.message}
            </p>
          ) : null}
          {isGroupedLoading ? (
            <p className={styles.groupedStatus} role="status" aria-live="polite">
              Carregando indisponibilidades agrupadas...
            </p>
          ) : groupedItems.length === 0 ? (
            <p className={styles.groupedStatus} role="status" aria-live="polite">
              Nenhuma indisponibilidade futura registrada para os componentes.
            </p>
          ) : (
            <>
              <p className={styles.groupedSummary}>
                {groupedItems.length === 1
                  ? '1 data com indisponibilidade cadastrada.'
                  : `${groupedItems.length} datas com indisponibilidade cadastrada.`}{' '}
                {groupedTotalEntries === 1 ? '(1 registro no total).' : `(${groupedTotalEntries} registros no total).`}
              </p>
              <ul className={styles.groupedList} aria-label="Indisponibilidades dos componentes agrupadas por data">
                {groupedItems.map((item) => {
                  const parsedDate = fromIsoDate(item.date);

                  return (
                    <li key={item.date} className={styles.groupedItem}>
                      <div className={styles.groupedItemHeader}>
                        <h3 className={styles.groupedDateTitle}>{parsedDate ? formatDateLabel(parsedDate) : item.date}</h3>
                        <span className={styles.groupedCount}>
                          {item.components.length === 1
                            ? '1 componente indisponivel'
                            : `${item.components.length} componentes indisponiveis`}
                        </span>
                      </div>

                      <ul className={styles.groupedComponents} aria-label={`Componentes indisponiveis em ${item.date}`}>
                        {item.components.map((component) => (
                          <li key={`${item.date}-${component.componentId}`} className={styles.groupedComponentItem}>
                            {component.photoUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={component.photoUrl}
                                alt={`Avatar de ${component.fullName}`}
                                className={styles.groupedAvatar}
                                loading="lazy"
                              />
                            ) : (
                              <span className={styles.groupedAvatarFallback} aria-hidden="true">
                                {getInitials(component.fullName)}
                              </span>
                            )}
                            <span>{component.fullName}</span>
                          </li>
                        ))}
                      </ul>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </div>
      ) : null}
    </section>
  );
}
