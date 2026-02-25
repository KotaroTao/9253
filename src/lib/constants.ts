import type { PlanTier } from "@/types"

export const APP_NAME = "MIERU Clinic"
export const APP_DESCRIPTION = "患者体験の見える化"

// ─── 料金プラン定義 ───

/** LP表示用（demoは含まない） */
export const PLAN_ORDER: PlanTier[] = ["free", "starter", "standard", "enterprise"]

/** 管理画面用（全プラン） */
export const ALL_PLAN_TIERS: PlanTier[] = ["free", "starter", "standard", "enterprise", "demo", "special"]

export interface PlanDefinition {
  tier: PlanTier
  name: string
  price: number // 月額（税抜）、0 = 無料
  priceLabel: string
  priceNote: string
  description: string
  monthlyResponseLimit: number | null // null = 無制限
  staffLimit: number | null // null = 無制限
  dataRetentionMonths: number | null // null = 無制限
  features: readonly string[]
  highlighted?: boolean // LPでおすすめ表示
}

export const PLANS: Record<PlanTier, PlanDefinition> = {
  free: {
    tier: "free",
    name: "フリー",
    price: 0,
    priceLabel: "¥0",
    priceNote: "永久無料",
    description: "まずは試してみたい医院向け",
    monthlyResponseLimit: 50,
    staffLimit: 1,
    dataRetentionMonths: 3,
    features: [
      "アンケート月50件まで",
      "スタッフ1名",
      "基本ダッシュボード",
      "ゲーミフィケーション",
      "データ保持3ヶ月",
    ],
  },
  starter: {
    tier: "starter",
    name: "スターター",
    price: 9800,
    priceLabel: "¥9,800",
    priceNote: "/月（税抜）",
    description: "アンケートを本格運用したい医院向け",
    monthlyResponseLimit: 300,
    staffLimit: 3,
    dataRetentionMonths: 12,
    features: [
      "アンケート月300件まで",
      "スタッフ3名まで",
      "日次トレンド分析",
      "質問別スコア分析",
      "アンケート一覧",
      "データ保持12ヶ月",
    ],
  },
  standard: {
    tier: "standard",
    name: "スタンダード",
    price: 19800,
    priceLabel: "¥19,800",
    priceNote: "/月（税抜）",
    description: "データで経営改善を実現したい医院向け",
    monthlyResponseLimit: null,
    staffLimit: 10,
    dataRetentionMonths: null,
    highlighted: true,
    features: [
      "アンケート無制限",
      "スタッフ10名まで",
      "満足度レポート全機能",
      "AI分析レポート",
      "経営レポート・KPI自動算出",
      "改善アクション管理",
      "患者属性フィルタ（5軸）",
      "LINE・HP誘導",
      "データ保持無制限",
    ],
  },
  enterprise: {
    tier: "enterprise",
    name: "エンタープライズ",
    price: 39800,
    priceLabel: "¥39,800〜",
    priceNote: "/月（税抜）",
    description: "複数院を一元管理したい医療法人向け",
    monthlyResponseLimit: null,
    staffLimit: null,
    dataRetentionMonths: null,
    features: [
      "スタンダード全機能",
      "スタッフ無制限",
      "本院＋1分院（計2院）",
      "追加院 ¥14,800/月",
      "法人横断ダッシュボード",
      "専任サポート",
    ],
  },
  demo: {
    tier: "demo",
    name: "デモ",
    price: 0,
    priceLabel: "¥0",
    priceNote: "無期限",
    description: "デモンストレーション用・無期限（LP非表示）",
    monthlyResponseLimit: null,
    staffLimit: null,
    dataRetentionMonths: null,
    features: [
      "全機能利用可能",
      "有効期限なし",
      "デモ専用設定",
    ],
  },
  special: {
    tier: "special",
    name: "特別プラン",
    price: 0,
    priceLabel: "¥0",
    priceNote: "無料",
    description: "スタンダード全機能を無料でご利用いただけます",
    monthlyResponseLimit: null,
    staffLimit: 10,
    dataRetentionMonths: null,
    features: [
      "アンケート無制限",
      "スタッフ10名まで",
      "満足度レポート全機能",
      "AI分析レポート",
      "経営レポート・KPI自動算出",
      "改善アクション管理",
      "患者属性フィルタ（5軸）",
      "LINE・HP誘導",
      "データ保持無制限",
    ],
  },
} as const

/** 機能ごとに必要な最低プラン */
export const FEATURE_REQUIREMENTS: Record<string, PlanTier> = {
  analytics: "standard",
  advisory: "standard",
  improvement_actions: "standard",
  business_metrics: "standard",
  surveys_list: "starter",
  staff_management: "starter",
  patient_filters_full: "standard",
  line_integration: "standard",
  multi_clinic: "enterprise",
} as const

