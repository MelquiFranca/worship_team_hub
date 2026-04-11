import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function isSupportedYouTubeHost(hostname) {
  return hostname === 'youtu.be' || hostname === 'youtube.com' || hostname.endsWith('.youtube.com');
}

function extractYouTubeVideoId(parsedUrl) {
  const host = parsedUrl.hostname.toLowerCase();

  if (!isSupportedYouTubeHost(host)) {
    return null;
  }

  if (host === 'youtu.be') {
    const shortId = parsedUrl.pathname.replace('/', '').split('/')[0];
    return shortId || null;
  }

  if (parsedUrl.pathname.startsWith('/shorts/')) {
    const shortId = parsedUrl.pathname.split('/')[2];
    return shortId || null;
  }

  if (parsedUrl.pathname.startsWith('/embed/')) {
    const embedId = parsedUrl.pathname.split('/')[2];
    return embedId || null;
  }

  if (parsedUrl.pathname === '/watch') {
    return parsedUrl.searchParams.get('v');
  }

  return null;
}

function buildFallbackThumbnail(videoId) {
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
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

export async function GET(request) {
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

  const videoId = extractYouTubeVideoId(parsedUrl);

  if (!videoId) {
    return NextResponse.json(
      {
        message:
          'O link informado nao e suportado. Use um video do youtube.com, youtu.be ou shorts do YouTube.'
      },
      { status: 400 }
    );
  }

  const canonicalUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const fallbackThumbnailUrl = buildFallbackThumbnail(videoId);

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
    }
  } catch {
    previewSource = 'fallback';
  }

  return NextResponse.json({
    videoId,
    title,
    channelTitle,
    thumbnailUrl,
    url: canonicalUrl,
    previewSource
  });
}
