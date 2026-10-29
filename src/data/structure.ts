export interface Section { id:string; title:string; bookPage:number; transcriptionStatus:string; sourceNote:string }
export interface Chapter { id:string; label:string; title:string; sections:Section[] }
export const CHAPTERS: Chapter[] = [
 {
  "id": "preface",
  "label": "序章",
  "title": "スパイス＆ハーブの歴史と基礎知識",
  "sections": [
   {
    "id": "history-world",
    "title": "世界における歴史",
    "bookPage": 6,
    "transcriptionStatus": "未処理",
    "sourceNote": "目次ページ画像 IMG_9577.PNG〜IMG_9579.PNG で照合済み（タイトルと開始ページのみ。本文は未転記）"
   },
   {
    "id": "history-japan",
    "title": "日本における歴史",
    "bookPage": 10,
    "transcriptionStatus": "未処理",
    "sourceNote": "目次ページ画像 IMG_9577.PNG〜IMG_9579.PNG で照合済み（タイトルと開始ページのみ。本文は未転記）"
   },
   {
    "id": "definition",
    "title": "スパイス＆ハーブの定義",
    "bookPage": 12,
    "transcriptionStatus": "未処理",
    "sourceNote": "目次ページ画像 IMG_9577.PNG〜IMG_9579.PNG で照合済み（タイトルと開始ページのみ。本文は未転記）"
   },
   {
    "id": "classification",
    "title": "スパイス＆ハーブの3つの分類",
    "bookPage": 12,
    "transcriptionStatus": "未処理",
    "sourceNote": "目次ページ画像 IMG_9577.PNG〜IMG_9579.PNG で照合済み（タイトルと開始ページのみ。本文は未転記）"
   },
   {
    "id": "preservation",
    "title": "スパイス＆ハーブの保存",
    "bookPage": 16,
    "transcriptionStatus": "未処理",
    "sourceNote": "目次ページ画像 IMG_9577.PNG〜IMG_9579.PNG で照合済み（タイトルと開始ページのみ。本文は未転記）"
   }
  ]
 },
 {
  "id": "ch1",
  "label": "第一章",
  "title": "料理とスパイス＆ハーブ",
  "sections": [
   {
    "id": "basic-aroma",
    "title": "香り、色、辛みの3つの働きを生かす",
    "bookPage": 18,
    "transcriptionStatus": "未処理",
    "sourceNote": "目次ページ画像 IMG_9577.PNG〜IMG_9579.PNG で照合済み（タイトルと開始ページのみ。本文は未転記）"
   },
   {
    "id": "basic-timing",
    "title": "使うタイミングと使用量を覚える",
    "bookPage": 21,
    "transcriptionStatus": "未処理",
    "sourceNote": "目次ページ画像 IMG_9577.PNG〜IMG_9579.PNG で照合済み（タイトルと開始ページのみ。本文は未転記）"
   },
   {
    "id": "basic-compat",
    "title": "素材との相性を知る",
    "bookPage": 23,
    "transcriptionStatus": "未処理",
    "sourceNote": "目次ページ画像 IMG_9577.PNG〜IMG_9579.PNG で照合済み（タイトルと開始ページのみ。本文は未転記）"
   },
   {
    "id": "world-africa",
    "title": "世界の料理・アフリカ、中近東",
    "bookPage": 25,
    "transcriptionStatus": "未処理",
    "sourceNote": "目次ページ画像 IMG_9577.PNG〜IMG_9579.PNG で照合済み（タイトルと開始ページのみ。本文は未転記）"
   },
   {
    "id": "world-europe",
    "title": "世界の料理・ヨーロッパ・ロシア",
    "bookPage": 26,
    "transcriptionStatus": "未処理",
    "sourceNote": "目次ページ画像 IMG_9577.PNG〜IMG_9579.PNG で照合済み（タイトルと開始ページのみ。本文は未転記）"
   },
   {
    "id": "world-asia",
    "title": "世界の料理・アジア・オセアニア",
    "bookPage": 28,
    "transcriptionStatus": "未処理",
    "sourceNote": "目次ページ画像 IMG_9577.PNG〜IMG_9579.PNG で照合済み（タイトルと開始ページのみ。本文は未転記）"
   },
   {
    "id": "world-america",
    "title": "世界の料理・アメリカ",
    "bookPage": 29,
    "transcriptionStatus": "未処理",
    "sourceNote": "目次ページ画像 IMG_9577.PNG〜IMG_9579.PNG で照合済み（タイトルと開始ページのみ。本文は未転記）"
   },
   {
    "id": "world-drink",
    "title": "世界のドリンク",
    "bookPage": 29,
    "transcriptionStatus": "未処理",
    "sourceNote": "目次ページ画像 IMG_9577.PNG〜IMG_9579.PNG で照合済み（タイトルと開始ページのみ。本文は未転記）"
   },
   {
    "id": "dish-curry",
    "title": "チキンカレー",
    "bookPage": 30,
    "transcriptionStatus": "未処理",
    "sourceNote": "目次ページ画像 IMG_9577.PNG〜IMG_9579.PNG で照合済み（タイトルと開始ページのみ。本文は未転記）"
   },
   {
    "id": "dish-genovese",
    "title": "パスタジェノベーゼ",
    "bookPage": 32,
    "transcriptionStatus": "未処理",
    "sourceNote": "目次ページ画像 IMG_9577.PNG〜IMG_9579.PNG で照合済み（タイトルと開始ページのみ。本文は未転記）"
   },
   {
    "id": "dish-paella",
    "title": "パエリア",
    "bookPage": 34,
    "transcriptionStatus": "未処理",
    "sourceNote": "目次ページ画像 IMG_9577.PNG〜IMG_9579.PNG で照合済み（タイトルと開始ページのみ。本文は未転記）"
   },
   {
    "id": "dish-chili",
    "title": "チリコンカン",
    "bookPage": 36,
    "transcriptionStatus": "未処理",
    "sourceNote": "目次ページ画像 IMG_9577.PNG〜IMG_9579.PNG で照合済み（タイトルと開始ページのみ。本文は未転記）"
   },
   {
    "id": "dish-kakuni",
    "title": "豚の角煮",
    "bookPage": 37,
    "transcriptionStatus": "未処理",
    "sourceNote": "目次ページ画像 IMG_9577.PNG〜IMG_9579.PNG で照合済み（タイトルと開始ページのみ。本文は未転記）"
   },
   {
    "id": "dish-ceviche",
    "title": "セビーチェ",
    "bookPage": 38,
    "transcriptionStatus": "未処理",
    "sourceNote": "目次ページ画像 IMG_9577.PNG〜IMG_9579.PNG で照合済み（タイトルと開始ページのみ。本文は未転記）"
   },
   {
    "id": "dish-hummus",
    "title": "フムス",
    "bookPage": 39,
    "transcriptionStatus": "未処理",
    "sourceNote": "目次ページ画像 IMG_9577.PNG〜IMG_9579.PNG で照合済み（タイトルと開始ページのみ。本文は未転記）"
   },
   {
    "id": "dish-lamb",
    "title": "ラムの煮込みとクスクス",
    "bookPage": 40,
    "transcriptionStatus": "未処理",
    "sourceNote": "目次ページ画像 IMG_9577.PNG〜IMG_9579.PNG で照合済み（タイトルと開始ページのみ。本文は未転記）"
   },
   {
    "id": "dish-currywurst",
    "title": "カリーヴルスト",
    "bookPage": 42,
    "transcriptionStatus": "未処理",
    "sourceNote": "目次ページ画像 IMG_9577.PNG〜IMG_9579.PNG で照合済み（タイトルと開始ページのみ。本文は未転記）"
   },
   {
    "id": "dish-cumin-potato",
    "title": "クミンポテト",
    "bookPage": 43,
    "transcriptionStatus": "未処理",
    "sourceNote": "目次ページ画像 IMG_9577.PNG〜IMG_9579.PNG で照合済み（タイトルと開始ページのみ。本文は未転記）"
   },
   {
    "id": "dish-chai",
    "title": "チャイ",
    "bookPage": 44,
    "transcriptionStatus": "未処理",
    "sourceNote": "目次ページ画像 IMG_9577.PNG〜IMG_9579.PNG で照合済み（タイトルと開始ページのみ。本文は未転記）"
   },
   {
    "id": "dish-apple",
    "title": "焼きりんご",
    "bookPage": 45,
    "transcriptionStatus": "未処理",
    "sourceNote": "目次ページ画像 IMG_9577.PNG〜IMG_9579.PNG で照合済み（タイトルと開始ページのみ。本文は未転記）"
   },
   {
    "id": "season-oil",
    "title": "フレーバーオイル",
    "bookPage": 46,
    "transcriptionStatus": "未処理",
    "sourceNote": "目次ページ画像 IMG_9577.PNG〜IMG_9579.PNG で照合済み（タイトルと開始ページのみ。本文は未転記）"
   },
   {
    "id": "season-vinegar",
    "title": "フレーバービネガー",
    "bookPage": 47,
    "transcriptionStatus": "未処理",
    "sourceNote": "目次ページ画像 IMG_9577.PNG〜IMG_9579.PNG で照合済み（タイトルと開始ページのみ。本文は未転記）"
   },
   {
    "id": "season-soy",
    "title": "フレーバーしょうゆ",
    "bookPage": 47,
    "transcriptionStatus": "未処理",
    "sourceNote": "目次ページ画像 IMG_9577.PNG〜IMG_9579.PNG で照合済み（タイトルと開始ページのみ。本文は未転記）"
   },
   {
    "id": "season-paste",
    "title": "手作りハーブペースト",
    "bookPage": 48,
    "transcriptionStatus": "未処理",
    "sourceNote": "目次ページ画像 IMG_9577.PNG〜IMG_9579.PNG で照合済み（タイトルと開始ページのみ。本文は未転記）"
   },
   {
    "id": "season-dressing",
    "title": "手作りドレッシング",
    "bookPage": 49,
    "transcriptionStatus": "未処理",
    "sourceNote": "目次ページ画像 IMG_9577.PNG〜IMG_9579.PNG で照合済み（タイトルと開始ページのみ。本文は未転記）"
   },
   {
    "id": "season-plus",
    "title": "ケチャップ、みそ、マヨネーズにプラス",
    "bookPage": 50,
    "transcriptionStatus": "未処理",
    "sourceNote": "目次ページ画像 IMG_9577.PNG〜IMG_9579.PNG で照合済み（タイトルと開始ページのみ。本文は未転記）"
   }
  ]
 },
 {
  "id": "ch2",
  "label": "第二章",
  "title": "スパイス＆ハーブ図鑑",
  "sections": [
   {
    "id": "item-anise",
    "title": "アニス",
    "bookPage": 52,
    "transcriptionStatus": "未処理",
    "sourceNote": "目次ページ画像 IMG_9577.PNG〜IMG_9579.PNG で照合済み（タイトルと開始ページのみ。本文は未転記）"
   },
   {
    "id": "item-allspice",
    "title": "オールスパイス",
    "bookPage": 53,
    "transcriptionStatus": "未処理",
    "sourceNote": "目次ページ画像 IMG_9577.PNG〜IMG_9579.PNG で照合済み（タイトルと開始ページのみ。本文は未転記）"
   },
   {
    "id": "item-oregano",
    "title": "オレガノ",
    "bookPage": 54,
    "transcriptionStatus": "未処理",
    "sourceNote": "目次ページ画像 IMG_9577.PNG〜IMG_9579.PNG で照合済み（タイトルと開始ページのみ。本文は未転記）"
   },
   {
    "id": "item-garlic",
    "title": "ガーリック",
    "bookPage": 55,
    "transcriptionStatus": "未処理",
    "sourceNote": "目次ページ画像 IMG_9577.PNG〜IMG_9579.PNG で照合済み（タイトルと開始ページのみ。本文は未転記）"
   },
   {
    "id": "item-cardamom",
    "title": "カルダモン",
    "bookPage": 56,
    "transcriptionStatus": "未処理",
    "sourceNote": "目次ページ画像 IMG_9577.PNG〜IMG_9579.PNG で照合済み（タイトルと開始ページのみ。本文は未転記）"
   },
   {
    "id": "item-caraway",
    "title": "キャラウェイ",
    "bookPage": 57,
    "transcriptionStatus": "未処理",
    "sourceNote": "目次ページ画像 IMG_9577.PNG〜IMG_9579.PNG で照合済み（タイトルと開始ページのみ。本文は未転記）"
   },
   {
    "id": "item-kuchinashi",
    "title": "くちなし",
    "bookPage": 58,
    "transcriptionStatus": "未処理",
    "sourceNote": "目次ページ画像 IMG_9577.PNG〜IMG_9579.PNG で照合済み（タイトルと開始ページのみ。本文は未転記）"
   },
   {
    "id": "item-cumin",
    "title": "クミン",
    "bookPage": 59,
    "transcriptionStatus": "未処理",
    "sourceNote": "目次ページ画像 IMG_9577.PNG〜IMG_9579.PNG で照合済み（タイトルと開始ページのみ。本文は未転記）"
   },
   {
    "id": "item-clove",
    "title": "クローブ",
    "bookPage": 60,
    "transcriptionStatus": "未処理",
    "sourceNote": "目次ページ画像 IMG_9577.PNG〜IMG_9579.PNG で照合済み（タイトルと開始ページのみ。本文は未転記）"
   },
   {
    "id": "item-pepper",
    "title": "こしょう",
    "bookPage": 61,
    "transcriptionStatus": "未処理",
    "sourceNote": "目次ページ画像 IMG_9577.PNG〜IMG_9579.PNG で照合済み（タイトルと開始ページのみ。本文は未転記）"
   },
   {
    "id": "item-coriander",
    "title": "コリアンダー",
    "bookPage": 63,
    "transcriptionStatus": "未処理",
    "sourceNote": "目次ページ画像 IMG_9577.PNG〜IMG_9579.PNG で照合済み（タイトルと開始ページのみ。本文は未転記）"
   },
   {
    "id": "item-saffron",
    "title": "サフラン",
    "bookPage": 64,
    "transcriptionStatus": "未処理",
    "sourceNote": "目次ページ画像 IMG_9577.PNG〜IMG_9579.PNG で照合済み（タイトルと開始ページのみ。本文は未転記）"
   },
   {
    "id": "item-sansho",
    "title": "山椒／花椒",
    "bookPage": 65,
    "transcriptionStatus": "未処理",
    "sourceNote": "目次ページ画像 IMG_9577.PNG〜IMG_9579.PNG で照合済み（タイトルと開始ページのみ。本文は未転記）"
   },
   {
    "id": "item-cinnamon",
    "title": "シナモン／カシア",
    "bookPage": 67,
    "transcriptionStatus": "未処理",
    "sourceNote": "目次ページ画像 IMG_9577.PNG〜IMG_9579.PNG で照合済み（タイトルと開始ページのみ。本文は未転記）"
   },
   {
    "id": "item-ginger",
    "title": "しょうが",
    "bookPage": 68,
    "transcriptionStatus": "未処理",
    "sourceNote": "目次ページ画像 IMG_9577.PNG〜IMG_9579.PNG で照合済み（タイトルと開始ページのみ。本文は未転記）"
   },
   {
    "id": "item-staranise",
    "title": "スターアニス",
    "bookPage": 69,
    "transcriptionStatus": "未処理",
    "sourceNote": "目次ページ画像 IMG_9577.PNG〜IMG_9579.PNG で照合済み（タイトルと開始ページのみ。本文は未転記）"
   },
   {
    "id": "item-sage-turmeric",
    "title": "セージ、ターメリック",
    "bookPage": 70,
    "transcriptionStatus": "未処理",
    "sourceNote": "目次ページ画像 IMG_9577.PNG〜IMG_9579.PNG で照合済み（タイトルと開始ページのみ。本文は未転記）"
   },
   {
    "id": "item-thyme",
    "title": "タイム",
    "bookPage": 71,
    "transcriptionStatus": "未処理",
    "sourceNote": "目次ページ画像 IMG_9577.PNG〜IMG_9579.PNG で照合済み（タイトルと開始ページのみ。本文は未転記）"
   },
   {
    "id": "item-tarragon",
    "title": "タラゴン",
    "bookPage": 72,
    "transcriptionStatus": "未処理",
    "sourceNote": "目次ページ画像 IMG_9577.PNG〜IMG_9579.PNG で照合済み（タイトルと開始ページのみ。本文は未転記）"
   },
   {
    "id": "item-chervil",
    "title": "チャービル",
    "bookPage": 73,
    "transcriptionStatus": "未処理",
    "sourceNote": "目次ページ画像 IMG_9577.PNG〜IMG_9579.PNG で照合済み（タイトルと開始ページのみ。本文は未転記）"
   },
   {
    "id": "item-chive",
    "title": "チャイブ",
    "bookPage": 74,
    "transcriptionStatus": "未処理",
    "sourceNote": "目次ページ画像 IMG_9577.PNG〜IMG_9579.PNG で照合済み（タイトルと開始ページのみ。本文は未転記）"
   },
   {
    "id": "item-dill",
    "title": "ディル",
    "bookPage": 75,
    "transcriptionStatus": "未処理",
    "sourceNote": "目次ページ画像 IMG_9577.PNG〜IMG_9579.PNG で照合済み（タイトルと開始ページのみ。本文は未転記）"
   },
   {
    "id": "item-chili",
    "title": "唐辛子",
    "bookPage": 76,
    "transcriptionStatus": "未処理",
    "sourceNote": "目次ページ画像 IMG_9577.PNG〜IMG_9579.PNG で照合済み（タイトルと開始ページのみ。本文は未転記）"
   },
   {
    "id": "item-nutmeg",
    "title": "ナツメッグ／メース",
    "bookPage": 78,
    "transcriptionStatus": "未処理",
    "sourceNote": "目次ページ画像 IMG_9577.PNG〜IMG_9579.PNG で照合済み（タイトルと開始ページのみ。本文は未転記）"
   },
   {
    "id": "item-basil",
    "title": "バジル",
    "bookPage": 79,
    "transcriptionStatus": "未処理",
    "sourceNote": "目次ページ画像 IMG_9577.PNG〜IMG_9579.PNG で照合済み（タイトルと開始ページのみ。本文は未転記）"
   },
   {
    "id": "item-parsley",
    "title": "パセリ",
    "bookPage": 80,
    "transcriptionStatus": "未処理",
    "sourceNote": "目次ページ画像 IMG_9577.PNG〜IMG_9579.PNG で照合済み（タイトルと開始ページのみ。本文は未転記）"
   },
   {
    "id": "item-vanilla",
    "title": "バニラ",
    "bookPage": 81,
    "transcriptionStatus": "未処理",
    "sourceNote": "目次ページ画像 IMG_9577.PNG〜IMG_9579.PNG で照合済み（タイトルと開始ページのみ。本文は未転記）"
   },
   {
    "id": "item-paprika",
    "title": "パプリカ",
    "bookPage": 82,
    "transcriptionStatus": "未処理",
    "sourceNote": "目次ページ画像 IMG_9577.PNG〜IMG_9579.PNG で照合済み（タイトルと開始ページのみ。本文は未転記）"
   },
   {
    "id": "item-fennel",
    "title": "フェンネル",
    "bookPage": 83,
    "transcriptionStatus": "未処理",
    "sourceNote": "目次ページ画像 IMG_9577.PNG〜IMG_9579.PNG で照合済み（タイトルと開始ページのみ。本文は未転記）"
   },
   {
    "id": "item-horseradish",
    "title": "ホースラディッシュ",
    "bookPage": 84,
    "transcriptionStatus": "未処理",
    "sourceNote": "目次ページ画像 IMG_9577.PNG〜IMG_9579.PNG で照合済み（タイトルと開始ページのみ。本文は未転記）"
   },
   {
    "id": "item-marjoram-mustard",
    "title": "マジョラム、マスタード",
    "bookPage": 85,
    "transcriptionStatus": "未処理",
    "sourceNote": "目次ページ画像 IMG_9577.PNG〜IMG_9579.PNG で照合済み（タイトルと開始ページのみ。本文は未転記）"
   },
   {
    "id": "item-mint",
    "title": "ミント",
    "bookPage": 87,
    "transcriptionStatus": "未処理",
    "sourceNote": "目次ページ画像 IMG_9577.PNG〜IMG_9579.PNG で照合済み（タイトルと開始ページのみ。本文は未転記）"
   },
   {
    "id": "item-rucola",
    "title": "ルッコラ",
    "bookPage": 88,
    "transcriptionStatus": "未処理",
    "sourceNote": "目次ページ画像 IMG_9577.PNG〜IMG_9579.PNG で照合済み（タイトルと開始ページのみ。本文は未転記）"
   },
   {
    "id": "item-lemongrass",
    "title": "レモングラス",
    "bookPage": 89,
    "transcriptionStatus": "未処理",
    "sourceNote": "目次ページ画像 IMG_9577.PNG〜IMG_9579.PNG で照合済み（タイトルと開始ページのみ。本文は未転記）"
   },
   {
    "id": "item-rosemary",
    "title": "ローズマリー",
    "bookPage": 90,
    "transcriptionStatus": "未処理",
    "sourceNote": "目次ページ画像 IMG_9577.PNG〜IMG_9579.PNG で照合済み（タイトルと開始ページのみ。本文は未転記）"
   },
   {
    "id": "item-laurel",
    "title": "ローレル",
    "bookPage": 91,
    "transcriptionStatus": "未処理",
    "sourceNote": "目次ページ画像 IMG_9577.PNG〜IMG_9579.PNG で照合済み（タイトルと開始ページのみ。本文は未転記）"
   },
   {
    "id": "item-wasabi",
    "title": "わさび",
    "bookPage": 92,
    "transcriptionStatus": "未処理",
    "sourceNote": "目次ページ画像 IMG_9577.PNG〜IMG_9579.PNG で照合済み（タイトルと開始ページのみ。本文は未転記）"
   },
   {
    "id": "item-mix",
    "title": "ミックススパイス・ハーブ",
    "bookPage": 93,
    "transcriptionStatus": "未処理",
    "sourceNote": "目次ページ画像 IMG_9577.PNG〜IMG_9579.PNG で照合済み（タイトルと開始ページのみ。本文は未転記）"
   },
   {
    "id": "item-others",
    "title": "その他のプロ級スパイス＆ハーブ",
    "bookPage": 98,
    "transcriptionStatus": "未処理",
    "sourceNote": "目次ページ画像 IMG_9577.PNG〜IMG_9579.PNG で照合済み（タイトルと開始ページのみ。本文は未転記）"
   }
  ]
 },
 {
  "id": "ch3",
  "label": "第三章",
  "title": "暮らしの中で楽しむ・役立てるスパイス＆ハーブ",
  "sections": [
   {
    "id": "life-tea",
    "title": "好みで楽しむハーブティー",
    "bookPage": 110,
    "transcriptionStatus": "未処理",
    "sourceNote": "目次ページ画像 IMG_9577.PNG〜IMG_9579.PNG で照合済み（タイトルと開始ページのみ。本文は未転記）"
   },
   {
    "id": "life-beauty",
    "title": "ヘルス＆ビューティーに生かすスパイス＆ハーブ",
    "bookPage": 115,
    "transcriptionStatus": "未処理",
    "sourceNote": "目次ページ画像 IMG_9577.PNG〜IMG_9579.PNG で照合済み（タイトルと開始ページのみ。本文は未転記）"
   },
   {
    "id": "life-house",
    "title": "ハウスキーピングに役立つスパイス＆ハーブ",
    "bookPage": 117,
    "transcriptionStatus": "未処理",
    "sourceNote": "目次ページ画像 IMG_9577.PNG〜IMG_9579.PNG で照合済み（タイトルと開始ページのみ。本文は未転記）"
   },
   {
    "id": "life-handmade",
    "title": "ハンドメイドで楽しむスパイス＆ハーブ",
    "bookPage": 119,
    "transcriptionStatus": "未処理",
    "sourceNote": "目次ページ画像 IMG_9577.PNG〜IMG_9579.PNG で照合済み（タイトルと開始ページのみ。本文は未転記）"
   },
   {
    "id": "life-grow",
    "title": "手軽に育てる ハーブの栽培",
    "bookPage": 122,
    "transcriptionStatus": "未処理",
    "sourceNote": "目次ページ画像 IMG_9577.PNG〜IMG_9579.PNG で照合済み（タイトルと開始ページのみ。本文は未転記）"
   },
   {
    "id": "life-health",
    "title": "スパイス＆ハーブと健康",
    "bookPage": 128,
    "transcriptionStatus": "未処理",
    "sourceNote": "目次ページ画像 IMG_9577.PNG〜IMG_9579.PNG で照合済み（タイトルと開始ページのみ。本文は未転記）"
   }
  ]
 },
 {
  "id": "appendix",
  "label": "検定情報",
  "title": "スパイス＆ハーブ検定について",
  "sections": [
   {
    "id": "exam-about",
    "title": "スパイス＆ハーブ検定について",
    "bookPage": 136,
    "transcriptionStatus": "未処理",
    "sourceNote": "目次ページ画像 IMG_9577.PNG〜IMG_9579.PNG で照合済み（タイトルと開始ページのみ。本文は未転記）"
   },
   {
    "id": "exam-outline",
    "title": "試験概要",
    "bookPage": 137,
    "transcriptionStatus": "未処理",
    "sourceNote": "目次ページ画像 IMG_9577.PNG〜IMG_9579.PNG で照合済み（タイトルと開始ページのみ。本文は未転記）"
   },
   {
    "id": "exam-target",
    "title": "スパイス＆ハーブ検定 対象スパイス＆ハーブ",
    "bookPage": 138,
    "transcriptionStatus": "未処理",
    "sourceNote": "目次ページ画像 IMG_9577.PNG〜IMG_9579.PNG で照合済み（タイトルと開始ページのみ。本文は未転記）"
   },
   {
    "id": "exam-sample",
    "title": "スパイス＆ハーブ検定 予想問題",
    "bookPage": 139,
    "transcriptionStatus": "未処理",
    "sourceNote": "目次ページ画像 IMG_9577.PNG〜IMG_9579.PNG で照合済み（タイトルと開始ページのみ。本文は未転記）"
   },
   {
    "id": "index",
    "title": "主なスパイス＆ハーブの索引",
    "bookPage": 145,
    "transcriptionStatus": "未処理",
    "sourceNote": "目次ページ画像 IMG_9577.PNG〜IMG_9579.PNG で照合済み（タイトルと開始ページのみ。本文は未転記）"
   }
  ]
 }
];
export const ALL_SECTIONS = CHAPTERS.flatMap(c=>c.sections.map(s=>({...s,chapterId:c.id,chapterLabel:c.label})));
