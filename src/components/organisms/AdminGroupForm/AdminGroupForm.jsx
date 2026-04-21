'use client';

import Image from 'next/image';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { GROUP_FUNCTION_OPTIONS } from '@/data/groupFunctions';
import { requestJson } from '@/lib/api/http';
import { GROUP_THEME_OPTIONS, resolveGroupTheme } from '@/theme/groupTheme';
import styles from './AdminGroupForm.module.css';

const ACCEPTED_IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif']);
const GROUP_PHOTO_MAX_BYTES = 2 * 1024 * 1024;

const BASE_FUNCTION_OPTIONS = GROUP_FUNCTION_OPTIONS.map((option) => ({
  id: option.id,
  label: option.label,
  hint: option.hint || 'Funcao do grupo',
  isCustom: false
}));

function createDefaultState() {
  return {
    group: {
      id: '',
      name: '',
      status: 'active'
    },
    settings: {
      photo: '',
      themeName: 'aurora',
      functionOptions: BASE_FUNCTION_OPTIONS,
      availableFunctions: ['vocal', 'guitarra', 'teclado']
    },
    manager: {
      id: '',
      fullName: '',
      birthDate: '',
      username: '',
      password: ''
    },
    components: []
  };
}

function normalizeComponentEntry(item, index) {
  const fallbackId = `component-${index + 1}`;
  const fullName = typeof item?.fullName === 'string' && item.fullName.trim()
    ? item.fullName.trim()
    : 'Componente sem nome';

  return {
    id: typeof item?.id === 'string' && item.id.trim() ? item.id.trim() : fallbackId,
    fullName,
    username: typeof item?.username === 'string' ? item.username.trim() : '',
    permissionType: typeof item?.permissionType === 'string' ? item.permissionType.trim() : 'component-app',
    isActive: typeof item?.isActive === 'boolean' ? item.isActive : true,
    photo: typeof item?.photo === 'string' ? item.photo : ''
  };
}

function normalizeIncomingItem(item) {
  const state = createDefaultState();

  if (!item || typeof item !== 'object') {
    return state;
  }

  const group = item.group || {};
  const settings = item.settings || {};
  const manager = item.manager || {};
  const components = Array.isArray(item.components)
    ? item.components.map((entry, index) => normalizeComponentEntry(entry, index))
    : [];

  const functionOptions = Array.isArray(settings.functionOptions) && settings.functionOptions.length
    ? settings.functionOptions
    : BASE_FUNCTION_OPTIONS;
  const validFunctionIds = new Set(functionOptions.map((option) => option.id));
  const availableFunctions = Array.isArray(settings.availableFunctions)
    ? settings.availableFunctions.filter((id) => validFunctionIds.has(id))
    : [];

  return {
    group: {
      id: typeof group.id === 'string' ? group.id : '',
      name: typeof group.name === 'string' ? group.name : '',
      status: group.status === 'inactive' ? 'inactive' : 'active'
    },
    settings: {
      photo: typeof settings.photo === 'string' ? settings.photo : '',
      themeName: resolveGroupTheme(settings.themeName).name,
      functionOptions,
      availableFunctions: availableFunctions.length ? availableFunctions : [functionOptions[0]?.id].filter(Boolean)
    },
    manager: {
      id: typeof manager.id === 'string' ? manager.id : '',
      fullName: typeof manager.fullName === 'string' ? manager.fullName : '',
      birthDate: typeof manager.birthDate === 'string' ? manager.birthDate : '',
      username: typeof manager.username === 'string' ? manager.username : '',
      password: ''
    },
    components
  };
}

