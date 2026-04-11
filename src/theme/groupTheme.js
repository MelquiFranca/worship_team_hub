const REQUIRED_THEME_KEYS = [
  'background',
  'backgroundGlow',
  'backgroundAlt',
  'surface',
  'surfaceMuted',
  'surfaceElevated',
  'border',
  'text',
  'textMuted',
  'primary',
  'primarySoft',
  'accent',
  'accentSoft',
  'success',
  'warning',
  'focusRing',
  'shadow'
];

export const GROUP_THEME_FALLBACK = 'aurora';

export const GROUP_THEME_TOKENS = {
  aurora: {
    background: '#f4f7fb',
    backgroundGlow: '#dcecff',
    backgroundAlt: '#eef4ff',
    surface: '#ffffff',
    surfaceMuted: '#f2f6fb',
    surfaceElevated: '#ffffff',
    border: 'rgba(15, 23, 42, 0.10)',
    text: '#10233f',
    textMuted: '#5f6f86',
    primary: '#2457d6',
    primarySoft: '#d8e4ff',
    accent: '#1ea7a1',
    accentSoft: '#d8f5f3',
    success: '#0f9d58',
    warning: '#c27b00',
    focusRing: 'rgba(36, 87, 214, 0.28)',
    shadow: '0 24px 48px rgba(15, 23, 42, 0.12)'
  },
  midnight: {
    background: '#0b1220',
    backgroundGlow: '#17233d',
    backgroundAlt: '#111a2e',
    surface: '#111a2e',
    surfaceMuted: '#162238',
    surfaceElevated: '#1a2742',
    border: 'rgba(209, 223, 255, 0.12)',
    text: '#eef4ff',
    textMuted: '#9fb0cc',
    primary: '#7ea7ff',
    primarySoft: '#23365c',
    accent: '#7ff0d7',
    accentSoft: '#173c37',
    success: '#53d18b',
    warning: '#f0bb5a',
    focusRing: 'rgba(126, 167, 255, 0.34)',
    shadow: '0 28px 60px rgba(2, 8, 23, 0.42)'
  },
  sunrise: {
    background: '#fff7ef',
    backgroundGlow: '#ffe2c2',
    backgroundAlt: '#fff0da',
    surface: '#ffffff',
    surfaceMuted: '#fff5e8',
    surfaceElevated: '#ffffff',
    border: 'rgba(127, 85, 22, 0.12)',
    text: '#3f2812',
    textMuted: '#7e5f45',
    primary: '#c85b15',
    primarySoft: '#ffe0c8',
    accent: '#de8b2c',
    accentSoft: '#ffe9c7',
    success: '#0e8a50',
    warning: '#ba6d00',
    focusRing: 'rgba(200, 91, 21, 0.30)',
    shadow: '0 24px 48px rgba(122, 72, 27, 0.16)'
  }
};

export const GROUP_THEME_OPTIONS = [
  {
    name: 'aurora',
    label: 'Aurora',
    note: 'Equilibrio claro e limpo',
    chips: ['primary', 'accent', 'surface']
  },
  {
    name: 'midnight',
    label: 'Midnight',
    note: 'Contraste alto para baixa luz',
    chips: ['primary', 'accent', 'surface']
  },
  {
    name: 'sunrise',
    label: 'Sunrise',
    note: 'Paleta quente e acolhedora',
    chips: ['primary', 'accent', 'surface']
  }
];

function isValidThemeTokens(tokens) {
  if (!tokens || typeof tokens !== 'object') {
    return false;
  }

  return REQUIRED_THEME_KEYS.every((key) => typeof tokens[key] === 'string' && tokens[key].length > 0);
}

export function resolveGroupTheme(themeName) {
  const fallbackTokens = GROUP_THEME_TOKENS[GROUP_THEME_FALLBACK];
  const candidateName = typeof themeName === 'string' ? themeName : GROUP_THEME_FALLBACK;
  const candidateTokens = GROUP_THEME_TOKENS[candidateName];

  if (!candidateTokens || !isValidThemeTokens(candidateTokens)) {
    return {
      name: GROUP_THEME_FALLBACK,
      tokens: fallbackTokens
    };
  }

  return {
    name: candidateName,
    tokens: candidateTokens
  };
}

export function applyGroupThemeToDocument(themeName) {
  if (typeof document === 'undefined') {
    return resolveGroupTheme(themeName);
  }

  const resolved = resolveGroupTheme(themeName);
  const root = document.documentElement;
  const body = document.body;

  Object.entries(resolved.tokens).forEach(([tokenName, tokenValue]) => {
    root.style.setProperty(`--group-${tokenName}`, tokenValue);
    body.style.setProperty(`--group-${tokenName}`, tokenValue);
  });

  root.style.setProperty('--app-background', resolved.tokens.background);
  root.style.setProperty('--app-background-alt', resolved.tokens.backgroundAlt);
  root.style.setProperty('--app-surface', resolved.tokens.surface);
  root.style.setProperty('--app-surface-elevated', resolved.tokens.surfaceElevated);
  root.style.setProperty('--app-text', resolved.tokens.text);
  root.style.setProperty('--app-text-muted', resolved.tokens.textMuted);
  root.style.setProperty('--app-border', resolved.tokens.border);
  root.style.setProperty('--app-accent', resolved.tokens.primary);
  root.style.setProperty('--app-accent-strong', resolved.tokens.accent);
  root.style.setProperty('--app-accent-soft', resolved.tokens.primarySoft);
  root.style.setProperty('--app-focus', resolved.tokens.focusRing);
  root.style.setProperty('--app-shadow', resolved.tokens.shadow);
  root.style.setProperty(
    '--app-page-gradient',
    `linear-gradient(180deg, ${resolved.tokens.backgroundGlow} 0%, ${resolved.tokens.background} 46%, ${resolved.tokens.backgroundAlt} 100%)`
  );
  root.style.setProperty(
    '--app-hero-gradient',
    `linear-gradient(135deg, ${resolved.tokens.surface} 0%, ${resolved.tokens.surfaceMuted} 54%, ${resolved.tokens.backgroundAlt} 100%)`
  );

  root.dataset.groupTheme = resolved.name;
  body.dataset.groupTheme = resolved.name;
  body.style.background =
    `linear-gradient(180deg, ${resolved.tokens.backgroundGlow} 0%, ${resolved.tokens.background} 46%, ${resolved.tokens.backgroundAlt} 100%)`;
  body.style.color = resolved.tokens.text;

  return resolved;
}
