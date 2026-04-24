const DEFAULT_MAX_RETRIES = 2;

export class MongoTransactionUnsupportedError extends Error {
  constructor(message = 'MongoDB transaction unsupported in this environment.') {
    super(message);
    this.name = 'MongoTransactionUnsupportedError';
  }
}

function normalizeFlag(value, defaultValue) {
  const raw = typeof value === 'string' ? value.trim().toLowerCase() : '';
  if (!raw) {
    return defaultValue;
  }

  return raw;
}

export function isMongoMultiCollectionTransactionsEnabled(env = process.env) {
  const value = normalizeFlag(env.MONGODB_MULTI_COLLECTION_TRANSACTIONS, 'enabled');
  return !['0', 'false', 'off', 'disabled'].includes(value);
}

export function isMongoTransactionFallbackEnabled(env = process.env) {
  const value = normalizeFlag(env.MONGODB_MULTI_COLLECTION_TRANSACTIONS_FALLBACK, 'compensation');
  return ['1', 'true', 'on', 'enabled', 'compensation'].includes(value);
}

export function isMongoTransactionSupportError(error) {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const message = typeof error.message === 'string' ? error.message.toLowerCase() : '';
  const codeName = typeof error.codeName === 'string' ? error.codeName.toLowerCase() : '';

  return (
    message.includes('transaction numbers are only allowed on a replica set member or mongos') ||
    message.includes('transactions are not supported') ||
    codeName === 'illegaloperation'
  );
}

function hasErrorLabel(error, label) {
  return Boolean(error && typeof error.hasErrorLabel === 'function' && error.hasErrorLabel(label));
}

function isRetriableTransactionError(error) {
  return hasErrorLabel(error, 'TransientTransactionError') || hasErrorLabel(error, 'UnknownTransactionCommitResult');
}

export async function runMongoTransactionWithRetry({
  client,
  operation,
  name = 'mongo_transaction',
  maxRetries = DEFAULT_MAX_RETRIES,
  logger = console
}) {
  if (!client || typeof client.startSession !== 'function') {
    throw new Error('MongoDB client invalido para transacao.');
  }

  if (typeof operation !== 'function') {
    throw new TypeError('Operacao transacional invalida.');
  }

  for (let attempt = 1; attempt <= maxRetries + 1; attempt += 1) {
    const mongoSession = client.startSession();

    try {
      logger.info('transaction_start', { name, attempt });
      let operationResult;

      await mongoSession.withTransaction(async () => {
        operationResult = await operation(mongoSession);
      });

      logger.info('transaction_commit', { name, attempt });
      return operationResult;
    } catch (error) {
      logger.error('transaction_abort', {
        name,
        attempt,
        code: error?.code || null,
        codeName: error?.codeName || null,
        message: error?.message || null
      });

      if (isMongoTransactionSupportError(error)) {
        throw new MongoTransactionUnsupportedError();
      }

      if (!isRetriableTransactionError(error) || attempt > maxRetries) {
        throw error;
      }
    } finally {
      await mongoSession.endSession();
    }
  }

  throw new Error('Falha ao executar transacao MongoDB.');
}