export const TRIAL_DURATION_DAYS = 14

export const ROLES = {
  SYSTEM_ADMIN: "system_admin",
  CLINIC_ADMIN: "clinic_admin",
  STAFF: "staff",
} as const

export const STAFF_ROLES = {
  DENTIST: "dentist",
  HYGIENIST: "hygienist",
  STAFF: "staff",
} as const

export const STAFF_ROLE_LABELS: Record<string, string> = {
  dentist: "歯科医師",
  hygienist: "歯科衛生士",
  staff: "スタッフ",
}

export const SURVEY_QUESTION_TYPES = {
  RATING: "rating",
  TEXT: "text",
} as const

export const DEFAULTS = {
  ITEMS_PER_PAGE: 20,
  CHART_MONTHS: 6,
  MAX_FREE_TEXT_LENGTH: 500,
  MIN_STAR_RATING: 1,
  MAX_STAR_RATING: 5,
} as const

// ─── PX-Value Segment Labels ───
export const SEGMENT_LABELS: Record<string, string> = {
  emergency: "緊急患者（痛み）",
  maintenance: "予防・検診",
  highValue: "自費診療",
  general: "一般",
} as const

export const MILESTONES = [50, 100, 250, 500, 1000, 2000, 5000, 10000] as const

// Streak milestones for badge display
export const STREAK_MILESTONES = [
  { days: 3, label: "3日連続", emoji: "🔥" },
  { days: 7, label: "1週間", emoji: "⚡" },
  { days: 14, label: "2週間", emoji: "💪" },
  { days: 30, label: "1ヶ月", emoji: "🌟" },
  { days: 60, label: "2ヶ月", emoji: "🎯" },
  { days: 90, label: "3ヶ月", emoji: "👑" },
] as const

// Rank system based on total survey count
export const RANKS = [
  { name: "ルーキー", minCount: 0, color: "slate", emoji: "🌱" },
  { name: "ブロンズ", minCount: 50, color: "amber", emoji: "🥉" },
  { name: "シルバー", minCount: 100, color: "gray", emoji: "🥈" },
  { name: "ゴールド", minCount: 250, color: "yellow", emoji: "🥇" },
  { name: "プラチナ", minCount: 500, color: "cyan", emoji: "💎" },
  { name: "ダイヤモンド", minCount: 1000, color: "blue", emoji: "👑" },
  { name: "マスター", minCount: 2000, color: "purple", emoji: "🏆" },
  { name: "レジェンド", minCount: 5000, color: "rose", emoji: "⭐" },
] as const

export type Rank = (typeof RANKS)[number]

export function getRank(totalCount: number): Rank {
  let rank: Rank = RANKS[0]
  for (const r of RANKS) {
    if (totalCount >= r.minCount) rank = r
  }
  return rank
}

export function getNextRank(totalCount: number): Rank | null {
  for (const r of RANKS) {
    if (totalCount < r.minCount) return r
  }
  return null
}

// Patient attribute options for staff setup screen
export const VISIT_TYPES = [
  { value: "first_visit", label: "初診" },
  { value: "revisit", label: "再診" },
] as const

// Insurance type (mandatory first choice in kiosk)
export const INSURANCE_TYPES = [
  { value: "insurance", label: "保険診療" },
  { value: "self_pay", label: "自費診療" },
] as const

// Purpose options conditional on insurance type
export const INSURANCE_PURPOSES = [
  { value: "cavity_treatment", label: "う蝕処置" },
  { value: "periodontal", label: "歯周治療" },
  { value: "prosthetic_insurance", label: "被せもの・ブリッジ" },
  { value: "denture_insurance", label: "保険義歯" },
  { value: "checkup_insurance", label: "保険メンテ" },
  { value: "extraction_surgery", label: "抜歯" },
  { value: "emergency", label: "急患・応急処置" },
  { value: "other_insurance", label: "その他" },
] as const

export const SELF_PAY_PURPOSES = [
  { value: "cavity_treatment_self", label: "う蝕処置" },
  { value: "periodontal_self", label: "歯周治療" },
  { value: "prosthetic_self_pay", label: "被せもの・ブリッジ" },
  { value: "denture_self_pay", label: "自費義歯" },
  { value: "self_pay_cleaning", label: "自費メンテ" },
  { value: "implant", label: "インプラント" },
  { value: "wire_orthodontics", label: "ワイヤー矯正" },
  { value: "aligner", label: "マウスピース矯正" },
  { value: "whitening", label: "ホワイトニング" },
  { value: "other_self_pay", label: "その他" },
] as const

