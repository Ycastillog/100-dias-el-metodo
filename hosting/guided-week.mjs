import { AREAS, focusArea } from './guided-tools.js';
import { curriculumGuide } from './curriculum.mjs';

export function dayGuide(program, day, profile, requestedArea) {
  const area = requestedArea || focusArea(day, profile);
  if (!Object.hasOwn(AREAS, area)) return null;
  const minutes = [2, 10, 20].includes(Number(profile.minutes)) ? Number(profile.minutes) : 10;
  const expanded = curriculumGuide(program.curriculum, program.lessons, day, area, minutes, profile.energy);
  const lesson = program.week?.days.find(item => item.day === day);
  const variant = lesson?.areas[area];
  if (!variant) return { area, guide: expanded };
  const dose = variant.durationOptions[String(minutes)];
  const activity = dose.split(/Actúa \([^)]*\): /)[1]?.split(/ Registra \(/)[0] || variant.action;
  return { area, guide: {
    ...(expanded || {}),
    title: 'La idea detrás de la práctica', explanation: lesson.explanation, example: variant.example,
    task: variant.action, activity, reflection: lesson.reflection,
    evidence: 'Compara lo que querías intentar con lo que ocurrió. Describe un hecho concreto o qué te impidió empezar; preparar la acción no equivale a realizarla.',
    smaller: variant.durationOptions['2'].split(/Actúa \([^)]*\): /)[1]?.split(/ Registra \(/)[0] || variant.action,
    safety: program.week.privacy,
    audio: program.media?.[day] ? '/api/participant/media?day=' + day : null,
    transcript: program.media?.[day]?.transcript || '',
    video: day === 1 ? '/assets/first-step-example.mp4' : null,
  } };
}

// MP3 files remain inside the Worker and are only returned after entitlement
// validation. Support a single byte range for native audio seeking.
export function audioResponse(request, media, contentType = 'audio/mpeg') {
  if (!media) return new Response(null, { status: 404 });
  const bytes = Uint8Array.from(atob(media.data), value => value.charCodeAt(0));
  const headers = { 'Content-Type': contentType, 'Cache-Control': 'private, no-store', 'Accept-Ranges': 'bytes', 'X-Content-Type-Options': 'nosniff', 'X-Robots-Tag': 'noindex, nofollow' };
  const range = request.headers.get('range');
  if (!range) return new Response(bytes, { headers: { ...headers, 'Content-Length': String(bytes.length) } });
  const match = /^bytes=(\d*)-(\d*)$/.exec(range);
  let start = 0, end = bytes.length - 1;
  if (match && (match[1] || match[2])) {
    if (match[1]) { start = Number(match[1]); if (match[2]) end = Math.min(Number(match[2]), end); }
    else start = Math.max(0, bytes.length - Number(match[2]));
  } else start = bytes.length;
  if (!Number.isSafeInteger(start) || start < 0 || start >= bytes.length || end < start) return new Response(null, { status: 416, headers: { ...headers, 'Content-Range': 'bytes */' + bytes.length } });
  return new Response(bytes.slice(start, end + 1), { status: 206, headers: { ...headers, 'Content-Length': String(end - start + 1), 'Content-Range': `bytes ${start}-${end}/${bytes.length}` } });
}
