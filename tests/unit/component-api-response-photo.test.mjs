import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getComponentPhotoMongoProjection,
  hasStoredComponentPhoto,
  isComponentImagesInApiResponsesEnabled,
  serializeComponentPhotoFieldsForApi,
  serializeComponentPhotoValueForApi
} from '../../src/lib/components/apiResponsePhoto.js';

const PHOTO_DATA_URL = 'data:image/png;base64,Zm9v';

test('flag de imagem de componente fica habilitada por padrao', () => {
  assert.equal(isComponentImagesInApiResponsesEnabled({}), true);
  assert.equal(isComponentImagesInApiResponsesEnabled({ COMPONENT_IMAGES_RESPONSE_ENABLED: '' }), true);
});

test('flag de imagem de componente interpreta valores falsy conhecidos', () => {
  assert.equal(isComponentImagesInApiResponsesEnabled({ COMPONENT_IMAGES_RESPONSE_ENABLED: 'false' }), false);
  assert.equal(isComponentImagesInApiResponsesEnabled({ COMPONENT_IMAGES_RESPONSE_ENABLED: '0' }), false);
  assert.equal(isComponentImagesInApiResponsesEnabled({ COMPONENT_IMAGES_RESPONSE_ENABLED: 'disabled' }), false);
});

test('helper preserva serializacao atual quando flag esta habilitada', () => {
  const fields = serializeComponentPhotoFieldsForApi({
    photoUrl: 'https://cdn.example.com/component.png',
    photoProvided: true
  });

  assert.deepEqual(fields, {
    photoUrl: 'https://cdn.example.com/component.png',
    photoDataUrl: 'https://cdn.example.com/component.png',
    photoProvided: true
  });
});

test('helper remove dados de imagem quando flag esta desabilitada, mantendo indicador de foto', () => {
  const fields = serializeComponentPhotoFieldsForApi(
    {
      photoUrl: 'https://cdn.example.com/component.png',
      photoProvided: false
    },
    { env: { COMPONENT_IMAGES_RESPONSE_ENABLED: 'false' } }
  );

  assert.deepEqual(fields, {
    photoUrl: '',
    photoDataUrl: '',
    photoProvided: true
  });
});

test('helper de valor unico usado em indisponibilidade retorna vazio quando flag esta desabilitada', () => {
  assert.equal(
    serializeComponentPhotoValueForApi(
      { photoUrl: PHOTO_DATA_URL, photoProvided: true },
      { env: { COMPONENT_IMAGES_RESPONSE_ENABLED: 'false' } }
    ),
    ''
  );
});

test('projection do Mongo inclui photo apenas quando a flag estiver habilitada', () => {
  assert.deepEqual(getComponentPhotoMongoProjection(), {
    photo: 1,
    photoUrl: 1,
    photoProvided: 1
  });

  assert.deepEqual(
    getComponentPhotoMongoProjection({ env: { COMPONENT_IMAGES_RESPONSE_ENABLED: 'false' } }),
    {
      photoUrl: 1,
      photoProvided: 1
    }
  );
});

test('detector de foto existente reconhece foto binaria persistida sem serializar base64', () => {
  assert.equal(
    hasStoredComponentPhoto({
      photo: {
        contentType: 'image/png',
        data: Buffer.from('foo')
      }
    }),
    true
  );
});
