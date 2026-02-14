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

export const MILESTONES = [50, 100, 250, 500, 1000, 2000, 5000, 10000] as const

// Patient attribute options for staff setup screen
export const VISIT_TYPES = [
  { value: "first_visit", label: "初診" },
  { value: "revisit", label: "再診" },
] as const

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
  { value: "under_20", label: "〜20代" },
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
export const TEMPLATE_SELECTION_MAP: Record<string, { visitType: string; treatmentType: string }> = {
  "初診": { visitType: "first_visit", treatmentType: "treatment" },
  "治療中": { visitType: "revisit", treatmentType: "treatment" },
  "定期検診": { visitType: "revisit", treatmentType: "checkup" },
}

export const ADMIN_MODE_COOKIE = "mieru-admin"
export const ADMIN_MODE_MAX_AGE = 60 * 60 * 8 // 8 hours
export const DEFAULT_ADMIN_PASSWORD = "1111"
export const ADMIN_MODE_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000 // 15 minutes
export const ADMIN_MODE_RATE_LIMIT_MAX = 5 // max attempts per window

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
