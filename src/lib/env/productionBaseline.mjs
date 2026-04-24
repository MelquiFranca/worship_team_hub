const INSECURE_SECRET_VALUES = new Set([
  'changeme',
  'change-me',
  'default',
  'password',
  'secret',
  'replace-with-a-long-random-secret-min-32-chars',
  'replace-me',
  'your-secret-here'
]);

const OPTIONAL_ENV = Object.freeze({
  requiredInProduction: false
});

const REQUIRED_SENSITIVE_ENV = Object.freeze({
  requiredInProduction: true,
  sensitivity: 'sensitive',
  visibility: 'server'
});

const PRODUCTION_ENV_INVENTORY = Object.freeze([
  { name: 'NODE_ENV', requiredInProduction: true, sensitivity: 'public', visibility: 'server' },
  { name: 'MONGODB_URI', ...REQUIRED_SENSITIVE_ENV },
  { name: 'MONGODB_DB_NAME', sensitivity: 'public', visibility: 'server', ...OPTIONAL_ENV },
  { name: 'AUTH_JWT_SECRET', ...REQUIRED_SENSITIVE_ENV },
  { name: 'JWT_SECRET', ...REQUIRED_SENSITIVE_ENV },
  { name: 'AUTH_SECRET', sensitivity: 'sensitive', visibility: 'server', ...OPTIONAL_ENV },
  { name: 'SESSION_SECRET', sensitivity: 'sensitive', visibility: 'server', ...OPTIONAL_ENV },
  { name: 'NEXTAUTH_SECRET', sensitivity: 'sensitive', visibility: 'server', ...OPTIONAL_ENV },
  { name: 'AUTH_JWT_PUBLIC_KEY', sensitivity: 'public', visibility: 'server', ...OPTIONAL_ENV },
  { name: 'JWT_PUBLIC_KEY', sensitivity: 'public', visibility: 'server', ...OPTIONAL_ENV },
  { name: 'AUTH_PUBLIC_KEY', sensitivity: 'public', visibility: 'server', ...OPTIONAL_ENV },
  { name: 'AUTH_JWT_ISSUER', sensitivity: 'public', visibility: 'server', ...OPTIONAL_ENV },
  { name: 'JWT_ISSUER', sensitivity: 'public', visibility: 'server', ...OPTIONAL_ENV },
  { name: 'AUTH_COOKIE_NAME', sensitivity: 'public', visibility: 'server', ...OPTIONAL_ENV },
  { name: 'AUTH_ACCESS_COOKIE_NAME', sensitivity: 'public', visibility: 'server', ...OPTIONAL_ENV },
  { name: 'AUTH_JWT_COOKIE_NAME', sensitivity: 'public', visibility: 'server', ...OPTIONAL_ENV },
  { name: 'AUTH_REFRESH_STORE', sensitivity: 'public', visibility: 'server', ...OPTIONAL_ENV },
  { name: 'MONGODB_MULTI_COLLECTION_TRANSACTIONS', sensitivity: 'public', visibility: 'server', ...OPTIONAL_ENV },
  {
    name: 'MONGODB_MULTI_COLLECTION_TRANSACTIONS_FALLBACK',
    sensitivity: 'public',
    visibility: 'server',
    ...OPTIONAL_ENV
  },
  { name: 'YOUTUBE_API_KEY', sensitivity: 'sensitive', visibility: 'server', ...OPTIONAL_ENV },
  { name: 'PUSH_VAPID_PUBLIC_KEY', sensitivity: 'public', visibility: 'server', ...OPTIONAL_ENV },
  { name: 'PUSH_VAPID_PRIVATE_KEY', sensitivity: 'sensitive', visibility: 'server', ...OPTIONAL_ENV },
  { name: 'PUSH_VAPID_SUBJECT', sensitivity: 'public', visibility: 'server', ...OPTIONAL_ENV },
  { name: 'RATE_LIMIT_ENABLED', sensitivity: 'public', visibility: 'server', ...OPTIONAL_ENV },
  { name: 'RATE_LIMIT_AUTH_ENABLED', sensitivity: 'public', visibility: 'server', ...OPTIONAL_ENV },
  { name: 'RATE_LIMIT_INTEGRATIONS_ENABLED', sensitivity: 'public', visibility: 'server', ...OPTIONAL_ENV },
  { name: 'RATE_LIMIT_AUTH_LOGIN_MAX', sensitivity: 'public', visibility: 'server', ...OPTIONAL_ENV },
  { name: 'RATE_LIMIT_AUTH_LOGIN_WINDOW_SECONDS', sensitivity: 'public', visibility: 'server', ...OPTIONAL_ENV },
  { name: 'RATE_LIMIT_AUTH_REFRESH_MAX', sensitivity: 'public', visibility: 'server', ...OPTIONAL_ENV },
  { name: 'RATE_LIMIT_AUTH_REFRESH_WINDOW_SECONDS', sensitivity: 'public', visibility: 'server', ...OPTIONAL_ENV },
  { name: 'RATE_LIMIT_YOUTUBE_SEARCH_MAX', sensitivity: 'public', visibility: 'server', ...OPTIONAL_ENV },
  { name: 'RATE_LIMIT_YOUTUBE_SEARCH_WINDOW_SECONDS', sensitivity: 'public', visibility: 'server', ...OPTIONAL_ENV },
  { name: 'RATE_LIMIT_YOUTUBE_PREVIEW_MAX', sensitivity: 'public', visibility: 'server', ...OPTIONAL_ENV },
  { name: 'RATE_LIMIT_YOUTUBE_PREVIEW_WINDOW_SECONDS', sensitivity: 'public', visibility: 'server', ...OPTIONAL_ENV },
  { name: 'RATE_LIMIT_STORE_FORCE_FAILURE', sensitivity: 'public', visibility: 'server', ...OPTIONAL_ENV },
  { name: 'NEXT_PUBLIC_APP_NAME', sensitivity: 'public', visibility: 'client', ...OPTIONAL_ENV },
  { name: 'NEXT_PUBLIC_API_URL', sensitivity: 'public', visibility: 'client', ...OPTIONAL_ENV }
]);