// Legacy constants (kept for backward compatibility with old data)
export const TREATMENT_TYPES = [
  { value: "treatment", label: "治療" },
  { value: "checkup", label: "定期検診" },
  { value: "consultation", label: "相談" },
] as const

export const CHIEF_COMPLAINTS = [
  { value: "pain", label: "痛み・違和感" },
  { value: "filling_crown", label: "詰め物・被せ物" },
  { value: "periodontal", label: "歯周病・歯ぐき" },
  { value: "cosmetic", label: "審美・ホワイトニング" },
  { value: "prevention", label: "予防・クリーニング" },
  { value: "orthodontics", label: "矯正" },
  { value: "denture_implant", label: "入れ歯・インプラント" },
  { value: "other", label: "その他" },
] as const

export const AGE_GROUPS = [
  { value: "under_10s", label: "〜10代" },
  { value: "under_20", label: "20代" },
  { value: "30s", label: "30代" },
  { value: "40s", label: "40代" },
  { value: "50s", label: "50代" },
  { value: "60s_over", label: "60代〜" },
] as const

export const GENDERS = [
  { value: "male", label: "男性" },
  { value: "female", label: "女性" },
  { value: "unspecified", label: "未回答" },
] as const

// Template name → selection mapping
export const TEMPLATE_SELECTION_MAP: Record<string, { visitType: string }> = {
  "初診": { visitType: "first_visit" },
  "再診": { visitType: "revisit" },
}

// Improvement action suggestions per question category
// Each question ID maps to a category, and each category has pre-defined suggestions
export const QUESTION_CATEGORY_MAP: Record<string, string> = {
  fv1: "clinic_environment",
  fv2: "reception",
  fv3: "wait_time",
  fv4: "hearing",
  fv5: "explanation",
  fv6: "cost_explanation",
  fv7: "comfort",
  fv8: "loyalty",
  tr1: "explanation",
  tr2: "pain_care",
  tr3: "comfort",
  tr4: "wait_time",
  tr5: "staff_courtesy",
  tr6: "loyalty",
}

/** 全アンケート質問の一覧（チェックリスト表示用） */
export const ALL_SURVEY_QUESTIONS = [
  { group: "初診", questions: [
    { id: "fv1", text: "医院の第一印象（清潔さ・雰囲気）はいかがでしたか？" },
    { id: "fv2", text: "受付の対応は丁寧でしたか？" },
    { id: "fv3", text: "待ち時間は気にならない程度でしたか？" },
    { id: "fv4", text: "お悩みや症状についてのヒアリングは十分でしたか？" },
    { id: "fv5", text: "今後の方針や内容の説明は分かりやすかったですか？" },
    { id: "fv6", text: "費用に関する説明は十分でしたか？" },
    { id: "fv7", text: "不安や疑問を相談しやすい雰囲気でしたか？" },
    { id: "fv8", text: "当院をご家族・知人にも紹介したいと思いますか？" },
  ]},
  { group: "再診", questions: [
    { id: "tr1", text: "本日の診療についての説明は分かりやすかったですか？" },
    { id: "tr2", text: "不安や痛みへの配慮は十分でしたか？" },
    { id: "tr3", text: "質問や相談がしやすい雰囲気でしたか？" },
    { id: "tr4", text: "待ち時間は気にならない程度でしたか？" },
    { id: "tr5", text: "スタッフの対応は丁寧でしたか？" },
    { id: "tr6", text: "当院をご家族・知人にも紹介したいと思いますか？" },
  ]},
]

export interface ImprovementSuggestion {
  title: string
  description: string
}

