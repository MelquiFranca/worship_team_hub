export function normalizeYouTubeVideoId(value) {
  if (typeof value !== 'string') {
    return '';
  }

  const candidate = value.trim();

  if (!candidate || candidate.startsWith('playlist:')) {
    return '';
  }

  return /^[a-zA-Z0-9_-]{11}$/.test(candidate) ? candidate : '';
}

export function extractYoutubeVideoId(videoUrl) {
  try {
    const parsedUrl = new URL(videoUrl);
    const host = parsedUrl.hostname.toLowerCase();

    if (host.includes('youtube.com')) {
      if (parsedUrl.pathname.startsWith('/embed/')) {
        return normalizeYouTubeVideoId(parsedUrl.pathname.split('/')[2] || '');
      }

      if (parsedUrl.pathname.startsWith('/shorts/')) {
        return normalizeYouTubeVideoId(parsedUrl.pathname.split('/')[2] || '');
      }

      return normalizeYouTubeVideoId(parsedUrl.searchParams.get('v') || '');
    }

    if (host.includes('youtu.be')) {
      return normalizeYouTubeVideoId(parsedUrl.pathname.replace('/', ''));
    }

    return '';
  } catch {
    return '';
  }
}

export function resolvePlaylistYouTubeIds(playlist, startIndex) {
  const safePlaylist = Array.isArray(playlist) ? playlist : [];
  const queue = [];

  for (let index = startIndex; index < safePlaylist.length; index += 1) {
    const item = safePlaylist[index];
    const fromUrlId = extractYoutubeVideoId(item?.videoUrl || item?.url || '');

    if (fromUrlId) {
      queue.push(fromUrlId);
    }
  }

  return queue;
}

export function getNextSequentialPlaylistIndex(currentIndex, playlistLength) {
  if (!Number.isInteger(currentIndex) || !Number.isInteger(playlistLength) || playlistLength <= 0) {
    return 0;
  }

  return currentIndex < playlistLength - 1 ? currentIndex + 1 : currentIndex;
}

export function buildYouTubeEmbedUrl(videoId, options = {}) {
  const params = new URLSearchParams();
  const safeVideoId = normalizeYouTubeVideoId(videoId);

  if (!safeVideoId) {
    return null;
  }

  params.set('autoplay', options.autoplay ? '1' : '0');
  params.set('playsinline', '1');
  params.set('rel', '0');
  params.set('enablejsapi', '1');

  if (typeof options.origin === 'string' && options.origin.trim()) {
    params.set('origin', options.origin.trim());
  }

  return `https://www.youtube.com/embed/${safeVideoId}?${params.toString()}`;
}

export function buildYouTubeExternalPlaybackUrl(queueVideoIds = [], fallbackUrl = '') {
  const normalizedQueue = (Array.isArray(queueVideoIds) ? queueVideoIds : [])
    .map((entry) => normalizeYouTubeVideoId(entry))
    .filter(Boolean);

  if (normalizedQueue.length >= 2) {
    return `https://www.youtube.com/watch_videos?video_ids=${normalizedQueue.join(',')}`;
  }

  if (normalizedQueue.length === 1) {
    return `https://www.youtube.com/watch?v=${normalizedQueue[0]}`;
  }

  if (typeof fallbackUrl === 'string' && fallbackUrl.trim()) {
    return fallbackUrl.trim();
  }

  return '';
}

export function toEmbedUrl(videoUrl, options = {}) {
  try {
    const parsedUrl = new URL(videoUrl);
    const host = parsedUrl.hostname.toLowerCase();

    if (host.includes('youtube.com')) {
      if (parsedUrl.pathname.startsWith('/embed/')) {
        const embeddedVideoId = normalizeYouTubeVideoId(parsedUrl.pathname.split('/')[2] || '');

        if (!embeddedVideoId) {
          return videoUrl;
        }

        return buildYouTubeEmbedUrl(embeddedVideoId, options);
      }

      if (parsedUrl.pathname.startsWith('/shorts/')) {
        const shortId = normalizeYouTubeVideoId(parsedUrl.pathname.split('/')[2] || '');
        return shortId ? buildYouTubeEmbedUrl(shortId, options) : null;
      }

      const videoId = normalizeYouTubeVideoId(parsedUrl.searchParams.get('v') || '');
      const playlistId = parsedUrl.searchParams.get('list');

      if (videoId) {
        return buildYouTubeEmbedUrl(videoId, options);
      }

      if (playlistId) {
        const params = new URLSearchParams();
        params.set('list', playlistId);
        params.set('autoplay', options.autoplay ? '1' : '0');
        params.set('playsinline', '1');
        params.set('rel', '0');
        return `https://www.youtube.com/embed/videoseries?${params.toString()}`;
      }

      return null;
    }

    if (host.includes('youtu.be')) {
      const shortId = normalizeYouTubeVideoId(parsedUrl.pathname.replace('/', ''));
      return shortId ? buildYouTubeEmbedUrl(shortId, options) : null;
    }

    if (host.includes('vimeo.com')) {
      const vimeoId = parsedUrl.pathname.split('/').filter(Boolean)[0];
      return vimeoId ? `https://player.vimeo.com/video/${vimeoId}` : null;
    }

    return null;
  } catch {
    return null;
  }
}
