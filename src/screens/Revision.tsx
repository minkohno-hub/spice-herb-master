// 4訂版の改訂ポイント画面（docs/DECISIONS.md #42）。
// 出典は山崎香辛料振興財団の公式資料（2026年3月）で、データは src/data/revision.ts。
// 教科書の転記ではないため、リーダーとは独立した画面にし、該当ページへは
// リーダーの節へ移動するボタンでつなぐ。上部バー（ヘッダー）には手を入れない。
import { useNavigate } from "react-router";
import { ALL_SECTIONS } from "../data/structure";
import type { StoreData } from "../domain/store";
import {
  REVISION_AREAS,
  REVISION_BROAD,
  REVISION_ENTRIES,
  REVISION_EXAM_NOTE,
  REVISION_EXAM_SCOPE,
  REVISION_LEVEL1_ADDED,
  REVISION_LEVEL1_REMOVED,
  REVISION_RENAMED,
  REVISION_SOURCE,
  REVISION_STAR_NOTE,
} from "../data/revision";

/** 本のページ番号から、そのページを含む節を引く（節は本の順序でページを覆う） */
export function sectionIdForBookPage(page: number): string {
  let best = ALL_SECTIONS[0]!;
  for (const s of ALL_SECTIONS) {
    if (s.bookPage <= page && s.bookPage >= best.bookPage) best = s;
  }
  return best.id;
}

export default function Revision({ update }: { store: StoreData; update: any }) {
  const navigate = useNavigate();
  const jump = (page: number) => {
    const sid = sectionIdForBookPage(page);
    update((d: StoreData) => {
      d.reader.sectionId = sid;
      return d;
    });
    // FIX（DECISIONS #51）: 節の先頭ではなく、指定ページそのものへ着地させる
    navigate("/reader", { state: { targetPage: page } });
  };
  const pageButton = (page: number) => (
    <button type="button" onClick={() => jump(page)}>
      4訂版 p.{page} を読む
    </button>
  );
  return (
    <main>
      <h1>改訂ポイント（4訂版）</h1>

      <section className="card">
        <h2>試験への対応</h2>
        <ul>
          {REVISION_EXAM_SCOPE.map((r) => (
            <li key={r.round}>
              <strong>{r.round}</strong>: {r.scope}
            </li>
          ))}
        </ul>
        <p className="muted">{REVISION_EXAM_NOTE}</p>
      </section>

      <section className="card">
        <h2>1級対象スパイスの変更・見出し名称変更</h2>
        <h3>新規対象品目（新規掲載）</h3>
        <ul>
          {REVISION_LEVEL1_ADDED.map((x) => (
            <li key={x.name}>
              <strong>{x.name}</strong>（{x.note}） {pageButton(x.bookPage)}
            </li>
          ))}
        </ul>
        <h3>掲載削除</h3>
        <ul>
          {REVISION_LEVEL1_REMOVED.map((x) => (
            <li key={x.name}>
              <strong>{x.name}</strong>: {x.note}
              {x.bookPage != null ? <> {pageButton(x.bookPage)}</> : null}
            </li>
          ))}
        </ul>
        <h3>見出し名称変更</h3>
        <ul>
          {REVISION_RENAMED.map((x) => (
            <li key={x.to}>
              旧版「{x.from}」→ 新版「<strong>{x.to}</strong>」 {pageButton(x.bookPage)}
            </li>
          ))}
        </ul>
      </section>

      <section className="card">
        <h2>主な変更箇所一覧（抜粋）</h2>
        <p className="muted">
          資料の「主な変更箇所一覧」から読み取れた項目を抜粋しています。旧版の記載 → 4訂版の記載の形で示します。
        </p>
        {REVISION_AREAS.map((area) => (
          <div key={area}>
            <h3>{area}</h3>
            <ul>
              {REVISION_ENTRIES.filter((e) => e.area === area).map((e) => (
                <li key={e.id}>
                  <strong>{e.item}</strong>: {e.change}
                  {e.bookPage != null ? <> {pageButton(e.bookPage)}</> : null}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      <section className="card">
        <h2>全面見直し・全面改訂</h2>
        <p className="muted">
          次の項目は資料で全体の見直し・改訂が示されていますが、個々の修正内容の記載は省略されています。
          学習時は4訂版の該当ページをそのまま確認してください。
        </p>
        <ul>
          {REVISION_BROAD.map((b) => (
            <li key={b.item}>
              <strong>{b.item}</strong>: {b.change} {pageButton(b.bookPage)}
            </li>
          ))}
        </ul>
      </section>

      <section className="card">
        <h2>出典と注記</h2>
        <p className="muted">{REVISION_STAR_NOTE}</p>
        <p>
          出典: {REVISION_SOURCE.publisher}「{REVISION_SOURCE.title}」（{REVISION_SOURCE.date}）
          <br />
          <a href={REVISION_SOURCE.url} target="_blank" rel="noreferrer">
            資料PDF（公式サイト）
          </a>
        </p>
      </section>

      {/* 黄色い説明ブロックは下に置く（ユーザー指示 2026-10-31、UX11） */}
      <p className="badge">
        このアプリの教材である公式テキスト「4訂版」で、旧版（2020年発行「最新版」）から変わった点を、
        {REVISION_SOURCE.publisher}の公式資料（{REVISION_SOURCE.date}）から抜粋してまとめました。
        2027年以降の検定は4訂版からのみ出題されるため、旧版で学んだ人は特に確認してください。
      </p>
    </main>
  );
}
