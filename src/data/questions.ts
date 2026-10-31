import type { Question, Flashcard } from "../domain/types";
import { FORMAL_QUESTIONS, FORMAL_CARDS } from "./formal-questions";
/**
 * 正式問題は src/data/formal-questions.ts（生成物）から供給される。生成元は原文照合済み
 * （verified）知識単位のみで、生成・検証は scripts/generate-questions.mjs が担う
 * （docs/DECISIONS.md #13 / #15 / #18 / #19 / #21: draftQa の直接変換、プロフィール構造化属性からの生成、転記支持文つき人手作成、機械検証できる追加7形式の生成）。
 * 教科書外の知識で作った問題は含まない（指令書6.1）。
 * エンジン検証用サンプル（SAMPLE_QUESTIONS / SAMPLE_CARDS）は、ユーザー指示により
 * 2026-10-31 に全て削除した（docs/DECISIONS.md #52）。アプリに残るのは正式データのみ。
 */
export const QUESTIONS: Question[] = [...FORMAL_QUESTIONS]; // 正式問題（生成・検証済み。scripts/generate-questions.mjs）
export const KNOWLEDGE_UNITS: import("../domain/types").KnowledgeUnit[] = []; // 本文転記ベースの知識単位は 0件（未転記）。正式問題が参照する知識単位は取り込み済み知識単位（src/data/knowledge.ts）側
export const CARDS: Flashcard[] = [...FORMAL_CARDS]; // 正式カード（生成・検証済み。scripts/generate-questions.mjs）