function toFunctionIdSeed(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default function AdminGroupForm({ mode = 'create', groupId = '', initialData = null }) {
  const router = useRouter();
  const [state, setState] = useState(normalizeIncomingItem(initialData));
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState({ type: 'idle', message: '' });
  const [fileError, setFileError] = useState('');
  const [newFunctionName, setNewFunctionName] = useState('');
  const [newFunctionHint, setNewFunctionHint] = useState('');
  const [componentAction, setComponentAction] = useState({
    loadingId: '',
    type: 'idle',
    message: ''
  });

  const title = mode === 'edit' ? 'Editar grupo' : 'Cadastrar novo grupo';
  const submitLabel = mode === 'edit' ? 'Salvar alteracoes' : 'Cadastrar grupo';

  const previewInitials = useMemo(() => {
    const chunks = String(state.group.name || '').trim().split(/\s+/).filter(Boolean).slice(0, 2);

    if (!chunks.length) {
      return 'GP';
    }

    return chunks.map((chunk) => chunk[0]?.toUpperCase() || '').join('').slice(0, 2);
  }, [state.group.name]);

  function getComponentInitials(name) {
    const chunks = String(name || '').trim().split(/\s+/).filter(Boolean).slice(0, 2);

    if (!chunks.length) {
      return 'CP';
    }

    return chunks.map((chunk) => chunk[0]?.toUpperCase() || '').join('').slice(0, 2);
  }

  function setGroupField(field, value) {
    setState((current) => ({
      ...current,
      group: {
        ...current.group,
        [field]: value
      }
    }));
  }

  function setSettingsField(field, value) {
    setState((current) => ({
      ...current,
      settings: {
        ...current.settings,
        [field]: value
      }
    }));
  }

  function setManagerField(field, value) {
    setState((current) => ({
      ...current,
      manager: {
        ...current.manager,
        [field]: value
      }
    }));
  }

  function toggleFunction(functionId) {
    setState((current) => {
      const selected = new Set(current.settings.availableFunctions);

      if (selected.has(functionId)) {
        selected.delete(functionId);
      } else {
        selected.add(functionId);
      }

      const nextSelected = Array.from(selected);

      return {
        ...current,
        settings: {
          ...current.settings,
          availableFunctions: nextSelected.length
            ? nextSelected
            : [current.settings.functionOptions[0]?.id].filter(Boolean)
        }
      };
    });
  }

  function removeFunctionOption(functionId) {
    setState((current) => {
      const nextOptions = current.settings.functionOptions.filter((option) => option.id !== functionId);

      if (!nextOptions.length) {
        return current;
      }

      const validIds = new Set(nextOptions.map((option) => option.id));
      const nextSelected = current.settings.availableFunctions.filter((id) => validIds.has(id));

      return {
        ...current,
        settings: {
          ...current.settings,
          functionOptions: nextOptions,
          availableFunctions: nextSelected.length ? nextSelected : [nextOptions[0].id]
        }
      };
    });
  }

  function addCustomFunctionOption() {
    const label = newFunctionName.trim();
    const hint = newFunctionHint.trim() || 'Funcao personalizada';

    if (!label) {
      setFeedback({ type: 'error', message: 'Informe o nome da nova funcao.' });
      return;
    }

    const idBase = toFunctionIdSeed(label);

    if (!idBase) {
      setFeedback({ type: 'error', message: 'Nome da funcao invalido.' });
      return;
    }

    setState((current) => {
      const existingIds = new Set(current.settings.functionOptions.map((option) => option.id));
      let candidateId = idBase;
      let index = 2;

      while (existingIds.has(candidateId)) {
        candidateId = `${idBase}-${index}`;
        index += 1;
      }

      return {
        ...current,
        settings: {
          ...current.settings,
          functionOptions: [
            ...current.settings.functionOptions,
            {
              id: candidateId,
              label,
              hint,
              isCustom: true
            }
          ],
          availableFunctions: current.settings.availableFunctions.includes(candidateId)
            ? current.settings.availableFunctions
            : [...current.settings.availableFunctions, candidateId]
        }
      };
    });

    setNewFunctionName('');
    setNewFunctionHint('');
    setFeedback({ type: 'success', message: 'Funcao personalizada adicionada.' });
  }

  function onFileChange(event) {
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
        setSettingsField('photo', reader.result);
        setFileError('');
        event.target.value = '';
      }
    };
    reader.readAsDataURL(file);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSaving(true);
    setFeedback({ type: 'idle', message: '' });

    try {
      const payload = {
        name: state.group.name,
        status: state.group.status,
        settings: {
          name: state.group.name,
          themeName: state.settings.themeName,
          functionOptions: state.settings.functionOptions,
          availableFunctions: state.settings.availableFunctions,
          ...(state.settings.photo
            ? state.settings.photo.startsWith('data:image/')
              ? { photoDataUrl: state.settings.photo }
              : { photoUrl: state.settings.photo, photoProvided: true }
            : { photoDataUrl: '' })
        },
        manager: {
          id: state.manager.id,
          fullName: state.manager.fullName,
          birthDate: state.manager.birthDate,
          username: state.manager.username,
          ...(state.manager.password.trim() ? { password: state.manager.password } : {})
        }
      };

      const endpoint = mode === 'edit' ? `/api/admin/groups/${groupId}` : '/api/admin/groups';
      const method = mode === 'edit' ? 'PATCH' : 'POST';
      const response = await requestJson(endpoint, {
        method,
        body: payload
      });

      const normalized = normalizeIncomingItem(response?.item);
      setState((current) => ({
        ...normalized,
        manager: {
          ...normalized.manager,
          password: ''
        }
      }));

      setFeedback({ type: 'success', message: response?.message || 'Operacao concluida com sucesso.' });

      if (mode === 'create' && response?.item?.group?.id) {
        router.replace(`/admin/grupos/${response.item.group.id}/editar`);
      }
    } catch (error) {
      setFeedback({ type: 'error', message: error.message || 'Nao foi possivel salvar o grupo.' });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleToggleComponentActive(componentId, nextIsActive) {
    if (mode !== 'edit' || !groupId || !componentId || typeof nextIsActive !== 'boolean') {
      return;
    }

    setComponentAction({
      loadingId: componentId,
      type: 'idle',
      message: ''
    });

    try {
      await requestJson(`/api/components/${encodeURIComponent(componentId)}?groupId=${encodeURIComponent(groupId)}`, {
        method: 'PATCH',
        body: { isActive: nextIsActive }
      });

      setState((current) => ({
        ...current,
        components: current.components.map((component) =>
          component.id === componentId
            ? { ...component, isActive: nextIsActive }
            : component
        )
      }));

      setComponentAction({
        loadingId: '',
        type: 'success',
        message: nextIsActive
          ? 'Componente reativado com sucesso.'
          : 'Componente desativado com sucesso.'
      });
    } catch (error) {
      setComponentAction({
        loadingId: '',
        type: 'error',
        message: error instanceof Error
          ? error.message
          : nextIsActive
            ? 'Nao foi possivel reativar o componente.'
            : 'Nao foi possivel desativar o componente.'
      });
    }
  }

  return (
    <main className={styles.page}>
      <section className={styles.headerCard}>
        <div>
          <p className={styles.kicker}>Visao administrativa</p>
          <h1>{title}</h1>
          <p className={styles.subtitle}>
            Configure identidade, tema, funcoes e usuario gestor inicial para o grupo.
          </p>
        </div>
      </section>

      <form className={styles.form} onSubmit={handleSubmit}>
        <section className={styles.card}>
          <h2>Identidade do grupo</h2>
          <div className={styles.gridTwo}>
            <label className={styles.field}>
              <span>Nome do grupo</span>
              <input
                type="text"
                value={state.group.name}
                onChange={(event) => setGroupField('name', event.target.value)}
                minLength={3}
                maxLength={80}
                required
              />
            </label>

            <label className={styles.field}>
              <span>Status</span>
              <select
                value={state.group.status}
                onChange={(event) => setGroupField('status', event.target.value)}
              >
                <option value="active">Ativo</option>
                <option value="inactive">Inativo</option>
              </select>
            </label>
          </div>

          <div className={styles.photoRow}>
            <div className={styles.photoPreview}>
              {state.settings.photo ? (
                <Image src={state.settings.photo} alt="Foto do grupo" fill className={styles.photoImage} unoptimized />
              ) : (
                <span>{previewInitials}</span>
              )}
            </div>

            <div className={styles.photoActions}>
              <label className={styles.fileButton}>
                Enviar foto
                <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={onFileChange} />
              </label>
              <button type="button" className={styles.secondaryButton} onClick={() => setSettingsField('photo', '')}>
                Limpar foto
              </button>
              {fileError ? <p className={styles.errorText}>{fileError}</p> : null}
            </div>
          </div>
        </section>

        <section className={styles.card}>
          <h2>Configuracoes iniciais (group-app)</h2>
          <label className={styles.field}>
            <span>Tema do grupo</span>
            <select
              value={state.settings.themeName}
              onChange={(event) => setSettingsField('themeName', event.target.value)}
            >
              {GROUP_THEME_OPTIONS.map((theme) => (
                <option key={theme.name} value={theme.name}>
                  {theme.label} - {theme.note}
                </option>
              ))}
            </select>
          </label>

          <div className={styles.functionsBlock}>
            <h3>Funcoes disponiveis na escala</h3>
            <div className={styles.functionList}>
              {state.settings.functionOptions.map((option) => {
                const checked = state.settings.availableFunctions.includes(option.id);

                return (
                  <label key={option.id} className={styles.functionItem}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleFunction(option.id)}
                    />
                    <span>
                      <strong>{option.label}</strong>
                      <small>{option.hint}</small>
                    </span>
                    {option.isCustom ? (
                      <button type="button" className={styles.linkButton} onClick={() => removeFunctionOption(option.id)}>
                        Remover
                      </button>
                    ) : null}
                  </label>
                );
              })}
            </div>

            <div className={styles.customFunctionRow}>
              <input
                type="text"
                placeholder="Nova funcao"
                value={newFunctionName}
                onChange={(event) => setNewFunctionName(event.target.value)}
              />
              <input
                type="text"
                placeholder="Descricao curta"
                value={newFunctionHint}
                onChange={(event) => setNewFunctionHint(event.target.value)}
              />
              <button type="button" className={styles.secondaryButton} onClick={addCustomFunctionOption}>
                Adicionar
              </button>
            </div>
          </div>
        </section>

        <section className={styles.card}>
          <h2>Usuario gestor inicial (group-app)</h2>
          <div className={styles.gridTwo}>
            <label className={styles.field}>
              <span>Nome completo</span>
              <input
                type="text"
                value={state.manager.fullName}
                onChange={(event) => setManagerField('fullName', event.target.value)}
                required
              />
            </label>

            <label className={styles.field}>
              <span>Data de nascimento</span>
              <input
                type="date"
                value={state.manager.birthDate}
                onChange={(event) => setManagerField('birthDate', event.target.value)}
                required
              />
            </label>

            <label className={styles.field}>
              <span>Username de acesso</span>
              <input
                type="text"
                value={state.manager.username}
                onChange={(event) => setManagerField('username', event.target.value)}
                required
              />
            </label>

            <label className={styles.field}>
              <span>{mode === 'edit' ? 'Nova senha (opcional)' : 'Senha inicial'}</span>
              <input
                type="password"
                value={state.manager.password}
                onChange={(event) => setManagerField('password', event.target.value)}
                required={mode !== 'edit'}
              />
            </label>
          </div>
        </section>

        {mode === 'edit' ? (
          <section className={styles.card}>
            <h2>Componentes do grupo</h2>
            <p className={styles.sectionHint}>
              Visualize os componentes cadastrados e desative perfis quando necessario.
            </p>

            {state.components.length ? (
              <div className={styles.componentsList}>
                {state.components.map((component) => {
                  const isLoadingDeactivate = componentAction.loadingId === component.id;
                  const isInactive = component.isActive === false;

                  return (
                    <article key={component.id} className={styles.componentItem}>
                      <div className={styles.componentIdentity}>
                        <div className={styles.componentAvatar}>
                          {component.photo ? (
                            <Image
                              src={component.photo}
                              alt={`Foto de ${component.fullName}`}
                              fill
                              sizes="44px"
                              className={styles.componentAvatarImage}
                              unoptimized
                            />
                          ) : (
                            <span>{getComponentInitials(component.fullName)}</span>
                          )}
                        </div>

                        <div className={styles.componentMeta}>
                          <strong>{component.fullName}</strong>
                          <small>@{component.username || 'sem-username'}</small>
                        </div>
                      </div>

                      <div className={styles.componentStatusBlock}>
                        <span className={isInactive ? styles.statusBadgeInactive : styles.statusBadgeActive}>
                          {isInactive ? 'Inativo' : 'Ativo'}
                        </span>
                        <button
                          type="button"
                          className={styles.linkButton}
                          onClick={() => handleToggleComponentActive(component.id, isInactive)}
                          disabled={isLoadingDeactivate}
                        >
                          {isLoadingDeactivate ? 'Salvando...' : isInactive ? 'Reativar' : 'Desativar'}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <p className={styles.sectionHint}>Nenhum componente cadastrado neste grupo.</p>
            )}

            {componentAction.message ? (
              <p className={componentAction.type === 'error' ? styles.errorText : styles.successText}>
                {componentAction.message}
              </p>
            ) : null}
          </section>
        ) : null}

        <section className={styles.actions}>
          {feedback.message ? (
            <p className={feedback.type === 'error' ? styles.errorText : styles.successText}>{feedback.message}</p>
          ) : null}

          <button className={styles.primaryButton} type="submit" disabled={isSaving}>
            {isSaving ? 'Salvando...' : submitLabel}
          </button>
        </section>
      </form>
    </main>
  );
}
