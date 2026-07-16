const YOUTUBE_URL_PATTERN = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?[^\s]*v=|embed\/|shorts\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{11})(?:[^\s]*)?/i;

export function getYouTubeVideoId(value: string) {
  return value.trim().match(YOUTUBE_URL_PATTERN)?.[1] ?? null;
}

export function getYouTubeEmbedUrl(videoId: string) {
  return `https://www.youtube-nocookie.com/embed/${videoId}`;
}

export function withoutYouTubeUrl(value: string) {
  return value.replace(YOUTUBE_URL_PATTERN, "").replace(/\n{3,}/g, "\n\n").trim();
}
