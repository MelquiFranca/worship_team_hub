import assert from 'node:assert/strict';
import test from 'node:test';
import {
  SCALE_IMAGE_MAX_BYTES,
  parseScaleImageAttachmentInput
} from '../../src/lib/scales/imageAttachment.js';

function createDataUrlFromSize(byteLength) {
  const content = Buffer.alloc(byteLength, 1);
  return `data:image/png;base64,${content.toString('base64')}`;
}

test('parseScaleImageAttachmentInput aceita payload de imagem com exatamente 8 MB', () => {
  const src = createDataUrlFromSize(SCALE_IMAGE_MAX_BYTES);
  const result = parseScaleImageAttachmentInput({
    imageAttachment: {
      src,
      label: 'Imagem de teste'
    }
  });

  assert.equal(result.error, undefined);
  assert.equal(result.removeImageAttachment, false);
  assert.equal(result.imageAttachment?.photo?.size, SCALE_IMAGE_MAX_BYTES);
});

test('parseScaleImageAttachmentInput rejeita payload de imagem acima de 8 MB', () => {
  const src = createDataUrlFromSize(SCALE_IMAGE_MAX_BYTES + 1);
  const result = parseScaleImageAttachmentInput({
    imageAttachment: {
      src,
      label: 'Imagem de teste'
    }
  });

  assert.equal(result.error, 'A imagem da escala excede o limite de 8 MB.');
});
