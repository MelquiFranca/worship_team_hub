import { NextResponse } from 'next/server';
import {
  buildIntegrationRateLimitKey,
  buildRateLimitErrorPayload,
  buildRateLimitResponseInit,
  enforceRateLimit,
  getRateLimitPolicy
} from '../../../../lib/api/rateLimit.js';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const rateLimitResult = enforceRateLimit({
    policy: getRateLimitPolicy('youtubeSearch'),
    key: buildIntegrationRateLimitKey(request),
    request,
    route: '/api/youtube/search',
    method: 'GET'
  });

  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      buildRateLimitErrorPayload(rateLimitResult),
      buildRateLimitResponseInit(rateLimitResult)
    );
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q')?.trim();

  if (!query) {
    return NextResponse.json(
      { message: 'Informe um termo de busca para pesquisar musicas no YouTube.' },
      { status: 400 }
    );
  }

  const apiKey = process.env.YOUTUBE_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      {
        message:
          'A busca no YouTube esta indisponivel no momento porque a chave YOUTUBE_API_KEY nao foi configurada.'
      },
      { status: 503 }
    );
  }

  const endpoint = new URL('https://www.googleapis.com/youtube/v3/search');
  endpoint.searchParams.set('part', 'snippet');
  endpoint.searchParams.set('type', 'video');
  endpoint.searchParams.set('maxResults', '8');
  endpoint.searchParams.set('q', query);
  endpoint.searchParams.set('key', apiKey);

  const response = await fetch(endpoint.toString(), { cache: 'no-store' });
  const payload = await response.json();

  if (!response.ok) {
    const apiMessage = payload?.error?.message || 'Nao foi possivel consultar o YouTube.';
    return NextResponse.json({ message: apiMessage }, { status: response.status });
  }

  const items = (payload.items || [])
    .map((item) => {
      const videoId = item?.id?.videoId;

      if (!videoId) {
        return null;
      }

      return {
        videoId,
        title: item?.snippet?.title || 'Video sem titulo',
        channelTitle: item?.snippet?.channelTitle || 'Canal desconhecido',
        thumbnailUrl:
          item?.snippet?.thumbnails?.medium?.url ||
          item?.snippet?.thumbnails?.default?.url ||
          item?.snippet?.thumbnails?.high?.url ||
          '',
        url: `https://www.youtube.com/watch?v=${videoId}`
      };
    })
    .filter(Boolean);

  return NextResponse.json({
    query,
    items
  });
}
