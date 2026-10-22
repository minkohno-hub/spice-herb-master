// 知識単位と問題の生成ロジック(純粋関数。テストからも利用する)。
// すべての問題は知識単位 ID を出典として持ち、知識単位は掲載ページを持つ。

const CHAPTER_OF_SPICE = 'ch2';

// 決定的な疑似乱数(生成結果を毎回同じにして問題 ID を安定させる)
function seeded(seedStr) {
  let h = 2166136261;
  for (const c of seedStr) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return () => {
    h ^= h << 13; h ^= h >>> 17; h ^= h << 5;
    return ((h >>> 0) % 1000000) / 1000000;
  };
}

function pickDistractors(correct, pool, n, seed, exclude = []) {
  const rnd = seeded(seed);
  const banned = new Set([correct, ...exclude].map(norm));
  const uniq = [...new Set(pool)].filter((x) => x && !banned.has(norm(x)));
  const out = [];
  while (out.length < n && uniq.length) {
    const i = Math.floor(rnd() * uniq.length);
    out.push(uniq.splice(i, 1)[0]);
  }
  return out;
}

function shuffle(arr, seed) {
  const rnd = seeded(seed);
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function norm(s) {
  return String(s)
    .normalize('NFKC')
    .replace(/[\s・、。,.()()「」『』〜~ー-]/g, '')
    .replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60))
    .toLowerCase();
}

function chapterOfPage(p, chapters) {
  const c = chapters.find((ch) => p >= ch.pages[0] && p <= ch.pages[1]);
  return c ? c.id : null;
}

