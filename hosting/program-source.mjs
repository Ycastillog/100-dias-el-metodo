import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import vm from 'node:vm';

// Build-time only. Reuse the original Git program; never send its complete
// source or the 100-day data set as an anonymous static asset.
export const PROGRAM_FILES = ['assets/app.js', 'assets/life-program.js'];
export async function programModule(root) {
  const app = await readFile(resolve(root, PROGRAM_FILES[0]), 'utf8');
  const boundary = app.indexOf('\nconst defaultState =');
  if (boundary < 0) throw new Error('Program source boundary changed');
  const context = {};
  vm.runInNewContext(app.slice(0, boundary) + '\nthis.lessons = dailyContent;', context, { timeout: 1000 });
  const lessons = JSON.parse(JSON.stringify(context.lessons));
  if (lessons.length !== 100 || lessons.some((day, index) => day.day !== index + 1 || !day.task || !day.question || !day.principle)) throw new Error('Incomplete original program');
  const life = await readFile(resolve(root, PROGRAM_FILES[1]), 'utf8');
  return `const window = {};\n${life}\nexport default { version: 'git-program-1', lessons: ${JSON.stringify(lessons)}, resources: window.LIFE_RESOURCES, getLifeProgram: window.getLifeProgram };`;
}
