import assert from 'node:assert/strict';
import test from 'node:test';
import {
  collectProductionEnvValidationIssues,
  getProductionEnvInventory,
  isInsecureSecretPlaceholder,
  resolveJwtSecretFromEnv,
  validateProductionEnvironment
} from '../../src/lib/env/productionBaseline.mjs';

const VALID_JWT_SECRET = 'jwt-secret-super-seguro-com-mais-de-trinta-e-dois';
const VALID_YOUTUBE_API_KEY = 'AIzaSyA8kXChaveYoutubeValidaParaTeste';
const VALID_MONGODB_URI = 'mongodb://localhost:27017/escalas_app_local';

test('inventario de env de producao classifica required/optional e sensitive/public', () => {
  const inventory = getProductionEnvInventory();
  const jwtSecretEntry = inventory.find((item) => item.name === 'AUTH_JWT_SECRET');
  const youtubeApiKeyEntry = inventory.find((item) => item.name === 'YOUTUBE_API_KEY');
  const dbNameEntry = inventory.find((item) => item.name === 'MONGODB_DB_NAME');
  const componentImagesResponseEntry = inventory.find((item) => item.name === 'COMPONENT_IMAGES_RESPONSE_ENABLED');

  assert.ok(jwtSecretEntry);
  assert.equal(jwtSecretEntry.requiredInProduction, true);
  assert.equal(jwtSecretEntry.sensitivity, 'sensitive');

  assert.ok(youtubeApiKeyEntry);
  assert.equal(youtubeApiKeyEntry.requiredInProduction, false);
  assert.equal(youtubeApiKeyEntry.sensitivity, 'sensitive');

  assert.ok(dbNameEntry);
  assert.equal(dbNameEntry.requiredInProduction, false);
  assert.equal(dbNameEntry.sensitivity, 'public');

  assert.ok(componentImagesResponseEntry);
  assert.equal(componentImagesResponseEntry.requiredInProduction, false);
  assert.equal(componentImagesResponseEntry.sensitivity, 'public');
});

test('baseline de producao aceita ambiente valido', () => {
  assert.doesNotThrow(() =>
    validateProductionEnvironment({
      NODE_ENV: 'production',
      AUTH_JWT_SECRET: VALID_JWT_SECRET,
      YOUTUBE_API_KEY: VALID_YOUTUBE_API_KEY,
      MONGODB_URI: VALID_MONGODB_URI
    })
  );
});

test('baseline de producao aceita ambiente sem YOUTUBE_API_KEY', () => {
  assert.doesNotThrow(() =>
    validateProductionEnvironment({
      NODE_ENV: 'production',
      AUTH_JWT_SECRET: VALID_JWT_SECRET,
      MONGODB_URI: VALID_MONGODB_URI
    })
  );
});

test('baseline de producao ignora validacao fora de production', () => {
  assert.doesNotThrow(() =>
    validateProductionEnvironment({
      NODE_ENV: 'development'
    })
  );
});

test('falha em producao quando segredo JWT esta ausente', () => {
  assert.throws(
    () =>
      validateProductionEnvironment({
        NODE_ENV: 'production',
        YOUTUBE_API_KEY: VALID_YOUTUBE_API_KEY,
        MONGODB_URI: VALID_MONGODB_URI
      }),
    (error) =>
      error instanceof Error &&
      error.message.includes('JWT_SECRET_MISSING') &&
      error.message.includes('AUTH_JWT_SECRET') &&
      error.message.includes('JWT_SECRET')
  );
});

test('falha em producao quando segredo JWT e curto demais', () => {
  assert.throws(
    () =>
      validateProductionEnvironment({
        NODE_ENV: 'production',
        AUTH_JWT_SECRET: 'curto-demais',
        YOUTUBE_API_KEY: VALID_YOUTUBE_API_KEY,
        MONGODB_URI: VALID_MONGODB_URI
      }),
    (error) => error instanceof Error && error.message.includes('JWT_SECRET_TOO_SHORT')
  );
});

test('falha em producao quando segredo JWT usa placeholder inseguro', () => {
  assert.throws(
    () =>
      validateProductionEnvironment({
        NODE_ENV: 'production',
        AUTH_JWT_SECRET: 'change-me',
        YOUTUBE_API_KEY: VALID_YOUTUBE_API_KEY,
        MONGODB_URI: VALID_MONGODB_URI
      }),
    (error) => error instanceof Error && error.message.includes('JWT_SECRET_INSECURE_PLACEHOLDER')
  );
});

test('falha em producao quando YOUTUBE_API_KEY presente e invalida', () => {
  assert.throws(
    () =>
      validateProductionEnvironment({
        NODE_ENV: 'production',
        AUTH_JWT_SECRET: VALID_JWT_SECRET,
        YOUTUBE_API_KEY: 'placeholder',
        MONGODB_URI: VALID_MONGODB_URI
      }),
    (error) => error instanceof Error && error.message.includes('YOUTUBE_API_KEY_INVALID')
  );
});

test('detector de placeholder inseguro reconhece placeholders comuns', () => {
  assert.equal(isInsecureSecretPlaceholder('change-me'), true);
  assert.equal(isInsecureSecretPlaceholder('<your_jwt_secret_here>'), true);
  assert.equal(isInsecureSecretPlaceholder('valor-seguro-com-entropia-123456'), false);
});

test('resolve segredo JWT prioriza AUTH_JWT_SECRET e usa JWT_SECRET como fallback', () => {
  assert.equal(
    resolveJwtSecretFromEnv({
      AUTH_JWT_SECRET: '  abcdefghijklmnopqrstuvwxyz012345  ',
      JWT_SECRET: 'fallback-invalido'
    }),
    'abcdefghijklmnopqrstuvwxyz012345'
  );

  assert.equal(
    resolveJwtSecretFromEnv({
      AUTH_JWT_SECRET: '',
      JWT_SECRET: '  jwt-secret-comprido-abcdefghijklmnopqrstuvwxyz  '
    }),
    'jwt-secret-comprido-abcdefghijklmnopqrstuvwxyz'
  );
});

test('falha quando MONGODB_URI de producao esta ausente', () => {
  assert.throws(
    () =>
      validateProductionEnvironment({
        NODE_ENV: 'production',
        AUTH_JWT_SECRET: VALID_JWT_SECRET,
        YOUTUBE_API_KEY: VALID_YOUTUBE_API_KEY
      }),
    (error) => error instanceof Error && error.message.includes('MONGODB_URI_MISSING')
  );
});