export const IMPROVEMENT_SUGGESTIONS: Record<string, ImprovementSuggestion[]> = {
  clinic_environment: [
    {
      title: "待合室の清掃チェックリスト導入",
      description: "午前・午後の2回、清掃チェックリストで待合室・トイレ・受付周りの清潔さを確認。チェック担当をローテーションで割り当て",
    },
    {
      title: "院内BGM・アロマの見直し",
      description: "リラックス効果のあるBGMとアロマを導入し、患者が安心できる空間を演出。季節ごとに変更して新鮮さを維持",
    },
    {
      title: "掲示物・インテリアの更新",
      description: "古くなったポスターや掲示物を整理し、季節の装飾や観葉植物を追加。明るく清潔感のある印象を強化",
    },
    {
      title: "院内の動線と導線サインの改善",
      description: "受付→待合→診療室の動線を見直し、分かりやすい案内サインを設置。初めての患者でも迷わず安心して移動できるように",
    },
    {
      title: "トイレ・洗面台の快適化",
      description: "ハンドソープ・ペーパータオル・消臭剤を常備し、清潔感を徹底。鏡・照明も明るく保ち、医院全体の印象を底上げ",
    },
  ],
  reception: [
    {
      title: "受付時の笑顔と挨拶を徹底",
      description: "患者来院時に必ず立ち上がり、笑顔でアイコンタクトを取りながら「こんにちは、お待ちしておりました」と声がけ。名前で呼びかける",
    },
    {
      title: "受付マニュアルの作成と研修",
      description: "来院時・会計時・電話応対の基本フローをマニュアル化。月1回ロールプレイ研修で接遇スキルを向上",
    },
    {
      title: "患者情報の事前確認で待機時間短縮",
      description: "予約患者の前回カルテを受付前に確認し、来院時にスムーズに案内。初診患者には事前にWeb問診を案内",
    },
    {
      title: "受付の第一声を統一する",
      description: "「こんにちは、○○歯科です。○○さん、お待ちしておりました」と来院時の挨拶を統一。朝礼で確認する習慣をつける",
    },
    {
      title: "会計時のお見送り声がけの徹底",
      description: "会計後に「お大事になさってください。次回は○日ですね」と確認の声がけ。患者が大切にされていると感じる対応を標準化",
    },
  ],
  wait_time: [
    {
      title: "予約枠の見直しと時間管理",
      description: "診療時間の実績データを分析し、予約枠の間隔を最適化。処置内容別に所要時間の目安を設定",
    },
    {
      title: "待ち時間の見える化と声がけ",
      description: "待ち時間が10分を超える場合はスタッフから一声おかけする。おおよその待ち時間を伝えて不安を解消",
    },
    {
      title: "待合室の快適性向上",
      description: "Wi-Fi完備、雑誌・タブレットの充実、キッズスペース整備など、待ち時間を快適に過ごせる環境づくり",
    },
    {
      title: "急患対応用バッファ枠の確保",
      description: "1日2〜3枠の急患対応バッファを設定し、予約患者への影響を最小化。待ち時間の長さは満足度低下の最大要因",
    },
    {
      title: "待ち時間の有効活用コンテンツ",
      description: "デジタルサイネージや掲示物で季節の口腔ケア情報を提供。待ち時間が「学びの時間」に変わり体感時間が短縮",
    },
  ],
  hearing: [
    {
      title: "初診ヒアリングシートの改善",
      description: "患者の主訴・不安・希望を漏れなく聞き取れるシートに改善。記入しやすい選択式+自由記述形式に",
    },
    {
      title: "カウンセリング時間の確保",
      description: "初診時に最低10分のカウンセリング時間を設定。患者が話しやすい個室環境で、傾聴姿勢を意識",
    },
    {
      title: "主訴以外の潜在ニーズの確認",
      description: "「他にも気になることはありますか？」と必ず確認。見た目の悩みや過去のトラウマなど言い出しにくいことも聞き出す",
    },
    {
      title: "患者の生活背景に寄り添う問診",
      description: "仕事内容・食習慣・ストレス状況など、歯科に直結する生活背景も把握。患者に合った治療提案の基盤をつくる",
    },
    {
      title: "ヒアリング内容の申し送り徹底",
      description: "初診で聞き取った内容をカルテに詳細記録し、担当が変わっても「また同じ説明をさせられた」を防止する",
    },
  ],
  explanation: [
    {
      title: "視覚資料を活用した説明",
      description: "口腔内写真・レントゲン・模型・タブレットのアニメーションを使い、治療内容を視覚的に分かりやすく説明",
    },
    {
      title: "治療計画書の書面交付",
      description: "治療内容・回数・期間・費用の概要を書面にまとめて患者に渡す。持ち帰って家族と相談できるようにする",
    },
    {
      title: "説明後の理解度確認",
      description: "説明後に「分からない点はありますか？」と必ず確認。専門用語を避け、平易な言葉で繰り返し説明",
    },
    {
      title: "治療の選択肢を複数提示する",
      description: "「この方法しかありません」ではなく、複数の選択肢とそれぞれのメリット・デメリットを説明。患者が自分で選べることが満足度を高める",
    },
    {
      title: "治療前の「今日やること」宣言",
      description: "チェアに座った直後に「今日は○○をしますね、約○分です」と伝える。患者の不安が軽減し説明への満足度が向上",
    },
  ],
  cost_explanation: [
    {
      title: "費用の事前説明と選択肢の提示",
      description: "保険診療と自費診療の違い、各選択肢の費用目安を治療前に明確に説明。比較表を用意して患者が選びやすく",
    },
    {
      title: "費用に関するパンフレット作成",
      description: "よくある治療の費用目安をまとめたパンフレットを作成。待合室に設置し、患者が事前に確認できるようにする",
    },
    {
      title: "会計時の明細説明を丁寧に",
      description: "会計時に今回の処置内容と費用を簡潔に説明。次回の予想費用も併せて伝え、不意の出費感を軽減",
    },
    {
      title: "自費治療の費用をオープンに提示",
      description: "患者から聞かれる前に自費治療の費用を提示。「後から高額請求された」という不信感は事前説明で完全に防げる",
    },
    {
      title: "分割払い・デンタルローンの案内整備",
      description: "高額治療の支払い方法を分かりやすく案内するリーフレットを用意。費用面の不安を軽減し、治療選択の幅を広げる",
    },
  ],
  comfort: [
    {
      title: "質問しやすい雰囲気づくり",
      description: "「何でも聞いてくださいね」と最初に声がけ。治療中も「痛くないですか？」「大丈夫ですか？」とこまめに確認",
    },
    {
      title: "患者の不安に寄り添う声がけ研修",
      description: "患者心理を理解するスタッフ研修を実施。共感的な聞き方・話し方のトレーニングで信頼関係を構築",
    },
    {
      title: "相談専用の時間・チャネルを用意",
      description: "診療後に質問タイムを設ける、または後日電話・LINEで相談できる窓口を案内。聞きそびれを防止",
    },
    {
      title: "目線を合わせて話す習慣づけ",
      description: "チェアに座った患者に立ったまま話すと威圧感を与える。しゃがむか座って目線を合わせ「対等に扱われている」と感じてもらう",
    },
    {
      title: "治療後の「まとめ」を3点で伝える",
      description: "治療後に「今日は○○をしました・次回は○○です・痛みが出たら○○してください」と3点で伝え、不安を解消して帰宅してもらう",
    },
  ],
  pain_care: [
    {
      title: "痛みへの配慮を言語化して伝える",
      description: "麻酔前に「表面麻酔をしますので、チクッとしますが痛みは最小限です」等、事前に何をするか説明し安心感を提供",
    },
    {
      title: "痛みのシグナルルールの導入",
      description: "「痛い時は左手を挙げてください。すぐ止めます」とシグナルを事前に決める。患者がコントロールできる安心感を与える",
    },
    {
      title: "最新の痛み軽減技術の導入",
      description: "表面麻酔の徹底、電動注射器の活用、細い針の使用など、痛みを最小限にする技術・器具を導入",
    },
    {
      title: "治療中のこまめな声かけの標準化",
      description: "30秒に1回程度「順調ですよ」「あと少しです」と短い声かけを実施。治療中の沈黙は患者の不安を増幅させる",
    },
    {
      title: "治療後の痛みケア説明の徹底",
      description: "処置後に「痛みが出た場合の対処法」「服用すべき薬」「連絡すべきタイミング」を明確に説明。帰宅後の不安を解消",
    },
  ],
  staff_courtesy: [
    {
      title: "接遇マナー研修の定期実施",
      description: "外部講師による接遇研修を年2回実施。敬語・立ち居振る舞い・声のトーンなど基本マナーを全スタッフで統一",
    },
    {
      title: "スタッフ間の声がけ・チームワーク強化",
      description: "朝礼で本日の患者情報を共有し、チーム全体で丁寧な対応を意識。スタッフ同士の感謝を伝え合う文化づくり",
    },
    {
      title: "患者名での呼びかけを徹底",
      description: "「○○さん、お待たせしました」と名前で呼びかけ。一人ひとりを大切にしている姿勢を示す",
    },
    {
      title: "担当衛生士制の導入",
      description: "毎回同じ衛生士が担当することで「自分のことを覚えてくれている」安心感を提供。継続来院率の向上にもつながる",
    },
    {
      title: "患者の前でスタッフを紹介・称賛する",
      description: "「○○さん（衛生士）はクリーニングがとても丁寧ですよ」と患者の前でスタッフを紹介。チームの信頼感が安心感を生む",
    },
  ],
  loyalty: [
    {
      title: "患者の期待を超える「+α」の体験設計",
      description: "治療だけでなく「来てよかった」と感じる体験を意識。丁寧な説明・気遣いの声かけ・院内の心地よさなど総合的な満足度を高める",
    },
    {
      title: "治療のビフォーアフターを共有する",
      description: "口腔内写真で治療前後の変化を見せ、改善を実感してもらう。「この医院に通ってよかった」という満足感が紹介意向に直結",
    },
    {
      title: "家族ぐるみで通える医院づくり",
      description: "キッズスペースの整備、家族割引、家族の定期検診案内など、家族で通いたくなる仕組みを構築。自然な紹介につながる",
    },
    {
      title: "患者とのリレーション強化",
      description: "前回の会話内容をカルテにメモし、次回来院時に話題にする。「お子さんの運動会はいかがでしたか？」等の個別ケアが特別感を生む",
    },
    {
      title: "通院の成果を定期的にフィードバック",
      description: "定期検診時に「前回より歯茎の状態が良くなっています」等、改善点を積極的にフィードバック。通院のモチベーションと信頼感を向上",
    },
  ],
}

