export const APP_NAME = "MIERU Clinic"
export const APP_DESCRIPTION = "患者体験の見える化"

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
  DAILY_SURVEY_GOAL: 15,
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
  ],
  booking: [
    {
      title: "Web予約システムの利便性向上",
      description: "24時間対応のWeb予約を導入・改善。空き状況がリアルタイムで見え、変更・キャンセルも簡単にできるように",
    },
    {
      title: "予約リマインドの送信",
      description: "予約前日にSMS・LINEでリマインドを送信し、無断キャンセルを減少。空いた枠を他の患者に活用",
    },
    {
      title: "次回予約の院内案内を徹底",
      description: "会計時に次回の予約候補を2〜3提示し、その場で確定。帰宅後に電話で予約する手間を省く",
    },
  ],
  loyalty: [
    {
      title: "継続通院の重要性をやさしく説明",
      description: "定期的な通院のメリットを数字で示す（早期発見で治療費1/3等）。患者の歯の状態に合わせた通院間隔を個別に提案",
    },
    {
      title: "通院モチベーションの維持",
      description: "治療の進捗を毎回共有し、ゴールまでの道のりを見える化。改善した点を積極的にフィードバック",
    },
    {
      title: "患者とのリレーション強化",
      description: "前回の会話内容をカルテにメモし、次回来院時に話題にする。「お子さんの運動会はいかがでしたか？」等",
    },
  ],
}

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
