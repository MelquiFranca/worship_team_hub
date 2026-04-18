'use client';

import Image from 'next/image';
import { useMemo, useRef, useState } from 'react';
import { useGroupSettings } from '@/context/GroupSettingsContext';
import styles from './GroupGeneralSettings.module.css';

const ACCEPTED_IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif']);
const GROUP_PHOTO_MAX_BYTES = 2 * 1024 * 1024;

function buildPresetPhoto(seed, primary, secondary, accent) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" role="img" aria-label="${seed}">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${primary}" />
          <stop offset="100%" stop-color="${secondary}" />
        </linearGradient>
      </defs>
      <rect width="160" height="160" rx="48" fill="url(#bg)" />
      <circle cx="48" cy="52" r="18" fill="${accent}" opacity="0.88" />
      <circle cx="112" cy="108" r="28" fill="#ffffff" opacity="0.14" />
      <text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle" font-family="Arial, sans-serif" font-size="28" font-weight="700" fill="#ffffff">${seed}</text>
    </svg>
  `.trim();

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

const presetPhotos = [
  {
    id: 'orbit',
    label: 'Orbit',
    value: buildPresetPhoto('G', '#2457d6', '#7db4ff', '#d8e4ff')
  },
  {
    id: 'pulse',
    label: 'Pulse',
    value: buildPresetPhoto('T', '#0f9d58', '#58d68d', '#d8f5df')
  },
  {
    id: 'sun',
    label: 'Sun',
    value: buildPresetPhoto('S', '#c85b15', '#f09f45', '#ffe0c8')
  }
];

function formatSavedTime(date) {
  if (!date) {
    return 'Ainda nao salvo';
  }

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date);
}

export default function GroupGeneralSettings() {
  const {
    settings,
    feedback,
    validationErrors,
    isDirty,
    isSaving,
    lastSavedAt,
    isReady,
    groupThemeOptions,
    availableFunctionOptions,
    functionOptions,
    setGroupName,
    setGroupPhoto,
    setThemeName,
    toggleAvailableFunction,
    addFunctionOption,
    removeFunctionOption,
    saveSettings
  } = useGroupSettings();

  const fileInputRef = useRef(null);
  const [fileError, setFileError] = useState('');
  const [newFunctionName, setNewFunctionName] = useState('');
  const [newFunctionHint, setNewFunctionHint] = useState('');
  const [functionEditorMessage, setFunctionEditorMessage] = useState('');

  const selectedFunctions = useMemo(() => new Set(settings.availableFunctions), [settings.availableFunctions]);
  const photoInitials = useMemo(() => {
    const value = settings.name.trim();
    if (!value) {
      return 'G';
    }

    return value
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || '')
      .join('')
      .slice(0, 2) || 'G';
  }, [settings.name]);

  const themeMeta = useMemo(() => {
    const activeTheme = groupThemeOptions.find((theme) => theme.name === settings.themeName) || groupThemeOptions[0];
    return activeTheme;
  }, [groupThemeOptions, settings.themeName]);

  const primaryFunctionLabel = useMemo(() => {
    const activeFunction = availableFunctionOptions.find((option) => option.id === settings.availableFunctions[0]);
    return activeFunction?.label || 'nenhuma';
  }, [availableFunctionOptions, settings.availableFunctions]);

  function handleFileSelection(event) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!ACCEPTED_IMAGE_TYPES.has(file.type)) {
      setFileError('Use arquivos PNG, JPG, WEBP ou GIF.');
      event.target.value = '';
      return;
    }

    if (file.size > GROUP_PHOTO_MAX_BYTES) {
      setFileError('A imagem deve ter no maximo 2MB.');
      event.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setGroupPhoto(reader.result);
        setFileError('');
        event.target.value = '';
      }
    };
    reader.readAsDataURL(file);
  }

  function openFilePicker() {
    fileInputRef.current?.click();
  }

  async function handleSave() {
    await saveSettings();
  }

  function handleAddFunctionType() {
    const result = addFunctionOption(newFunctionName, newFunctionHint);

    if (!result.ok) {
      setFunctionEditorMessage(result.message || 'Nao foi possivel adicionar a funcao.');
      return;
    }

    setNewFunctionName('');
    setNewFunctionHint('');
    setFunctionEditorMessage('Novo tipo de funcao adicionado.');
  }

  function handleRemoveFunctionType(functionId) {
    const result = removeFunctionOption(functionId);

    if (!result.ok) {
      setFunctionEditorMessage(result.message || 'Nao foi possivel excluir a funcao.');
      return;
    }

    setFunctionEditorMessage('Tipo de funcao excluido.');
  }

  const customFunctionOptions = useMemo(
    () => functionOptions.filter((option) => option.isCustom),
    [functionOptions]
  );

  return (
    <article className={styles.shell}>
      <header className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>Configuracoes gerais</p>
          <h1 className={styles.title}>Configuracoes gerais do grupo</h1>
          <p className={styles.lead}>
            Centralize identidade visual, funcoes da escala e tema de cores em um unico lugar.
          </p>
        </div>

        <div className={styles.heroStatus}>
          <span className={styles.statusBadge} data-tone={feedback.type}>
            {feedback.type === 'success'
              ? 'Salvo'
              : feedback.type === 'error'
                ? 'Revisar'
                : isDirty
                  ? 'Alteracoes nao salvas'
                  : 'Atualizado'}
          </span>
          <span className={styles.helperText}>{formatSavedTime(lastSavedAt)}</span>
        </div>
      </header>

      <div className={styles.grid}>
        <section className={styles.card} aria-labelledby="group-identity-title">
          <div className={styles.cardHeader}>
            <div>
              <p className={styles.sectionLabel}>Identidade</p>
              <h2 id="group-identity-title" className={styles.sectionTitle}>
                Nome e foto do grupo
              </h2>
            </div>
            <span className={styles.smallTone}>Preview em tempo real</span>
          </div>

          <div className={styles.identityLayout}>
            <div className={styles.photoColumn}>
              <div className={styles.photoPreview} aria-label="Preview da foto do grupo">
                {settings.photo ? (
                  <Image
                    className={styles.photoImage}
                    src={settings.photo}
                    alt="Preview da foto do grupo"
                    fill
                    sizes="(max-width: 720px) 100vw, 420px"
                    unoptimized
                  />
                ) : (
                  <div className={styles.photoFallback}>
                    <span>{photoInitials}</span>
                  </div>
                )}
              </div>

              <div className={styles.photoActions}>
                <button type="button" className={styles.secondaryButton} onClick={openFilePicker}>
                  Enviar foto
                </button>
                <button
                  type="button"
                  className={styles.secondaryButton}
                  onClick={() => {
                    setGroupPhoto('');
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                  }}
                  disabled={!settings.photo}
                >
                  Limpar
                </button>
                <input
                  ref={fileInputRef}
                  className={styles.fileInput}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  onChange={handleFileSelection}
                />
              </div>

              <div className={styles.presetRow} aria-label="Preset group photos">
                {presetPhotos.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    className={styles.presetButton}
                    onClick={() => setGroupPhoto(preset.value)}
                    aria-label={`Selecionar foto ${preset.label}`}
                  >
                    <Image
                      className={styles.presetImage}
                      src={preset.value}
                      alt=""
                      width={120}
                      height={120}
                      unoptimized
                    />
                    <span>{preset.label}</span>
                  </button>
                ))}
              </div>

              {fileError ? <p className={styles.errorText}>{fileError}</p> : null}
            </div>

            <label className={styles.field}>
              <span className={styles.fieldLabel}>Nome do grupo</span>
              <input
                className={styles.textInput}
                type="text"
                value={settings.name}
                minLength={3}
                maxLength={48}
                onChange={(event) => setGroupName(event.target.value)}
                aria-invalid={Boolean(validationErrors.name)}
                placeholder="Digite o nome do grupo"
              />
              <span className={styles.fieldMeta}>De 3 a 48 caracteres.</span>
              {validationErrors.name ? <span className={styles.errorText}>{validationErrors.name}</span> : null}
            </label>
          </div>
        </section>

        <section className={styles.card} aria-labelledby="functions-title">
          <div className={styles.cardHeader}>
            <div>
              <p className={styles.sectionLabel}>Funcoes</p>
              <h2 id="functions-title" className={styles.sectionTitle}>
                Funcoes disponiveis
              </h2>
            </div>
            <span className={styles.smallTone}>{settings.availableFunctions.length} selecionada(s)</span>
          </div>

          <div className={styles.functionGrid}>
            {availableFunctionOptions.map((option) => {
              const active = selectedFunctions.has(option.id);

              return (
                <button
                  key={option.id}
                  type="button"
                  className={active ? styles.functionChipActive : styles.functionChip}
                  onClick={() => toggleAvailableFunction(option.id)}
                  aria-pressed={active}
                >
                  <strong>{option.label}</strong>
                  <span>{option.hint}</span>
                </button>
              );
            })}
          </div>

          <div className={styles.functionEditor}>
            <div className={styles.functionEditorFields}>
              <label className={styles.field}>
                <span className={styles.fieldLabel}>Novo tipo de funcao</span>
                <input
                  className={styles.textInput}
                  type="text"
                  value={newFunctionName}
                  onChange={(event) => setNewFunctionName(event.target.value)}
                  placeholder="Ex.: Saxofone"
                />
              </label>
              <label className={styles.field}>
                <span className={styles.fieldLabel}>Descricao curta (opcional)</span>
                <input
                  className={styles.textInput}
                  type="text"
                  value={newFunctionHint}
                  onChange={(event) => setNewFunctionHint(event.target.value)}
                  placeholder="Ex.: Melodias e solos"
                />
              </label>
            </div>
            <button type="button" className={styles.secondaryButton} onClick={handleAddFunctionType}>
              Adicionar tipo
            </button>

            {customFunctionOptions.length ? (
              <div className={styles.customFunctionList}>
                {customFunctionOptions.map((option) => (
                  <div key={option.id} className={styles.customFunctionItem}>
                    <div>
                      <strong>{option.label}</strong>
                      <span>{option.hint || 'Funcao personalizada'}</span>
                    </div>
                    <button
                      type="button"
                      className={styles.removeFunctionButton}
                      onClick={() => handleRemoveFunctionType(option.id)}
                    >
                      Excluir
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className={styles.fieldMeta}>Nenhuma funcao personalizada cadastrada.</p>
            )}

            {functionEditorMessage ? <p className={styles.fieldMeta}>{functionEditorMessage}</p> : null}
          </div>

          <p className={styles.fieldMeta}>
            Selecione ao menos uma funcao para manter o cadastro de escalas consistente.
          </p>
          {validationErrors.functionOptions ? (
            <p className={styles.errorText}>{validationErrors.functionOptions}</p>
          ) : null}
          {validationErrors.availableFunctions ? (
            <p className={styles.errorText}>{validationErrors.availableFunctions}</p>
          ) : null}
        </section>

        <section className={styles.card} aria-labelledby="theme-title">
          <div className={styles.cardHeader}>
            <div>
              <p className={styles.sectionLabel}>Tema</p>
              <h2 id="theme-title" className={styles.sectionTitle}>
                Seletor de tema
              </h2>
            </div>
            <span className={styles.smallTone}>{themeMeta.label}</span>
          </div>

          <div className={styles.themeGrid}>
            {groupThemeOptions.map((theme) => {
              const active = theme.name === settings.themeName;
              return (
                <button
                  key={theme.name}
                  type="button"
                  className={active ? styles.themeCardActive : styles.themeCard}
                  onClick={() => setThemeName(theme.name)}
                  aria-pressed={active}
                >
                  <div className={styles.themeCardTop}>
                    <strong>{theme.label}</strong>
                    <span>{theme.note}</span>
                  </div>
                  <div className={styles.themeSwatches} aria-hidden="true">
                    {theme.chips.map((chip) => (
                      <span
                        key={`${theme.name}-${chip}`}
                        className={styles.themeSwatch}
                        style={{ background: `var(--group-${chip})` }}
                      />
                    ))}
                  </div>
                </button>
              );
            })}
          </div>

          <div className={styles.previewBar}>
            <span className={styles.previewChip}>
              <span className={styles.previewDot} />
              {themeMeta.label}
            </span>
            <span className={styles.previewChip}>Funcao principal: {primaryFunctionLabel}</span>
            <span className={styles.previewChip}>{settings.photo ? 'Foto personalizada' : 'Foto padrao'}</span>
          </div>
        </section>
      </div>

      <footer className={styles.footer}>
        <div className={styles.feedbackBox} aria-live="polite">
          {feedback.message ? <p>{feedback.message}</p> : <p>As alteracoes estao prontas para salvar.</p>}
        </div>

        <div className={styles.footerActions}>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={() => {
              setGroupPhoto('');
              if (fileInputRef.current) {
                fileInputRef.current.value = '';
              }
            }}
          >
            Limpar foto
          </button>
          <button
            type="button"
            className={styles.primaryButton}
            onClick={handleSave}
            disabled={!isReady || !isDirty || isSaving}
          >
            {isSaving ? 'Salvando...' : 'Salvar configuracoes'}
          </button>
        </div>
      </footer>
    </article>
  );
}