// AI Advisory settings
export const ADVISORY = {
  DEFAULT_THRESHOLD: 30,           // 新規回答数でアンロック
  MIN_RESPONSES_FOR_FIRST: 30,     // 初回分析に必要な最低回答数
  HIGH_SCORE_THRESHOLD: 4.0,       // 高評価と判定する閾値
  LOW_SCORE_THRESHOLD: 3.8,        // 低評価と判定する閾値
  MIN_SAMPLES_FOR_INSIGHT: 5,      // インサイト生成に必要な最低サンプル数
  SIGNIFICANT_GAP: 0.3,            // 有意な差と見なすスコア差
  POLARIZATION_LOW_PCT: 15,        // 二極化判定: 低スコア(1-2)のパーセンテージ
  POLARIZATION_HIGH_PCT: 40,       // 二極化判定: 高スコア(4-5)のパーセンテージ
  CONSISTENCY_STDDEV: 0.6,         // 安定性判定: 標準偏差の閾値
} as const

// ─── 歯科コンサル知見: 設問カテゴリ別の分析ルール ───

export const CATEGORY_LABELS: Record<string, string> = {
  clinic_environment: "院内環境",
  reception: "受付対応",
  wait_time: "待ち時間",
  hearing: "ヒアリング",
  explanation: "治療説明",
  cost_explanation: "費用説明",
  comfort: "安心感・質問しやすさ",
  loyalty: "紹介意向",
  pain_care: "痛みへの配慮",
  staff_courtesy: "スタッフ対応",
}