export function generate({ unitFiles, spiceFiles, manifest }) {
  const errors = [];
  const units = [];
  const questions = [];
  const ids = new Set();
  const qids = new Set();

  const addUnit = (u, file) => {
    if (!u.id || !u.fact || typeof u.p !== 'number') errors.push(`${file}: 必須項目不足 ${JSON.stringify(u).slice(0, 80)}`);
    if (ids.has(u.id)) errors.push(`${file}: 知識単位 ID 重複 ${u.id}`);
    const ch = chapterOfPage(u.p, manifest.chapters);
    if (!ch) errors.push(`${file}: ${u.id} のページ ${u.p} がどの章にも属さない`);
    if (u.ch && ch && u.ch !== ch) errors.push(`${file}: ${u.id} の章 ${u.ch} とページ ${u.p} が不整合`);
    ids.add(u.id);
    units.push({ ...u, ch: ch ?? u.ch, status: '原文照合済み' });
  };
  const addQ = (q) => {
    if (qids.has(q.id)) { errors.push(`問題 ID 重複 ${q.id}`); return; }
    for (const s of q.src) if (!ids.has(s)) errors.push(`${q.id}: 出典の知識単位 ${s} が存在しない`);
    if (q.choices) {
      const set = new Set(q.choices.map(norm));
      if (set.size !== q.choices.length) errors.push(`${q.id}: 選択肢が重複`);
      if (!q.choices.some((c) => norm(c) === norm(q.answer))) errors.push(`${q.id}: 正解が選択肢にない`);
    }
    qids.add(q.id);
    questions.push({ status: '構造検証済み', ...q });
  };

  // ---- 1. 一般章の知識単位
  for (const { file, json } of unitFiles) {
    for (const u of json.units) {
      addUnit({ id: u.id, ch: json.chapter, sec: u.sec, p: u.p, fact: u.fact, cat: u.cat, q: u.q, a: u.a, alt: u.alt }, file);
    }
  }

  // ---- 2. 図鑑の知識単位
  const spices = [];
  for (const { file, json } of spiceFiles) {
    for (const s of json.spices) {
      if (s.profileOf) {
        const base = spices.find((x) => x.id === s.profileOf);
        if (!base) errors.push(`${file}: profileOf ${s.profileOf} が先に定義されていない`);
      } else {
        spices.push({ ...s, facts: [] });
      }
      const owner = s.profileOf ?? s.id;
      if (!s.profileOf && !s.mix) {
        for (const key of ['family', 'origin', 'part']) {
          if (!s[key] && s.level !== 'プロ') errors.push(`${file}: ${s.id} の ${key} がない`);
        }
      }
      if (!s.profileOf) {
        const prof = [
          s.family && `科名は${s.family}`,
          s.origin && `原産地は${s.origin}`,
          s.part && `利用部位は${s.part}`,
          s.aliases?.length && `別名は${s.aliases.join('、')}`,
        ].filter(Boolean).join('。');
        addUnit({ id: `${s.id}-profile`, ch: CHAPTER_OF_SPICE, sec: s.name, p: s.p, fact: `${s.name}: ${prof || 'ミックススパイス'}。検定${s.grades.join('・')}級の対象。`, spice: s.id, cat: 'profile' }, file);
      }
      for (const f of s.facts) {
        addUnit({ id: f.id, ch: CHAPTER_OF_SPICE, sec: s.name, p: s.p, fact: f.fact, q: f.q, a: f.a, alt: f.alt, spice: owner, cat: 'spice-fact' }, file);
        spices.find((x) => x.id === owner)?.facts.push(f.id);
      }
    }
  }

  const unitById = new Map(units.map((u) => [u.id, u]));
  const spiceById = new Map(spices.map((s) => [s.id, s]));
  const allSpiceNames = spices.map((s) => s.name);
  // 誤答選択肢は「答えの種類」が同じものから選ぶ(例: 成分名には成分名、人物には人物)
  const spiceNameSet = new Set(spices.flatMap((s) => [s.name, ...(s.aliases ?? [])]).map(norm));
  const kindOf = (u) => {
    const a = u.a;
    if (spiceNameSet.has(norm(a)) || u.cat === 'spice') return 'spice';
    if (/\d/.test(a)) return u.cat === 'year' ? 'year' : 'num';
    if (['person', 'place', 'country', 'book', 'family', 'part', 'temp', 'timing', 'food', 'dish', 'drink'].includes(u.cat)) return u.cat;
    if (/^[ァ-ヶー・]+$/.test(a) && /(ン|ール|ノール|ル|ゼ|酸|油)$/.test(a) && u.cat === 'spice-fact') return 'compound';
    return u.ch + ':term';
  };
  const answersByKind = {};
  for (const u of units) if (u.a) (answersByKind[kindOf(u)] ??= []).push(u.a);

  const gradeOf = (u) => (u.spice ? spiceById.get(u.spice)?.grades ?? [1] : u.ch === 'ch3' && u.p >= 110 && u.p <= 135 && !(u.p >= 115 && u.p <= 121) ? [1, 2] : [1, 2, 3]);
  const base = (u) => ({ ch: u.ch, p: u.p, sec: u.sec, spice: u.spice, grades: gradeOf(u) });

  // ---- 3. 一問一答 → 用語入力 + 四択
  for (const u of units) {
    if (!u.q || !u.a) continue;
    addQ({ id: `${u.id}:input`, type: 'input', prompt: u.q, answer: u.a, alt: u.alt ?? [], explain: u.fact, src: [u.id], diff: 2, ...base(u) });
    const kind = kindOf(u);
    const pool = kind === 'spice' ? allSpiceNames.concat(answersByKind.spice ?? []) : answersByKind[kind] ?? [];
    const ds = pickDistractors(u.a, pool, 3, u.id, u.alt ?? []);
    // 同種の誤答が3つ揃わない場合は四択を作らず、用語入力のみとする(質の低い選択肢を避ける)
    if (ds.length === 3) {
      addQ({ id: `${u.id}:choice`, type: 'choice', prompt: u.q, choices: shuffle([u.a, ...ds], u.id + 'c'), answer: u.a, explain: u.fact, src: [u.id], diff: 1, ...base(u) });
    }
  }

  // ---- 4. 図鑑プロフィール問題(科名・利用部位・原産地・別名の逆引き・正誤)
  const families = [...new Set(spices.map((s) => s.family).filter(Boolean))];
  const parts = [...new Set(spices.map((s) => s.part).filter(Boolean))];
  const origins = [...new Set(spices.map((s) => s.origin).filter(Boolean))];
  for (const s of spices) {
    const uid = `${s.id}-profile`;
    const u = unitById.get(uid);
    const b = base(u);
    if (s.family) {
      addQ({ id: `${s.id}:family`, type: 'choice', prompt: `${s.name}は何科の植物?`, choices: shuffle([s.family, ...pickDistractors(s.family, families, 3, s.id + 'f')], s.id + 'fc'), answer: s.family, explain: u.fact, src: [uid], diff: 1, ...b });
      // 正誤: 決定的に真偽を決める
      const truthy = seeded(s.id + 'tf')() < 0.5;
      const shown = truthy ? s.family : pickDistractors(s.family, families, 1, s.id + 'tfd')[0];
      addQ({ id: `${s.id}:tf-family`, type: 'tf', prompt: `${s.name}は${shown}に属する。`, answer: truthy ? '正' : '誤', choices: ['正', '誤'], explain: `正しくは${s.family}。${u.fact}`, src: [uid], diff: 1, ...b });
    }
    if (s.part) {
      addQ({ id: `${s.id}:part`, type: 'choice', prompt: `${s.name}の利用部位として本書に記載されているものは?`, choices: shuffle([s.part, ...pickDistractors(s.part, parts, 3, s.id + 'p')], s.id + 'pc'), answer: s.part, explain: u.fact, src: [uid], diff: 2, ...b });
    }
    if (s.origin) {
      addQ({ id: `${s.id}:origin`, type: 'choice', prompt: `${s.name}の原産地は?`, choices: shuffle([s.origin, ...pickDistractors(s.origin, origins, 3, s.id + 'o')], s.id + 'oc'), answer: s.origin, explain: u.fact, src: [uid], diff: 3, ...b });
    }
    for (const [i, al] of (s.aliases ?? []).entries()) {
      const clean = al.replace(/\(.+?\)/g, '').trim();
      if (!clean || norm(clean) === norm(s.name)) continue;
      // 同じ別名を持つスパイスが他にないか確認(正答の一意性)
      const dup = spices.some((o) => o.id !== s.id && (o.aliases ?? []).some((x) => norm(x.replace(/\(.+?\)/g, '')) === norm(clean)));
      if (dup) continue;
      addQ({ id: `${s.id}:alias${i}`, type: 'reverse', prompt: `別名「${al}」で知られるスパイス・ハーブは?`, choices: shuffle([s.name, ...pickDistractors(s.name, allSpiceNames, 3, s.id + 'a' + i)], s.id + 'ac' + i), answer: s.name, explain: u.fact, src: [uid], diff: 2, ...b });
    }
    // 記述式: 本書記載の要点を採点基準にする
    const keyFacts = s.facts.map((id) => unitById.get(id)).filter((f) => f?.a && norm(f.a) !== norm(s.name) && !s.name.includes(f.a)).slice(0, 3);
    const points = [
      s.family && { label: '科名', keywords: [s.family], src: uid },
      s.part && { label: '利用部位', keywords: [s.part.replace(/[((].*?[))]/g, '').split('、')[0].trim()], src: uid },
      ...keyFacts.map((f) => ({ label: f.fact.length > 44 ? f.fact.slice(0, 44) + '…' : f.fact, keywords: [f.a, ...(f.alt ?? [])], src: f.id })),
    ].filter(Boolean);
    if (points.length >= 3) {
      addQ({
        id: `${s.id}:essay`, type: 'essay', prompt: `${s.name}について、科名・利用部位を含めて、本書で挙げられている特徴を説明せよ。`,
        answer: [u.fact, ...keyFacts.map((f) => f.fact)].join(' '), rubric: points.map((pt) => ({ ...pt, keywords: pt.keywords.filter(Boolean) })),
        explain: '要点ごとに、記載されているキーワードが含まれているかを判定します。', src: [uid, ...keyFacts.map((f) => f.id)], diff: 4, ...b,
      });
    }
  }

  // ---- 5. 組み合わせ問題(4種のスパイスと科名)
  const withFam = spices.filter((s) => s.family && !s.mix);
  for (let i = 0; i + 4 <= withFam.length; i += 4) {
    const group = withFam.slice(i, i + 4);
    if (new Set(group.map((g) => g.family)).size < 4) continue; // 科名が重複すると一意にならない
    addQ({
      id: `match-family-${group.map((g) => g.id).join('-')}`, type: 'match', prompt: 'スパイス・ハーブと科名を正しく組み合わせよ。',
      pairs: group.map((g) => ({ left: g.name, right: g.family })), answer: group.map((g) => g.family).join(','),
      explain: group.map((g) => `${g.name}=${g.family}`).join(' / '), src: group.map((g) => `${g.id}-profile`),
      // 全員が対象となる級のみ(どの級でも出題範囲内に収まるように)
      ch: CHAPTER_OF_SPICE, p: group[0].p, grades: group.reduce((a, g) => a.filter((x) => g.grades.includes(x)), [1, 2, 3]), diff: 3,
    });
  }

  // ---- 6. 並べ替え(年代のある歴史事項を古い順に)
  const yearUnits = units.filter((u) => u.cat === 'year' && /\d{3,4}年/.test(u.a ?? '') && !/紀元前/.test(u.a));
  const yearOf = (u) => Number(u.a.match(/(\d{3,4})年/)[1]);
  const sorted = [...yearUnits].sort((a, b) => yearOf(a) - yearOf(b));
  for (let i = 0; i + 4 <= sorted.length; i += 3) {
    const group = sorted.slice(i, i + 4);
    if (new Set(group.map(yearOf)).size < 4) continue;
    const label = (u) => u.fact.replace(/^(\d{3,4}年|[^、。]*?\d{3,4}年[^、。]*?)、?/, '').slice(0, 40);
    addQ({
      id: `order-${group.map((g) => g.id).join('-')}`, type: 'order', prompt: '次の出来事を年代の古い順に並べよ。',
      items: shuffle(group.map((g) => ({ id: g.id, text: label(g) })), group[0].id),
      answer: group.map((g) => g.id).join(','), explain: group.map((g) => `${yearOf(g)}年: ${g.fact}`).join(' / '),
      src: group.map((g) => g.id), ch: group[0].ch, p: group[0].p, grades: [1, 2, 3], diff: 4,
    });
  }

  // ---- 統計
  const byType = {};
  const byChapter = {};
  for (const q of questions) {
    byType[q.type] = (byType[q.type] ?? 0) + 1;
    byChapter[q.ch] = (byChapter[q.ch] ?? 0) + 1;
  }
  const covered = new Set(questions.flatMap((q) => q.src));
  const coverage = {
    unitsTotal: units.length,
    unitsWithQuestion: units.filter((u) => covered.has(u.id)).length,
    uncoveredUnits: units.filter((u) => !covered.has(u.id)).map((u) => u.id),
  };
  return { units, questions, spices, errors, stats: { byType, byChapter, coverage } };
}
