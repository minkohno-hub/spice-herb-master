
export const QUESTION_FORMATS = ["single-choice","multiple-choice","true-false","fill-blank","term-input","one-answer","short-essay","long-essay","compare-essay","ordering","matching","reverse-lookup","photo-id","figure","table-fill","composite","flashcard"] as const;
export type QuestionFormat = typeof QUESTION_FORMATS[number];
export const FORMAT_LABELS: Record<QuestionFormat,string> = {"single-choice":"四択","multiple-choice":"多択","true-false":"正誤判定","fill-blank":"穴埋め","term-input":"用語入力","one-answer":"一問一答","short-essay":"短文記述","long-essay":"長文記述","compare-essay":"比較記述","ordering":"順序並べ替え","matching":"組み合わせ","reverse-lookup":"逆引き","photo-id":"写真を用いた識別","figure":"図表を用いた問題","table-fill":"表の穴埋め","composite":"複数知識の組み合わせ","flashcard":"フラッシュカード"};
export type VerificationStatus = "unprocessed"|"extracted"|"needs-check"|"collated"|"unclear"|"missing";
export type QuestionStatus = "verified"|"unverified"|"sample"|"excluded";
export interface SourceRef { manifestImageId: string; bookPage: number|null; locationNote: string; }
export interface KnowledgeUnit { id: string; materialId: string; materialVersion: string; chapterId: string; sectionId: string; bookPage: number|null; sourceRefs: SourceRef[]; content: string; category: string; relatedTerms: string[]; relatedUnitIds: string[]; verificationStatus: VerificationStatus; questionIds: string[]; cardIds: string[]; }
export interface RubricPoint { id: string; label: string; keywords: string[]; required: boolean; points: number; }
export interface Question {
  id: string; version: number; format: QuestionFormat; status: QuestionStatus;
  chapterId: string; sectionId: string; difficulty: 1|2|3|4|5;
  prompt: string; choices?: string[]; correctChoiceIndexes?: number[]; correctBoolean?: boolean;
  acceptedAnswers?: string[]; modelAnswer?: string; rubric?: RubricPoint[];
  orderingItems?: string[]; correctOrder?: string[]; matchingPairs?: {left:string;right:string}[];
  table?: { headers: string[]; rows: string[][] }; blankCellAnswers?: Record<string,string>;
  imageAlt?: string; imageRef?: string|null;
  explanation: string; knowledgeUnitIds: string[]; sourceRefs: SourceRef[];
}
export interface Flashcard { id: string; front: string; back: string; reverseOf?: string|null; chapterId: string; sectionId: string; status: QuestionStatus; knowledgeUnitIds: string[]; sourceRefs: SourceRef[]; }
/** Claude版ブランチから取り込んだ知識単位（フェーズ2統合）。全件 unverified 固定: 内容の人手照合が済むまで verified にしない。 */
export interface KnowledgeSource { page: number; sourceUnitId: string; origin: "claude/build-learning-app"; }
export interface ImportedKnowledgeUnit {
  id: string; kind: "unit"|"spice-fact"|"spice-profile"; status: "unverified";
  chapterId: string; sectionTitle: string; category: string; content: string;
  source: KnowledgeSource;
  draftQa: { q: string; a: string; alt: string[] } | null;
  spice: { id: string; name: string; en: string|null } | null;
}
export interface AnswerRecord { questionId: string; answeredAt: string; correct: boolean|null; scoreRatio: number|null; autoScoreRatio: number|null; selfScoreRatio: number|null; responseMs: number|null; selfEval?: "known"|"unsure"|"unknown"|null; mistakeCause?: string|null; }
export interface SrsState { itemId: string; easeFactor: number; intervalDays: number; repetitions: number; dueAt: string; lastReviewedAt: string|null; }
export interface ReaderState { sectionId: string; fontSize: number; dark: boolean; bookmarks: string[]; highlights: Record<string,string>; notes: Record<string,string>; }