/** 初診/再診で同じカテゴリを比較するための対応マップ */
export const CROSS_TEMPLATE_CATEGORIES: Array<{
  category: string
  label: string
  firstVisitId: string
  revisitId: string
}> = [
  { category: "wait_time", label: "待ち時間", firstVisitId: "fv3", revisitId: "tr4" },
  { category: "explanation", label: "治療説明", firstVisitId: "fv5", revisitId: "tr1" },
  { category: "comfort", label: "安心感", firstVisitId: "fv7", revisitId: "tr3" },
  { category: "loyalty", label: "紹介意向", firstVisitId: "fv8", revisitId: "tr6" },
]

/** 設問間相関パターン — 歯科コンサルタントの知見に基づく診断ルール */
export interface DentalInsightRule {
  id: string
  high: string[]   // これらのカテゴリのスコアが高い (>= HIGH_SCORE_THRESHOLD)
  low: string[]    // これらのカテゴリのスコアが低い (< LOW_SCORE_THRESHOLD)
  insight: string
  recommendation: string
}

export const DENTAL_INSIGHT_RULES: DentalInsightRule[] = [
  {
    id: "one_way_explanation",
    high: ["explanation"],
    low: ["comfort"],
    insight: "治療説明のスコアは高いものの、安心感・質問しやすさが低い傾向があります。説明が「一方的」になっている可能性があります。患者は説明を「聞いている」が「理解・納得している」とは限りません。",
    recommendation: "説明後に「何か気になる点はありますか？」と必ず確認する習慣を導入しましょう。3秒の沈黙を意識的に作ることで、患者が質問しやすくなります。",
  },
  {
    id: "waiting_stress",
    high: ["reception"],
    low: ["wait_time"],
    insight: "受付対応への評価は良好ですが、待ち時間のスコアが低い状態です。受付後の「待たされている感」が課題です。待ち時間の問題は「実際の長さ」ではなく「不透明さ」が本質であることが多いです。",
    recommendation: "待ち時間が10分以上になる場合、スタッフから「あと約○分です」と声かけする運用を導入しましょう。待ち時間の「見える化」だけで体感待ち時間は大幅に改善します。また、待合室にデジタルサイネージや口腔ケア情報を設置し「待ち時間の有効化」も検討してください。",
  },
  {
    id: "communication_gap",
    high: [],
    low: ["hearing", "explanation"],
    insight: "初診時のヒアリングと治療説明の両方でスコアが低めです。「聞いてもらえていない」→「説明も分かりにくい」という悪循環が疑われます。ヒアリング不足は全ての患者体験の土台を崩します。",
    recommendation: "初診カウンセリングに最低10分確保し、患者の主訴だけでなく不安・希望も聞き取る体制を整えましょう。ヒアリングシートを「選択式+自由記述」に改善し、患者が話しやすい個室環境を用意することも効果的です。",
  },
  {
    id: "anxiety_loop",
    high: [],
    low: ["pain_care", "comfort"],
    insight: "痛みへの配慮と安心感の両方が低い状態です。患者が「自分でコントロールできない」という不安を感じている可能性が高く、これは歯科恐怖症の増悪要因にもなります。",
    recommendation: "治療前に「痛い時は左手を挙げてください、すぐ止めます」とシグナルルールを必ず伝えましょう。患者が「いつでも止められる」と感じるだけで痛みの体感と不安が大幅に軽減します。表面麻酔の徹底と、治療中30秒ごとの声かけ「順調ですよ」「あと少しです」も標準化してください。",
  },
  {
    id: "financial_distrust",
    high: [],
    low: ["cost_explanation", "loyalty"],
    insight: "費用説明と紹介意向の両方が低い状態です。「費用が不透明」という不信感がクリニック全体への信頼低下につながっている可能性があります。費用の不透明さは、診療の質とは無関係に満足度を大きく下げる要因です。",
    recommendation: "治療開始前に費用の概算を書面で提示し、保険/自費の選択肢を比較表で明示しましょう。会計時にも「今回の○○は○円です」と一言添えることで不信感を解消できます。",
  },
  {
    id: "satisfaction_without_differentiation",
    high: ["reception", "explanation", "comfort"],
    low: ["loyalty"],
    insight: "各項目の満足度は高いものの「人に紹介したい」スコアが低い状態です。患者は満足しているが「特別な体験」ではないと感じています。「不満がない」と「紹介したい」の間には大きな壁があります。",
    recommendation: "口腔内写真で治療のビフォーアフターを共有する、前回の会話内容をカルテにメモし次回に話題にする等「この医院ならでは」の個別体験を設計しましょう。定期検診時に「前回より歯茎の状態が良くなっています」と改善をフィードバックすることも効果的です。",
  },
  {
    id: "facility_service_gap",
    high: ["staff_courtesy", "explanation"],
    low: ["clinic_environment"],
    insight: "スタッフ対応・治療説明は高評価ですが、院内環境のスコアが低い状態です。「人」のサービスは良いのに「場」が足を引っ張っています。院内環境は来院時の第一印象を決め、全体の期待値を左右します。",
    recommendation: "午前・午後の清掃チェックリストを導入し、待合室・トイレの清潔感を確保しましょう。季節の装飾や観葉植物の追加、掲示物の整理など「明るく清潔」な印象づくりが効果的です。",
  },
]

