import { ALL_LINES, FINAL_LINE } from '../content/letter.ts';
import { writeFileSync } from 'node:fs';

const lines = [...ALL_LINES.split('\n'), FINAL_LINE];
writeFileSync('tools/poem.txt', `${lines.join('\n')}\n`);
console.log('lines', lines.length, 'words', lines.join(' ').split(/\s+/).length);
console.log('FINAL_LINE =', JSON.stringify(FINAL_LINE));
console.log('last card  =', JSON.stringify(ALL_LINES.split('\n').at(-1)));
