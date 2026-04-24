import assert from 'node:assert/strict';
import test from 'node:test';
import {
  isMongoMultiCollectionTransactionsEnabled,
  isMongoTransactionFallbackEnabled,
  MongoTransactionUnsupportedError,
  runMongoTransactionWithRetry
} from '../../src/lib/db/transactions.js';

function createFakeSession({ runTransaction }) {
  return {
    async withTransaction(callback) {
      await runTransaction(callback);
    },
    async endSession() {}
  };
}

test('flags de transacao usam defaults esperados', () => {
  assert.equal(isMongoMultiCollectionTransactionsEnabled({}), true);
  assert.equal(isMongoMultiCollectionTransactionsEnabled({ MONGODB_MULTI_COLLECTION_TRANSACTIONS: 'disabled' }), false);
  assert.equal(isMongoTransactionFallbackEnabled({}), true);
  assert.equal(
    isMongoTransactionFallbackEnabled({ MONGODB_MULTI_COLLECTION_TRANSACTIONS_FALLBACK: 'disabled' }),
    false
  );
});

test('runMongoTransactionWithRetry reexecuta quando erro for transiente', async () => {
  let attempts = 0;

  const retriableError = {
    message: 'transient',
    hasErrorLabel(label) {
      return label === 'TransientTransactionError';
    }
  };

  const fakeClient = {
    startSession() {
      return createFakeSession({
        async runTransaction(callback) {
          attempts += 1;
          if (attempts === 1) {
            throw retriableError;
          }

          await callback();
        }
      });
    }
  };

  const result = await runMongoTransactionWithRetry({
    client: fakeClient,
    maxRetries: 2,
    operation: async () => 'ok',
    logger: { info() {}, error() {} }
  });

  assert.equal(result, 'ok');
  assert.equal(attempts, 2);
});

test('runMongoTransactionWithRetry converte erro de suporte em MongoTransactionUnsupportedError', async () => {
  const fakeClient = {
    startSession() {
      return createFakeSession({
        async runTransaction() {
          throw new Error('Transaction numbers are only allowed on a replica set member or mongos');
        }
      });
    }
  };

  await assert.rejects(
    () =>
      runMongoTransactionWithRetry({
        client: fakeClient,
        operation: async () => null,
        logger: { info() {}, error() {} }
      }),
    (error) => error instanceof MongoTransactionUnsupportedError
  );
});
