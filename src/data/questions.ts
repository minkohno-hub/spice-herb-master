
import type { Question, Flashcard } from "../domain/types";
/**
 * 正式問題は 0 問。本文ページが未転記のため、教科書知識を問う問題はまだ作らない（指令書6.1）。
 * 以下はすべて status:"sample" のエンジン検証用サンプル。題材は「このアプリの利用ルール」であり
 * 教科書の知識ではない。通常出題（verified のみ）からは validate.ts の selectForPractice で除外される。
 */
const base = { version: 1, status: "sample" as const, chapterId: "appendix", sectionId: "exam-about", difficulty: 1 as const, knowledgeUnitIds: [] as string[], sourceRefs: [] as Question["sourceRefs"], explanation: "サンプル解説: これはエンジン検証用であり、教科書の解説ではありません。" };
export const SAMPLE_QUESTIONS: Question[] = [
 { ...base, id:"sample-single", format:"single-choice", prompt:"[サンプル] このアプリで通常出題される正式問題の条件はどれか。", choices:["出典が検証済みの問題","思いつきで作った問題","教科書外の一般知識問題","出典不明の問題"], correctChoiceIndexes:[0] },
 { ...base, id:"sample-multi", format:"multiple-choice", prompt:"[サンプル] 学習履歴として保存されるものをすべて選べ。", choices:["解答記録","復習予定","お気に入り","パスワード"], correctChoiceIndexes:[0,1,2] },
 { ...base, id:"sample-tf", format:"true-false", prompt:"[サンプル] 未検証の問題を検証済みとして表示してよい。", correctBoolean:false },
 { ...base, id:"sample-fill", format:"fill-blank", prompt:"[サンプル] 穴埋め: 学習履歴はブラウザの（　）に保存される。", acceptedAnswers:["localStorage","ローカルストレージ"] },
 { ...base, id:"sample-term", format:"term-input", prompt:"[サンプル] 間隔反復の基礎アルゴリズム名（英字略称）を入力せよ。", acceptedAnswers:["SM-2","SM2"] },
 { ...base, id:"sample-one", format:"one-answer", prompt:"[サンプル] 一問一答: 記述式の自動判定と分離して保存される評価は何か。", acceptedAnswers:["自己採点","自己評価"] },
 { ...base, id:"sample-short", format:"short-essay", prompt:"[サンプル] 記述式採点で要点チェックを使う理由を短く述べよ。", modelAnswer:"（サンプル模範）自由文の意味を完全には判定できないため、必須要点の有無を部分点で示し、自己採点と分離する。", rubric:[{id:"r1",label:"要点チェックの目的",keywords:["要点"],required:true,points:1},{id:"r2",label:"自己採点との分離",keywords:["自己採点","自己評価"],required:true,points:1}] },
 { ...base, id:"sample-long", format:"long-essay", prompt:"[サンプル] 教科書外の知識で問題を作ってはいけない理由を長文で述べよ。", modelAnswer:"（サンプル模範）検定の出題範囲は教科書に限定されるため。", rubric:[{id:"r1",label:"出題範囲は教科書",keywords:["教科書"],required:true,points:1},{id:"r2",label:"出典の必要性",keywords:["出典"],required:false,points:1}] },
 { ...base, id:"sample-compare", format:"compare-essay", prompt:"[サンプル] 自動判定と自己採点を比較して述べよ。", modelAnswer:"（サンプル模範）自動判定は要点一致、自己採点は学習者自身の評価。", rubric:[{id:"r1",label:"自動判定に言及",keywords:["自動"],required:true,points:1},{id:"r2",label:"自己採点に言及",keywords:["自己採点"],required:true,points:1}] },
 { ...base, id:"sample-order", format:"ordering", prompt:"[サンプル] 学習の流れを正しい順に並べ替えよ。", orderingItems:["問題に回答する","解説を読む","復習予定が立つ"], correctOrder:["問題に回答する","解説を読む","復習予定が立つ"] },
 { ...base, id:"sample-match", format:"matching", prompt:"[サンプル] 用語と説明を組み合わせよ。", matchingPairs:[{left:"SRS",right:"間隔反復学習"},{left:"PWA",right:"ホーム画面に追加できるWebアプリ"}] },
 { ...base, id:"sample-reverse", format:"reverse-lookup", prompt:"[サンプル] 逆引き: 「出典が未確認の問題」の状態として正しいものはどれか。", choices:["unverified","verified","collated"], correctChoiceIndexes:[0] },
 { ...base, id:"sample-photo", format:"photo-id", prompt:"[サンプル] 写真識別エンジン検証: 画像参照が未設定の場合に表示すべきものはどれか。", choices:["画像未設定の案内","無関係な写真","他サイトの画像"], correctChoiceIndexes:[0], imageAlt:"サンプル画像（未設定）", imageRef:null },
 { ...base, id:"sample-figure", format:"figure", prompt:"[サンプル] 図表問題エンジン検証: 表から読み取れるアプリ指標はどれか。", choices:["網羅率","天気","株価"], correctChoiceIndexes:[0], table:{headers:["指標","値"],rows:[["取り込み率","139/140"]]} },
 { ...base, id:"sample-tablefill", format:"table-fill", prompt:"[サンプル] 表の空欄を埋めよ（指標名）。", table:{headers:["番号","指標"],rows:[["1","（空欄A）"]]}, blankCellAnswers:{"A":"取り込み率"} },
 { ...base, id:"sample-composite", format:"composite", prompt:"[サンプル] 複合: 品質管理画面で確認できる項目を2つ要点で挙げよ。", modelAnswer:"（サンプル模範）未検証問題と出典不明問題。", rubric:[{id:"r1",label:"未検証",keywords:["未検証"],required:true,points:1},{id:"r2",label:"出典",keywords:["出典"],required:true,points:1}] },
 { ...base, id:"sample-flash", format:"flashcard", prompt:"[サンプル] カード形式サンプル: 「verified」の意味として正しいものはどれか。", choices:["検証済み","未処理","欠落"], correctChoiceIndexes:[0] },
];
export const QUESTIONS: Question[] = []; // 正式問題 0問（本文未転記のため）
export const KNOWLEDGE_UNITS: import("../domain/types").KnowledgeUnit[] = []; // 知識単位 0件（本文未転記のため抽出未実施）
export const SAMPLE_CARDS: Flashcard[] = [
 { id:"card-sample-1", front:"[サンプルカード] 正式問題に必須のものは？", back:"教科書原文への出典参照（知識単位経由）", chapterId:"appendix", sectionId:"exam-about", status:"sample", knowledgeUnitIds:[], sourceRefs:[] },
 { id:"card-sample-2", front:"[サンプルカード] 自動判定と分離して保存される評価は？", back:"自己採点", chapterId:"appendix", sectionId:"exam-about", status:"sample", knowledgeUnitIds:[], sourceRefs:[] },
];
export const CARDS: Flashcard[] = []; // 正式カード 0件
