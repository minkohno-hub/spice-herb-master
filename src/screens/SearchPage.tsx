// 画面コンポーネント（バンドル分割バッチE1で src/App.tsx から分割。docs/DECISIONS.md #23）
// 複合フィルタはフェーズ7・バッチS1で実装（docs/DECISIONS.md #31）。絞り込みの
// 純粋ロジックは src/domain/search.ts に置き、単体テストで固定する。
import { useState } from "react";
import { ALL_SECTIONS, CHAPTERS } from "../data/structure";
import { QUESTIONS, SAMPLE_QUESTIONS } from "../data/questions";
import { FORMAT_LABELS, type QuestionFormat } from "../domain/types";
import {
  DEFAULT_SEARCH_FILTERS,
  SEARCH_DIFFICULTIES,
  availableSearchFormats,
  filterSearchResults,
  hasActiveSearchFilters,
  type SearchFilters,
  type SearchTarget,
} from "../domain/search";

const ALL_QUESTIONS = [...QUESTIONS, ...SAMPLE_QUESTIONS];
// 形式の選択肢は正式問題に実在する15形式（docs/DECISIONS.md #31）。
// サンプル限定の2形式（写真識別・フラッシュカード）は正式問題が存在しないため
// 選択肢に出さないが、「すべて」のときは従来どおりサンプル問題も検索対象になる。
const FORMAT_OPTIONS = availableSearchFormats(QUESTIONS);

export default function SearchPage() {
  const [filters, setFilters] = useState<SearchFilters>(DEFAULT_SEARCH_FILTERS);
  const { sections: secs, questions: qs, total } = filterSearchResults(
    ALL_SECTIONS,
    ALL_QUESTIONS,
    filters,
  );
  const set = (patch: Partial<SearchFilters>) => setFilters((f) => ({ ...f, ...patch }));
  const chapterLabel = CHAPTERS.find((c) => c.id === filters.chapterId)?.label;

  // 有効な条件の個別解除チップ（押すとその条件だけが解除される）
  const chips: Array<{ key: string; label: string; clearLabel: string; clear: () => void }> = [];
  if (filters.keyword)
    chips.push({
      key: "keyword",
      label: `キーワード: ${filters.keyword}`,
      clearLabel: "キーワードを解除",
      clear: () => set({ keyword: "" }),
    });
  if (filters.target !== "all")
    chips.push({
      key: "target",
      label: `対象: ${filters.target === "sections" ? "教材（節）のみ" : "問題のみ"}`,
      clearLabel: "検索対象を解除",
      clear: () => set({ target: "all" }),
    });
  if (filters.chapterId)
    chips.push({
      key: "chapter",
      label: `章: ${chapterLabel ?? filters.chapterId}`,
      clearLabel: "章を解除",
      clear: () => set({ chapterId: null }),
    });
  if (filters.format)
    chips.push({
      key: "format",
      label: `形式: ${FORMAT_LABELS[filters.format]}`,
      clearLabel: "問題形式を解除",
      clear: () => set({ format: null }),
    });
  if (filters.difficulty !== null)
    chips.push({
      key: "difficulty",
      label: `難易度: ${filters.difficulty}`,
      clearLabel: "難易度を解除",
      clear: () => set({ difficulty: null }),
    });

  return (
    <main>
      <h1>横断検索</h1>
      <input
        aria-label="キーワード"
        placeholder="キーワード（教材・問題・用語）"
        value={filters.keyword}
        onChange={(e) => set({ keyword: e.target.value })}
      />
      <section className="card" aria-label="検索条件">
        <h2>絞り込み条件</h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))",
            gap: ".8rem",
          }}
        >
          <label>
            検索対象
            <select
              aria-label="検索対象"
              value={filters.target}
              onChange={(e) => set({ target: e.target.value as SearchTarget })}
            >
              <option value="all">すべて</option>
              <option value="sections">教材（節）のみ</option>
              <option value="questions">問題のみ</option>
            </select>
          </label>
          <label>
            章
            <select
              aria-label="章"
              value={filters.chapterId ?? ""}
              onChange={(e) => set({ chapterId: e.target.value || null })}
            >
              <option value="">すべて</option>
              {CHAPTERS.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            問題形式
            <select
              aria-label="問題形式"
              value={filters.format ?? ""}
              onChange={(e) =>
                set({ format: (e.target.value || null) as QuestionFormat | null })
              }
            >
              <option value="">すべて</option>
              {FORMAT_OPTIONS.map((f) => (
                <option key={f} value={f}>
                  {FORMAT_LABELS[f]}
                </option>
              ))}
            </select>
          </label>
          <label>
            難易度
            <select
              aria-label="難易度"
              value={filters.difficulty === null ? "" : String(filters.difficulty)}
              onChange={(e) =>
                set({
                  difficulty: e.target.value
                    ? (Number(e.target.value) as SearchFilters["difficulty"])
                    : null,
                })
              }
            >
              <option value="">すべて</option>
              {SEARCH_DIFFICULTIES.map((d) => (
                <option key={d} value={d}>
                  難易度{d}
                </option>
              ))}
            </select>
          </label>
        </div>
        {hasActiveSearchFilters(filters) && (
          <p>
            {chips.map((chip) => (
              <button
                key={chip.key}
                type="button"
                className="ghost"
                aria-label={chip.clearLabel}
                onClick={chip.clear}
                style={{ marginRight: ".5rem", marginBottom: ".5rem" }}
              >
                {chip.label} ×
              </button>
            ))}
            <button
              type="button"
              aria-label="すべての条件を解除"
              onClick={() => setFilters(DEFAULT_SEARCH_FILTERS)}
            >
              すべての条件を解除
            </button>
          </p>
        )}
        <p aria-live="polite">
          検索結果 合計 {total}件（教材（節） {secs.length}件・問題 {qs.length}件）
        </p>
        <p className="muted">
          条件はすべてキーワードと AND で組み合わされます。問題形式・難易度は問題固有の条件のため、指定した場合は教材（節）は対象外になります。
        </p>
      </section>
      <section className="card">
        <h2>教材（節） {secs.length}件</h2>
        {secs.length === 0 ? (
          <p className="muted">該当する教材（節）はありません。</p>
        ) : (
          <ul>
            {secs.slice(0, 30).map((s) => (
              <li key={s.id}>
                {s.title}（p.{s.bookPage}・{s.transcriptionStatus}）
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className="card">
        <h2>問題 {qs.length}件</h2>
        {qs.length === 0 ? (
          <p className="muted">該当する問題はありません。</p>
        ) : (
          <ul>
            {qs.map((x) => (
              <li key={x.id}>
                [{FORMAT_LABELS[x.format]}/{x.status}] {x.prompt.slice(0, 80)}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
