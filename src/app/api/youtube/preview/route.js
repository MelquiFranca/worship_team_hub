import { NextResponse } from 'next/server';
import {
  buildIntegrationRateLimitKey,
  buildRateLimitErrorPayload,
  buildRateLimitResponseInit,
  enforceRateLimit,
  getRateLimitPolicy
} from '../../../../lib/api/rateLimit.js';

export const dynamic = 'force-dynamic';

function isSupportedYouTubeHost(hostname) {
  return hostname === 'youtu.be' || hostname === 'youtube.com' || hostname.endsWith('.youtube.com');
}

function normalizeId(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function extractYouTubeResource(parsedUrl) {
  const host = parsedUrl.hostname.toLowerCase();

  if (!isSupportedYouTubeHost(host)) {
    return null;
  }

  if (host === 'youtu.be') {
    const videoId = normalizeId(parsedUrl.pathname.replace('/', '').split('/')[0]);
    return videoId ? { kind: 'video', videoId } : null;
  }

  if (parsedUrl.pathname.startsWith('/shorts/')) {
    const videoId = normalizeId(parsedUrl.pathname.split('/')[2]);
    return videoId ? { kind: 'video', videoId } : null;
  }

  if (parsedUrl.pathname.startsWith('/embed/')) {
    const videoId = normalizeId(parsedUrl.pathname.split('/')[2]);
    return videoId ? { kind: 'video', videoId } : null;
  }

  if (parsedUrl.pathname === '/watch') {
    const videoId = normalizeId(parsedUrl.searchParams.get('v'));
    const playlistId = normalizeId(parsedUrl.searchParams.get('list'));

    if (videoId) {
      return { kind: 'video', videoId };
    }

    if (playlistId) {
      return { kind: 'playlist', playlistId };
    }

    return null;
  }

  if (parsedUrl.pathname === '/playlist') {
    const playlistId = normalizeId(parsedUrl.searchParams.get('list'));
    return playlistId ? { kind: 'playlist', playlistId } : null;
  }

  return null;
}

function buildFallbackThumbnail(videoId) {
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}

function buildFallbackPlaylistThumbnail(playlistId) {
  return `https://i.ytimg.com/vi_webp/videoseries/${playlistId}/hqdefault.webp`;
}

async function fetchOEmbedPreview(videoUrl) {
  const endpoint = new URL('https://www.youtube.com/oembed');
  endpoint.searchParams.set('url', videoUrl);
  endpoint.searchParams.set('format', 'json');

  const response = await fetch(endpoint.toString(), { cache: 'no-store' });

  if (!response.ok) {
    return null;
  }

  return response.json();
}

async function fetchVideoMetadataFromApi(videoId, apiKey) {
  const endpoint = new URL('https://www.googleapis.com/youtube/v3/videos');
  endpoint.searchParams.set('part', 'snippet');
  endpoint.searchParams.set('id', videoId);
  endpoint.searchParams.set('key', apiKey);

  const response = await fetch(endpoint.toString(), { cache: 'no-store' });

  if (!response.ok) {
    return null;
  }

  const payload = await response.json();
  const item = Array.isArray(payload?.items) ? payload.items[0] : null;

  if (!item) {
    return null;
  }

  return {
    title: item?.snippet?.title || '',
    channelTitle: item?.snippet?.channelTitle || '',
    thumbnailUrl:
      item?.snippet?.thumbnails?.medium?.url ||
      item?.snippet?.thumbnails?.high?.url ||
      item?.snippet?.thumbnails?.default?.url ||
      ''
  };
}

async function fetchPlaylistMetadataFromApi(playlistId, apiKey) {
  const endpoint = new URL('https://www.googleapis.com/youtube/v3/playlists');
  endpoint.searchParams.set('part', 'snippet');
  endpoint.searchParams.set('id', playlistId);
  endpoint.searchParams.set('key', apiKey);

  const response = await fetch(endpoint.toString(), { cache: 'no-store' });

  if (!response.ok) {
    return null;
  }

  const payload = await response.json();
  const item = Array.isArray(payload?.items) ? payload.items[0] : null;

  if (!item) {
    return null;
  }

  return {
    title: item?.snippet?.title || '',
    channelTitle: item?.snippet?.channelTitle || '',
    thumbnailUrl:
      item?.snippet?.thumbnails?.medium?.url ||
      item?.snippet?.thumbnails?.high?.url ||
      item?.snippet?.thumbnails?.default?.url ||
      ''
  };
}

export async function GET(request) {
  const rateLimitResult = enforceRateLimit({
    policy: getRateLimitPolicy('youtubePreview'),
    key: buildIntegrationRateLimitKey(request),
    request,
    route: '/api/youtube/preview',
    method: 'GET'
  });

  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      buildRateLimitErrorPayload(rateLimitResult),
      buildRateLimitResponseInit(rateLimitResult)
    );
  }

  const { searchParams } = new URL(request.url);
  const rawUrl = searchParams.get('url')?.trim();

  if (!rawUrl) {
    return NextResponse.json({ message: 'Cole um link valido de video do YouTube.' }, { status: 400 });
  }

  let parsedUrl;

  try {
    parsedUrl = new URL(rawUrl);
  } catch {
    return NextResponse.json(
      { message: 'O link informado e invalido. Use uma URL completa do YouTube.' },
      { status: 400 }
    );
  }

  const resource = extractYouTubeResource(parsedUrl);

  if (!resource) {
    return NextResponse.json(
      {
        message:
          'O link informado nao e suportado. Use um link de musica/video ou playlist do YouTube/YouTube Music.'
      },
      { status: 400 }
    );
  }

  if (resource.kind === 'video') {
    const videoId = resource.videoId;
    const canonicalUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const fallbackThumbnailUrl = buildFallbackThumbnail(videoId);
    const apiKey = process.env.YOUTUBE_API_KEY?.trim();

    let title = 'Video do YouTube';
    let channelTitle = 'Canal do YouTube';
    let thumbnailUrl = fallbackThumbnailUrl;
    let previewSource = 'fallback';

    try {
      const oEmbedPayload = await fetchOEmbedPreview(canonicalUrl);

      if (oEmbedPayload) {
        title = oEmbedPayload.title || title;
        channelTitle = oEmbedPayload.author_name || channelTitle;
        thumbnailUrl = oEmbedPayload.thumbnail_url || thumbnailUrl;
        previewSource = 'oembed';
      } else if (apiKey) {
        const videoMetadata = await fetchVideoMetadataFromApi(videoId, apiKey);

        if (videoMetadata) {
          title = videoMetadata.title || title;
          channelTitle = videoMetadata.channelTitle || channelTitle;
          thumbnailUrl = videoMetadata.thumbnailUrl || thumbnailUrl;
          previewSource = 'youtube-api';
        }
      }
    } catch {
      previewSource = 'fallback';
    }

    return NextResponse.json({
      entityType: 'video',
      videoId,
      title,
      channelTitle,
      thumbnailUrl,
      url: canonicalUrl,
      previewSource
    });
  }

  const playlistId = resource.playlistId;
  const canonicalUrl = `https://www.youtube.com/playlist?list=${playlistId}`;
  const fallbackThumbnailUrl = buildFallbackPlaylistThumbnail(playlistId);
  const apiKey = process.env.YOUTUBE_API_KEY?.trim();
  const syntheticVideoId = `playlist:${playlistId}`;

  let title = 'Playlist do YouTube';
  let channelTitle = 'Canal do YouTube';
  let thumbnailUrl = fallbackThumbnailUrl;
  let previewSource = 'fallback';

  try {
    if (apiKey) {
      const playlistMetadata = await fetchPlaylistMetadataFromApi(playlistId, apiKey);

      if (playlistMetadata) {
        title = playlistMetadata.title || title;
        channelTitle = playlistMetadata.channelTitle || channelTitle;
        thumbnailUrl = playlistMetadata.thumbnailUrl || thumbnailUrl;
        previewSource = 'youtube-api';
      }
    }
  } catch {
    previewSource = 'fallback';
  }

  return NextResponse.json({
    entityType: 'playlist',
    videoId: syntheticVideoId,
    playlistId,
    title,
    channelTitle,
    thumbnailUrl,
    url: canonicalUrl,
    previewSource
  });
}
