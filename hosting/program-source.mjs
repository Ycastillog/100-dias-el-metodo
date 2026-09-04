import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import vm from 'node:vm';

// Build-time only. Reuse the original Git program; never send its complete
// source or the 100-day data set as an anonymous static asset.
export const PROGRAM_FILES = ['assets/app.js', 'assets/life-program.js', 'hosting/guided-week.json', ...Array.from({length:7}, (_,i) => 'hosting/week-audio/dia-' + String(i+1).padStart(2,'0') + '.mp3'), 'hosting/week-audio/transcripts.json'];
export async function programModule(root, { requireComplete = true } = {}) {
  const app = await readFile(resolve(root, PROGRAM_FILES[0]), 'utf8');
  const boundary = app.indexOf('\nconst defaultState =');
  if (boundary < 0) throw new Error('Program source boundary changed');
  const context = {};
  vm.runInNewContext(app.slice(0, boundary) + '\nthis.lessons = dailyContent;', context, { timeout: 1000 });
  const lessons = JSON.parse(JSON.stringify(context.lessons));
  if (lessons.length !== 100 || lessons.some((day, index) => day.day !== index + 1 || !day.task || !day.question || !day.principle)) throw new Error('Incomplete original program');
  const life = await readFile(resolve(root, PROGRAM_FILES[1]), 'utf8');
  const week = JSON.parse(await readFile(resolve(root, 'hosting/guided-week.json'), 'utf8'));
  if (week.days.length !== 7 || week.days.some((d,i) => d.day !== i+1 || Object.keys(d.areas).length !== 5)) throw new Error('Incomplete first week');
  const optionalRead = async (file, encoding) => { try { return await readFile(resolve(root, file), encoding); } catch (error) { if (!requireComplete && error.code === 'ENOENT') return null; throw error; } };
  const transcripts = JSON.parse(await optionalRead('hosting/week-audio/transcripts.json', 'utf8') || '{}');
  const media = {};
  for (let day=1; day<=7; day++) {
    const audio = await optionalRead('hosting/week-audio/dia-' + String(day).padStart(2,'0') + '.mp3');
    if (!requireComplete && (!audio || !transcripts[day])) continue;
    if (audio.length < 1000 || !transcripts[day]) throw new Error('Incomplete lesson audio');
    media[day] = { data: audio.toString('base64'), transcript: transcripts[day] };
  }
  return `const window = {};\n${life}\nexport default { version: 'guided-week-1', lessons: ${JSON.stringify(lessons)}, week: ${JSON.stringify(week)}, media: ${JSON.stringify(media)}, resources: window.LIFE_RESOURCES, getLifeProgram: window.getLifeProgram };`;
}
