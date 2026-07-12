import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildYouTubeEmbedUrl,
  getNextSequentialPlaylistIndex,
  resolvePlaylistYouTubeIds,
  toEmbedUrl
} from '../../src/components/organisms/ScaleFeed/playlistAutoplay.js';

test('YouTube embed de video individual habilita JS API sem fila interna playlist', () => {
  const embedUrl = buildYouTubeEmbedUrl('abcdefghijk', {
    autoplay: true,
    queueVideoIds: ['abcdefghijk', 'lmnopqrstuv'],
    origin: 'https://app.example.test'
  });

  assert.ok(embedUrl);

  const parsedUrl = new URL(embedUrl);

  assert.equal(parsedUrl.origin, 'https://www.youtube.com');
  assert.equal(parsedUrl.pathname, '/embed/abcdefghijk');
  assert.equal(parsedUrl.searchParams.get('autoplay'), '1');
  assert.equal(parsedUrl.searchParams.get('enablejsapi'), '1');
  assert.equal(parsedUrl.searchParams.get('origin'), 'https://app.example.test');
  assert.equal(parsedUrl.searchParams.has('playlist'), false);
});

test('toEmbedUrl nao delega sequencia interna ao iframe para video YouTube', () => {
  const embedUrl = toEmbedUrl('https://www.youtube.com/watch?v=abcdefghijk', {
    autoplay: true,
    queueVideoIds: ['abcdefghijk', 'lmnopqrstuv']
  });

  assert.ok(embedUrl);

  const parsedUrl = new URL(embedUrl);

  assert.equal(parsedUrl.pathname, '/embed/abcdefghijk');
  assert.equal(parsedUrl.searchParams.get('enablejsapi'), '1');
  assert.equal(parsedUrl.searchParams.has('playlist'), false);
});

test('resolvePlaylistYouTubeIds preserva ordem visual apenas para URLs YouTube validas', () => {
  const ids = resolvePlaylistYouTubeIds(
    [
      { videoUrl: 'https://www.youtube.com/watch?v=aaaaaaaaaaa' },
      { videoUrl: 'https://vimeo.com/123456' },
      { videoUrl: 'https://youtu.be/bbbbbbbbbbb' },
      { videoUrl: 'https://www.youtube.com/watch?v=invalid' },
      { videoUrl: 'https://www.youtube.com/shorts/ccccccccccc' }
    ],
    1
  );

  assert.deepEqual(ids, ['bbbbbbbbbbb', 'ccccccccccc']);
});

test('indice sequencial avanca ate o ultimo item sem repetir ou dar volta automaticamente', () => {
  assert.equal(getNextSequentialPlaylistIndex(0, 4), 1);
  assert.equal(getNextSequentialPlaylistIndex(2, 4), 3);
  assert.equal(getNextSequentialPlaylistIndex(3, 4), 3);
  assert.equal(getNextSequentialPlaylistIndex(0, 0), 0);
});
