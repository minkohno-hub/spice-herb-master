// 教材データ(data/)を検証し、知識単位と問題を生成して public/data/ に出力する。
// --check を付けると出力せずに検証のみ行う(CI 用)。
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { generate } from './generate.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const checkOnly = process.argv.includes('--check');

function readDir(dir) {
  return readdirSync(join(root, dir))
    .filter((f) => f.endsWith('.json'))
    .sort()
    .map((f) => ({ file: `${dir}/${f}`, json: JSON.parse(readFileSync(join(root, dir, f), 'utf8')) }));
}

const unitFiles = readDir('data/units');
const spiceFiles = readDir('data/spices');
const manifest = JSON.parse(readFileSync(join(root, 'data/source-manifest.json'), 'utf8'));

const { units, questions, spices, errors, stats } = generate({ unitFiles, spiceFiles, manifest });

if (errors.length) {
  console.error(`データ検証エラー ${errors.length} 件:`);
  for (const e of errors) console.error(' - ' + e);
  process.exit(1);
}

console.log(`知識単位 ${units.length} 件 / 問題 ${questions.length} 件 / スパイス ${spices.length} 種`);
console.log('問題形式別:', JSON.stringify(stats.byType));

if (checkOnly) process.exit(0);

const out = join(root, 'public/data');
mkdirSync(out, { recursive: true });
// 端末負荷を抑えるため章ごとに分割して出力する
const chapters = [...new Set(units.map((u) => u.ch))];
for (const ch of chapters) {
  writeFileSync(
    join(out, `questions-${ch}.json`),
    JSON.stringify(questions.filter((q) => q.ch === ch)),
  );
  writeFileSync(join(out, `units-${ch}.json`), JSON.stringify(units.filter((u) => u.ch === ch)));
}
const index = {
  version: manifest.contentVersion,
  generatedFrom: manifest.book.title,
  chapters: manifest.chapters,
  spices: spices.map(({ id, name, p, grades, level, family, part, origin, aliases, mix }) => ({
    id, name, p, grades, level, family, part, origin, aliases, mix,
  })),
  counts: { units: units.length, questions: questions.length, byType: stats.byType, byChapter: stats.byChapter },
  coverage: stats.coverage,
  // 検索用の軽量インデックス(問題本文は含めない)
  search: units.map((u) => ({ id: u.id, ch: u.ch, p: u.p, t: u.fact })),
};
writeFileSync(join(out, 'index.json'), JSON.stringify(index));
console.log(`public/data に ${chapters.length} 章分を出力しました`);