function normalizeEnvValue(value) {
  return typeof value === 'string' ? value.trim() : '';
}

export function isInsecureSecretPlaceholder(value) {
  const normalized = normalizeEnvValue(value).toLowerCase();
  if (!normalized) {
    return false;
  }

  return (
    INSECURE_SECRET_VALUES.has(normalized) ||
    normalized.includes('replace-') ||
    normalized.includes('example') ||
    normalized.includes('changeme') ||
    normalized.includes('change-me') ||
    normalized.includes('your-') ||
    normalized.startsWith('<') ||
    normalized.endsWith('>')
  );
}

function hasMongoConnectionPrefix(value) {
  return value.startsWith('mongodb://') || value.startsWith('mongodb+srv://');
}

export function getProductionEnvInventory() {
  return PRODUCTION_ENV_INVENTORY.map((entry) => ({ ...entry }));
}

export function resolveJwtSecretFromEnv(env = process.env) {
  const authJwtSecret = normalizeEnvValue(env.AUTH_JWT_SECRET);
  const jwtSecret = normalizeEnvValue(env.JWT_SECRET);
  return authJwtSecret || jwtSecret;
}

function createIssue(code, message, envNames) {
  return {
    code,
    message,
    envNames
  };
}

export function collectProductionEnvValidationIssues(env = process.env) {
  const issues = [];
  const normalizedNodeEnv = normalizeEnvValue(env.NODE_ENV).toLowerCase();

  if (normalizedNodeEnv !== 'production') {
    return issues;
  }

  const mongoUri = normalizeEnvValue(env.MONGODB_URI);
  if (!mongoUri) {
    issues.push(createIssue('MONGODB_URI_MISSING', 'MONGODB_URI ausente em producao.', ['MONGODB_URI']));
  } else if (!hasMongoConnectionPrefix(mongoUri)) {
    issues.push(
      createIssue('MONGODB_URI_INVALID', 'MONGODB_URI deve iniciar com mongodb:// ou mongodb+srv://.', ['MONGODB_URI'])
    );
  } else if (isInsecureSecretPlaceholder(mongoUri)) {
    issues.push(
      createIssue('MONGODB_URI_INSECURE_PLACEHOLDER', 'MONGODB_URI nao pode usar placeholder/default.', ['MONGODB_URI'])
    );
  }

  const activeJwtSecret = resolveJwtSecretFromEnv(env);
  if (!activeJwtSecret) {
    issues.push(
      createIssue('JWT_SECRET_MISSING', 'Defina AUTH_JWT_SECRET ou JWT_SECRET para producao.', [
        'AUTH_JWT_SECRET',
        'JWT_SECRET'
      ])
    );
  } else {
    if (activeJwtSecret.length < 32) {
      issues.push(
        createIssue(
          'JWT_SECRET_TOO_SHORT',
          'AUTH_JWT_SECRET/JWT_SECRET precisa ter ao menos 32 caracteres.',
          ['AUTH_JWT_SECRET', 'JWT_SECRET']
        )
      );
    }

    if (isInsecureSecretPlaceholder(activeJwtSecret)) {
      issues.push(
        createIssue(
          'JWT_SECRET_INSECURE_PLACEHOLDER',
          'AUTH_JWT_SECRET/JWT_SECRET nao pode usar placeholder/default.',
          ['AUTH_JWT_SECRET', 'JWT_SECRET']
        )
      );
    }
  }

  const youtubeApiKey = normalizeEnvValue(env.YOUTUBE_API_KEY);
  if (youtubeApiKey) {
    if (youtubeApiKey.length < 20) {
      issues.push(
        createIssue(
          'YOUTUBE_API_KEY_INVALID',
          'YOUTUBE_API_KEY invalida: tamanho minimo de 20 caracteres.',
          ['YOUTUBE_API_KEY']
        )
      );
    }

    if (isInsecureSecretPlaceholder(youtubeApiKey)) {
      issues.push(
        createIssue(
          'YOUTUBE_API_KEY_INSECURE_PLACEHOLDER',
          'YOUTUBE_API_KEY nao pode usar placeholder/default.',
          ['YOUTUBE_API_KEY']
        )
      );
    }
  }

  const refreshStore = normalizeEnvValue(env.AUTH_REFRESH_STORE).toLowerCase();
  if (refreshStore && refreshStore !== 'memory' && refreshStore !== 'mongodb') {
    issues.push(
      createIssue('AUTH_REFRESH_STORE_INVALID', 'AUTH_REFRESH_STORE deve ser "memory" ou "mongodb".', [
        'AUTH_REFRESH_STORE'
      ])
    );
  }

  const transactionMode = normalizeEnvValue(env.MONGODB_MULTI_COLLECTION_TRANSACTIONS).toLowerCase();
  if (
    transactionMode &&
    transactionMode !== 'enabled' &&
    transactionMode !== 'disabled' &&
    transactionMode !== 'true' &&
    transactionMode !== 'false'
  ) {
    issues.push(
      createIssue(
        'MONGODB_MULTI_COLLECTION_TRANSACTIONS_INVALID',
        'MONGODB_MULTI_COLLECTION_TRANSACTIONS deve ser "enabled" ou "disabled".',
        ['MONGODB_MULTI_COLLECTION_TRANSACTIONS']
      )
    );
  }

  const transactionFallback = normalizeEnvValue(env.MONGODB_MULTI_COLLECTION_TRANSACTIONS_FALLBACK).toLowerCase();
  if (
    transactionFallback &&
    transactionFallback !== 'compensation' &&
    transactionFallback !== 'enabled' &&
    transactionFallback !== 'disabled' &&
    transactionFallback !== 'true' &&
    transactionFallback !== 'false'
  ) {
    issues.push(
      createIssue(
        'MONGODB_MULTI_COLLECTION_TRANSACTIONS_FALLBACK_INVALID',
        'MONGODB_MULTI_COLLECTION_TRANSACTIONS_FALLBACK deve ser "compensation" ou "disabled".',
        ['MONGODB_MULTI_COLLECTION_TRANSACTIONS_FALLBACK']
      )
    );
  }

  const pushPublic = normalizeEnvValue(env.PUSH_VAPID_PUBLIC_KEY);
  const pushPrivate = normalizeEnvValue(env.PUSH_VAPID_PRIVATE_KEY);
  const pushSubject = normalizeEnvValue(env.PUSH_VAPID_SUBJECT);
  const anyPushConfigured = Boolean(pushPublic || pushPrivate || pushSubject);
  if (anyPushConfigured && (!pushPublic || !pushPrivate || !pushSubject)) {
    issues.push(
      createIssue(
        'PUSH_VAPID_PARTIAL_CONFIGURATION',
        'Configure PUSH_VAPID_PUBLIC_KEY, PUSH_VAPID_PRIVATE_KEY e PUSH_VAPID_SUBJECT em conjunto.',
        ['PUSH_VAPID_PUBLIC_KEY', 'PUSH_VAPID_PRIVATE_KEY', 'PUSH_VAPID_SUBJECT']
      )
    );
  }

  return issues;
}

function formatIssue(issue) {
  return `${issue.code}: ${issue.message}`;
}

export function validateProductionEnvironment(env = process.env) {
  const issues = collectProductionEnvValidationIssues(env);
  if (issues.length === 0) {
    return { ok: true, issues: [] };
  }

  const message = ['Baseline de ambiente invalido para producao:', ...issues.map(formatIssue)].join('\n- ');
  throw new Error(message);
}