export const DAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"] as const

/** 時間帯の分類 */
export function getTimeSlotLabel(hour: number): string {
  if (hour < 12) return "午前"
  if (hour < 17) return "午後"
  return "夕方"
}

// AI分析回数バッジ
export const ADVISORY_MILESTONES = [
  { count: 1, label: "初回分析", emoji: "🔮" },
  { count: 3, label: "3回目", emoji: "📊" },
  { count: 5, label: "5回目", emoji: "🧪" },
  { count: 10, label: "10回目", emoji: "🎓" },
] as const

export const OPERATOR_CLINIC_COOKIE = "mieru-operator-clinic"
export const OPERATOR_MODE_MAX_AGE = 60 * 60 * 8 // 8 hours

export const DENTAL_TIPS = [
  // 基本のブラッシング（1-10）
  "フッ素入り歯磨き粉は、吐き出した後すすぎすぎないのがコツです",
  "歯ブラシは1〜2ヶ月に1回の交換がおすすめです",
  "デンタルフロスや歯間ブラシで、歯ブラシだけでは届かない汚れを落とせます",
  "就寝前の歯磨きが1日で最も大切です",
  "電動歯ブラシは小さく振動させるだけで十分です。ゴシゴシこすらないのがポイント",
  "歯ブラシは鉛筆を持つように軽く握ると、力の入れすぎを防げます",
  "歯と歯茎の境目に毛先を45度に当てて磨くと、歯周ポケットの汚れを効果的に除去できます",
  "歯磨き粉の量は大人で1〜2cm程度が適量です。つけすぎると泡立ちで磨き残しに気づきにくくなります",
  "舌の表面にも細菌が付着します。舌ブラシで奥から手前に軽くなでるケアがおすすめです",
  "歯磨きの順番を毎回決めておくと、磨き残しを防ぎやすくなります",
  // 虫歯予防（11-20）
  "よく噛んで食べると唾液が増え、虫歯予防につながります",
  "食後すぐの歯磨きが虫歯予防に効果的です",
  "キシリトールガムは虫歯菌の活動を抑える効果があります",
  "虫歯菌は砂糖を栄養にして酸を出します。だらだら食べを避けることが大切です",
  "唾液には歯の再石灰化を促す成分が含まれています。よく噛むことで唾液分泌が増えます",
  "初期の虫歯（白濁）はフッ素やケアで再石灰化し、削らずに済む場合があります",
  "哺乳瓶でジュースを飲ませ続けると、乳歯の虫歯リスクが高まります",
  "虫歯は感染症の一種です。乳幼児への口移しは虫歯菌の感染原因になります",
  "間食の回数が多いほど、口内が酸性になる時間が長くなり虫歯リスクが上がります",
  "チーズやナッツは口内のpHを中和しやすく、虫歯予防に役立つ食品です",
  // 歯周病（21-30）
  "歯茎からの出血は歯周病のサインかもしれません。早めにご相談ください",
  "歯周病は痛みなく進行し、日本人の成人の約8割が罹患しているとされています",
  "歯周病菌は歯と歯茎の間の歯周ポケットで繁殖します。丁寧な歯磨きが予防の基本です",
  "喫煙は歯周病の最大のリスク因子です。禁煙は歯茎の健康回復に効果的です",
  "歯周病は糖尿病・心臓病・早産などの全身疾患との関連が報告されています",
  "歯石は歯ブラシでは除去できません。定期的な歯科でのクリーニングが必要です",
  "歯茎が下がって歯が長く見えるようになったら、歯周病が進行しているサインです",
  "ストレスや睡眠不足は免疫力を低下させ、歯周病を悪化させる要因になります",
  "歯間ブラシのサイズは歯と歯の隙間に合ったものを選ぶことが大切です",
  "歯周病の治療後も、3〜4ヶ月ごとのメンテナンスで再発を予防できます",
  // 食事・栄養と歯（31-40）
  "酸性の飲み物（炭酸・柑橘ジュース等）の後は30分待ってから歯磨きを",
  "カルシウムだけでなくビタミンDも歯の健康に重要です。日光浴や魚の摂取が効果的です",
  "緑茶に含まれるカテキンには抗菌作用があり、虫歯菌の増殖を抑える効果があります",
  "スポーツドリンクは糖分と酸性度が高いため、飲みすぎると歯のエナメル質が溶ける原因になります",
  "繊維質の多い野菜（セロリ・ニンジンなど）は噛むことで歯の表面を自然に清掃します",
  "乳製品に含まれるカゼインというタンパク質は、エナメル質の保護に役立ちます",
  "ビタミンCは歯茎のコラーゲン合成に必要です。不足すると歯茎の出血や腫れの原因に",
  "お茶やコーヒーの着色汚れ（ステイン）は、定期的なクリーニングで除去できます",
  "炭酸水（無糖）は一般的な炭酸飲料より歯への影響が少ないですが、頻繁な摂取は注意が必要です",
  "固いものを食べることで顎の発達を促し、歯並びの改善にもつながります",
  // 定期検診・予防（41-48）
  "定期検診で早期発見・早期治療ができ、治療費の節約にもなります",
  "歯科健診は3〜6ヶ月に1回が目安です。自覚症状がなくても受診しましょう",
  "プロフェッショナルクリーニング（PMTC）で、セルフケアでは落とせない汚れを除去できます",
  "レントゲン検査で、目に見えない歯と歯の間の虫歯や骨の状態を確認できます",
  "フッ素塗布は子どもだけでなく大人にも虫歯予防効果があります",
  "シーラント（奥歯の溝を埋める処置）は、お子さまの虫歯予防に効果的です",
  "妊娠中はホルモンの変化で歯周病になりやすくなります。妊娠中の歯科健診が大切です",
  "歯科治療を中断すると症状が悪化し、治療期間と費用が増えることがあります",
  // 生活習慣（49-55）
  "歯ぎしりが気になる方は、ナイトガードの相談がおすすめです",
  "口呼吸は口内を乾燥させ、虫歯や歯周病のリスクを高めます。鼻呼吸を意識しましょう",
  "十分な水分補給は唾液の分泌を促し、口内環境を整えるのに役立ちます",
  "よく噛んで食べると脳への血流が増え、認知機能の維持にも効果があるとされています",
  "歯を食いしばる癖は顎関節症の原因になります。日中は上下の歯を離すことを意識しましょう",
  "アルコールを含むマウスウォッシュは口内を乾燥させることがあります。ノンアルコールタイプも検討を",
  "入れ歯やマウスピースは毎日洗浄し、清潔に保ちましょう。専用の洗浄剤の使用がおすすめです",
  // お子さまの歯（56-60）
  "乳歯は永久歯の成長に影響します。乳歯の虫歯も放置せず治療しましょう",
  "6歳頃に生える第一大臼歯（6歳臼歯）は一生使う大切な歯です。丁寧にケアしましょう",
  "お子さまの仕上げ磨きは小学校低学年頃まで続けると安心です",
  "指しゃぶりや舌で歯を押す癖は、歯並びに影響することがあります。早めに相談しましょう",
  "お子さまの歯磨き粉は年齢に合ったフッ素濃度のものを選びましょう",
] as const
