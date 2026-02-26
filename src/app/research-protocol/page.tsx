import { APP_NAME } from "@/lib/constants"
import { TocSidebar, type TocItem } from "@/components/research/toc-sidebar"
import {
  FileText,
  FlaskConical,
  Users,
  BarChart3,
  Shuffle,
  Tablet,
  Target,
  Calendar,
  LineChart,
  ShieldCheck,
  ClipboardList,
  CheckSquare,
  Building2,
  BookOpen,
  GraduationCap,
  AlertTriangle,
  Clock,
  Wallet,
  Paperclip,
} from "lucide-react"

/* ------------------------------------------------------------------ */
/* TOC items                                                          */
/* ------------------------------------------------------------------ */

const tocItems: TocItem[] = [
  { id: "ch1", number: "1", title: "研究題目" },
  { id: "ch2", number: "2", title: "背景と目的" },
  { id: "ch3", number: "3", title: "研究デザイン" },
  { id: "ch4", number: "4", title: "対象" },
  { id: "ch5", number: "5", title: "サンプルサイズ" },
  { id: "ch6", number: "6", title: "ランダム化" },
  { id: "ch7", number: "7", title: "介入内容" },
  { id: "ch8", number: "8", title: "評価項目" },
  { id: "ch9", number: "9", title: "データ収集" },
  { id: "ch10", number: "10", title: "統計解析計画" },
  { id: "ch11", number: "11", title: "倫理的配慮" },
  { id: "ch12", number: "12", title: "臨床試験登録" },
  { id: "ch13", number: "13", title: "品質管理" },
  { id: "ch14", number: "14", title: "研究体制" },
  { id: "ch15", number: "15", title: "論文作成計画" },
  { id: "ch16", number: "16", title: "学会発表計画" },
  { id: "ch17", number: "17", title: "研究の限界" },
  { id: "ch18", number: "18", title: "タイムライン" },
  { id: "ch19", number: "19", title: "予算概算" },
  { id: "ch20", number: "20", title: "付録" },
]

/* ------------------------------------------------------------------ */
/* Page Component                                                     */
/* ------------------------------------------------------------------ */

export default function ResearchProtocolPage() {
  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      {/* ===== Header ===== */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="container flex h-14 items-center justify-between">
          <span className="text-lg font-bold text-gradient">{APP_NAME}</span>
          <div className="flex items-center gap-3">
            <span className="rounded-full border border-amber-300/60 bg-amber-50 px-3 py-1 text-[11px] font-medium text-amber-700">
              ドラフト v0.1
            </span>
            <span className="hidden sm:inline-block rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-[11px] font-medium text-primary">
              研究計画書
            </span>
          </div>
        </div>
      </header>

      {/* ===== Hero ===== */}
      <section className="hero-gradient py-14 lg:py-20">
        <div className="container max-w-4xl text-center">
          <div className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-medium text-primary">
            <FlaskConical className="h-3.5 w-3.5" />
            Research Protocol Draft
          </div>
          <h1 className="text-2xl font-bold leading-tight tracking-tight sm:text-3xl lg:text-4xl">
            デジタル患者体験フィードバックシステムが
            <br className="hidden sm:block" />
            歯科医院の患者満足度に与える影響
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            待機リスト対照ランダム化比較試験
          </p>
          <p className="mx-auto mt-2 max-w-3xl text-xs leading-relaxed text-muted-foreground/80 italic">
            Effect of a Digital Patient Experience Feedback System on Patient Satisfaction
            in Dental Clinics: A Wait-list Controlled Randomized Trial
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
            <span>株式会社ファンクション・ティ</span>
            <span className="hidden sm:inline">|</span>
            <span>2026年2月作成</span>
            <span className="hidden sm:inline">|</span>
            <span>UMIN-CTR 事前登録予定</span>
          </div>
        </div>
      </section>

      {/* ===== Main content with TOC ===== */}
      <div className="container py-10 lg:py-14">
        <div className="lg:grid lg:grid-cols-[220px_1fr] lg:gap-10 xl:grid-cols-[240px_1fr] xl:gap-14">
          {/* TOC Sidebar */}
          <TocSidebar items={tocItems} />

          {/* Content */}
          <main className="min-w-0 max-w-3xl space-y-16 lg:space-y-20">
            {/* ===== Chapter 1: 研究題目 ===== */}
            <Chapter id="ch1" number="01" title="研究題目" icon={FileText}>
              <SubSection title="和文">
                <p className="text-sm leading-relaxed text-foreground/90">
                  デジタル患者体験フィードバックシステムが歯科医院の患者満足度に与える影響：待機リスト対照ランダム化比較試験
                </p>
              </SubSection>
              <SubSection title="英文">
                <p className="text-sm leading-relaxed text-foreground/90 italic">
                  Effect of a Digital Patient Experience Feedback System on Patient Satisfaction
                  in Dental Clinics: A Wait-list Controlled Randomized Trial
                </p>
              </SubSection>
            </Chapter>

            {/* ===== Chapter 2: 背景と目的 ===== */}
            <Chapter id="ch2" number="02" title="研究の背景と目的" icon={FlaskConical}>
              <SubSection title="2-1. 背景">
                <div className="space-y-3 text-sm leading-relaxed text-foreground/90">
                  <p>
                    歯科医院における患者体験（Patient Experience）の継続的な把握と改善は、患者の定着率向上および医療の質の改善に寄与すると考えられる。しかし、従来の紙ベースのアンケートは回収率が低く（一般的に10-20%）、結果のフィードバックにタイムラグが生じるため、現場での迅速な改善活動に繋がりにくいという課題がある。
                  </p>
                  <p>
                    また、収集したデータが院長やスタッフの日常業務に統合されていないため、アンケート結果が「取って終わり」となり、PDCAサイクルが回らないケースが多い。
                  </p>
                  <p>
                    近年、デジタルツールを活用した患者フィードバックシステムが注目されているが、歯科領域における以下の点についてのエビデンスは不足している：
                  </p>
                  <ol className="ml-5 list-decimal space-y-1 text-muted-foreground">
                    <li>デジタルアンケートによる回答率の改善効果</li>
                    <li>ゲーミフィケーションを活用したスタッフの行動変容効果</li>
                    <li>リアルタイムフィードバックが患者満足度に与える影響</li>
                    <li>上記が経営指標（来院数・自費率等）に及ぼす波及効果</li>
                  </ol>
                </div>
              </SubSection>
              <SubSection title="2-2. 目的">
                <div className="space-y-4 text-sm leading-relaxed text-foreground/90">
                  <div className="rounded-xl border border-primary/20 bg-primary/[0.03] p-4">
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-primary">主目的</p>
                    <p>
                      デジタル患者体験フィードバックシステム「MIERU PX」の6ヶ月間の使用が、歯科医院における患者満足度スコアの改善に寄与するか否かを、待機リスト対照ランダム化比較試験（RCT）により検証する。
                    </p>
                  </div>
                  <div>
                    <p className="mb-2 font-medium">副次目的:</p>
                    <ol className="ml-5 list-decimal space-y-1 text-muted-foreground">
                      <li>アンケート回答率に対する効果を評価する</li>
                      <li>質問カテゴリ別の改善パターンを明らかにする</li>
                      <li>スタッフのアンケート配布行動（日次目標達成率・ストリーク等）と満足度変化の関連を分析する</li>
                      <li>患者満足度の変化と経営指標（来院数・自費率・売上）の相関を探索的に分析する</li>
                    </ol>
                  </div>
                </div>
              </SubSection>
            </Chapter>

            {/* ===== Chapter 3: 研究デザイン ===== */}
            <Chapter id="ch3" number="03" title="研究デザイン" icon={FlaskConical}>
              <SubSection title="3-1. 研究種別">
                <ul className="ml-5 list-disc space-y-1 text-sm text-foreground/90">
                  <li>前向き、多施設、非盲検、待機リスト対照、ランダム化比較試験</li>
                  <li>CONSORT 2010声明に準拠して報告する</li>
                </ul>
              </SubSection>
              <SubSection title="3-2. デザインの選択理由">
                <Table
                  headers={["選択", "理由"]}
                  rows={[
                    ["待機リスト対照", "対照群にも介入期間後にMIERUを提供するため倫理的に妥当。参加モチベーションも維持される"],
                    ["クラスターRCT", "個人レベルのランダム化は医院単位の介入では不可能。医院をランダム化の単位とする"],
                    ["非盲検", "介入の性質上、医院側のマスキングは不可能。分析担当者の盲検化で対応"],
                  ]}
                />
              </SubSection>
              <SubSection title="3-3. 研究期間">
                <ul className="ml-5 list-disc space-y-1 text-sm text-foreground/90">
                  <li><strong>準備期間:</strong> 2ヶ月（倫理審査・募集・登録）</li>
                  <li><strong>ベースライン測定:</strong> 1ヶ月</li>
                  <li><strong>介入期間:</strong> 6ヶ月</li>
                  <li><strong>フォローアップ:</strong> 介入終了直後に最終測定</li>
                  <li><strong>総期間:</strong> 約9ヶ月（準備期間除く）</li>
                </ul>
              </SubSection>
            </Chapter>

            {/* ===== Chapter 4: 対象 ===== */}
            <Chapter id="ch4" number="04" title="対象" icon={Users}>
              <SubSection title="4-1. 適格基準（Inclusion Criteria）">
                <ol className="ml-5 list-decimal space-y-1 text-sm text-foreground/90">
                  <li>日本国内の歯科医院であること</li>
                  <li>常勤歯科医師1名以上、スタッフ2名以上が勤務していること</li>
                  <li>月間来院患者数が100名以上であること（統計的に十分な回答数を確保するため）</li>
                  <li>インターネット接続環境およびタブレット端末（iPad等）を利用可能であること</li>
                  <li>院長が研究参加に同意し、書面による同意を得ていること</li>
                </ol>
              </SubSection>
              <SubSection title="4-2. 除外基準（Exclusion Criteria）">
                <ol className="ml-5 list-decimal space-y-1 text-sm text-foreground/90">
                  <li>既に他の患者満足度デジタルツールを使用している医院</li>
                  <li>研究期間中に閉院・移転・大規模改装を予定している医院</li>
                  <li>過去6ヶ月以内にスタッフの50%以上が入れ替わった医院</li>
                </ol>
              </SubSection>
              <SubSection title="4-3. 募集方法">
                <div className="space-y-4">
                  <p className="text-sm text-foreground/90">
                    外的妥当性の向上と層別サンプリングの精度確保のため、以下の3チャネルを通じて募集する：
                  </p>
                  <Table
                    headers={["チャネル", "母数", "期待応募率", "期待応募数", "特性"]}
                    rows={[
                      ["オンラインサロン", "約500名", "10-15%", "50-75院", "改善意欲が高い。脱落率が低い"],
                      ["LINEグループ", "約2,000名", "3-5%", "60-100院", "より広い層。中程度のエンゲージメント"],
                      ["SNSフォロワー", "約5,000名", "1-2%", "50-100院", "最も多様。一般的な代表性"],
                      ["合計", "約7,500名", "—", "160-275院", "→ 30院を厳選"],
                    ]}
                    highlightLast
                  />
                  <InfoBox title="募集手順">
                    <ol className="ml-5 list-decimal space-y-1 text-sm text-muted-foreground">
                      <li>3チャネルで同時に募集告知を配信</li>
                      <li>全チャネル共通の応募フォーム（適格基準スクリーニング＋属性情報＋流入チャネル記録）</li>
                      <li>属性情報に基づく層別サンプリング → 30院を選定</li>
                      <li>チャネル混合比率の目標: サロン会員50-60%（15-18院）、LINE/SNS経由40-50%（12-15院）</li>
                    </ol>
                  </InfoBox>
                  <InfoBox title="チャネル混合の根拠">
                    <ul className="ml-5 list-disc space-y-1 text-sm text-muted-foreground">
                      <li>サロン会員のみでは「改善意欲の高い院長」に選択バイアスが生じ外的妥当性が低下する</li>
                      <li>LINE/SNS経由の参加者を含めることで多様なサンプルを確保</li>
                      <li>流入チャネルを記録し、事後的にチャネル別の効果修飾を分析可能にする</li>
                    </ul>
                  </InfoBox>
                  <p className="text-xs text-muted-foreground">
                    ※ 選定されなかった応募院（推定130-245院）に対し、有料版リリース時の優先案内を行う
                  </p>
                </div>
              </SubSection>
            </Chapter>

            {/* ===== Chapter 5: サンプルサイズ ===== */}
            <Chapter id="ch5" number="05" title="サンプルサイズの設定" icon={BarChart3}>
              <SubSection title="5-1. 検出力分析の前提">
                <Table
                  headers={["パラメータ", "設定値", "根拠"]}
                  rows={[
                    ["効果量（Cohen's d）", "0.5（中程度）", "先行研究の効果量を参考"],
                    ["有意水準 α", "0.05（両側）", "標準的基準"],
                    ["検出力 1-β", "0.80", "標準的基準"],
                    ["クラスター内相関係数（ICC）", "0.05", "患者満足度の医院間変動"],
                    ["1クラスターあたり平均回答数", "300件（50件/月 × 6ヶ月）", "保守的推定"],
                  ]}
                />
              </SubSection>
              <SubSection title="5-2. 必要サンプルサイズ">
                <div className="rounded-xl border border-primary/20 bg-primary/[0.03] p-5">
                  <div className="grid gap-4 text-center sm:grid-cols-3">
                    <div>
                      <p className="text-2xl font-bold text-primary">12〜15院</p>
                      <p className="text-xs text-muted-foreground">必要クラスター数/群</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold">20%</p>
                      <p className="text-xs text-muted-foreground">脱落率の見込み</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gradient">30院</p>
                      <p className="text-xs text-muted-foreground">最終必要数（15院 × 2群）</p>
                    </div>
                  </div>
                </div>
              </SubSection>
              <SubSection title="5-3. 検出力分析の実施方法">
                <p className="text-sm text-foreground/90">
                  R（pwr パッケージ、clusterPower パッケージ）またはG*Powerを使用。共著の統計専門家が算出を検証。
                </p>
              </SubSection>
            </Chapter>

            {/* ===== Chapter 6: ランダム化 ===== */}
            <Chapter id="ch6" number="06" title="ランダム化" icon={Shuffle}>
              <SubSection title="6-1. 層別要因（Stratification Factors）">
                <p className="mb-3 text-sm text-foreground/90">
                  30院を以下の6軸で層別し、各層から均等にサンプリングする：
                </p>
                <Table
                  headers={["軸", "分類", "目的"]}
                  rows={[
                    ["立地", "都市部 / 郊外・地方", "患者属性の違いを統制"],
                    ["医院規模", "ユニット3台以下 / 4台以上", "組織の複雑さの違いを統制"],
                    ["開業年数", "5年未満 / 5-15年 / 16年以上", "経営成熟度の違いを統制"],
                    ["自費率", "20%未満 / 20%以上", "経営方針・患者層の違いを統制"],
                    ["満足度自己評価", "高い / 普通 / 低い", "ベースライン差の統制"],
                    ["地域", "東日本 / 西日本", "地域文化差の統制"],
                  ]}
                />
              </SubSection>
              <SubSection title="6-2. 割付方法">
                <ul className="ml-5 list-disc space-y-1 text-sm text-foreground/90">
                  <li>コンピュータ生成の乱数表を用いた<strong>置換ブロックランダム化</strong>（ブロックサイズ4）</li>
                  <li>層別要因を考慮した層別ランダム化</li>
                  <li>割付は利益相反のない共著者（統計専門家）が独立して実施</li>
                  <li>割付結果は封筒法または電子的方法で秘匿</li>
                </ul>
              </SubSection>
            </Chapter>

            {/* ===== Chapter 7: 介入内容 ===== */}
            <Chapter id="ch7" number="07" title="介入内容" icon={Tablet}>
              <SubSection title="7-1. 介入群（MIERU PX導入群、15院）">
                <div className="space-y-4">
                  <p className="text-sm font-medium text-foreground">システム機能:</p>
                  <Table
                    headers={["機能カテゴリ", "具体的機能"]}
                    rows={[
                      ["患者アンケート収集", "医院端末モード（iPad）による5段階評価＋自由記述"],
                      ["スタッフダッシュボード", "日次目標、ストリーク、ランクシステム（8段階）、ハピネスメーター、Confetti、エンカレッジメント"],
                      ["管理者ダッシュボード", "満足度スコア推移、InsightCards（自動改善提案）、質問別分析、ヒートマップ"],
                      ["改善アクション管理", "改善施策の登録・進捗管理・効果測定（ベースライン/結果スコア記録）"],
                      ["月次レポート", "来院数・売上・自費率等の経営指標入力と自動KPI算出"],
                    ]}
                  />
                  <p className="text-sm font-medium text-foreground">導入支援:</p>
                  <ul className="ml-5 list-disc space-y-1 text-sm text-foreground/90">
                    <li>導入時オリエンテーション（オンライン60分 × 1回）</li>
                    <li>マニュアル提供</li>
                    <li>月1回の進捗確認コール（15分）</li>
                    <li>チャットサポート（随時）</li>
                  </ul>
                </div>
              </SubSection>
              <SubSection title="7-2. 対照群（待機リスト群、15院）">
                <ul className="ml-5 list-disc space-y-1 text-sm text-foreground/90">
                  <li>研究期間中は通常の診療体制を維持</li>
                  <li>MIERUは未導入（6ヶ月の介入期間終了後に導入を保証）</li>
                  <li><strong>月1回の紙アンケート</strong>（介入群と同一の質問項目）を実施し、患者満足度データを収集</li>
                  <li>月次経営指標（来院数・売上・自費率）の報告を依頼</li>
                </ul>
              </SubSection>
              <SubSection title="7-3. 介入の標準化">
                <ul className="ml-5 list-disc space-y-1 text-sm text-foreground/90">
                  <li>全介入群医院に同一バージョンのMIERUを提供</li>
                  <li>アンケート質問は研究用に統一テンプレートを使用（テンプレート変更不可）</li>
                  <li>導入オリエンテーションは標準化されたスライドを使用</li>
                </ul>
              </SubSection>
            </Chapter>

            {/* ===== Chapter 8: 評価項目 ===== */}
            <Chapter id="ch8" number="08" title="評価項目（アウトカム）" icon={Target}>
              <SubSection title="8-1. 主要評価項目（Primary Outcome）">
                <div className="rounded-xl border border-primary/20 bg-primary/[0.03] p-4">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-primary">
                    Primary Outcome
                  </p>
                  <p className="text-sm font-medium text-foreground">患者満足度スコアの変化量</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    ベースライン期間（月0）から介入終了時（月6）までの医院平均満足度スコア（5段階）の変化量の群間差
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    測定: 介入群 — MIERU自動集計、対照群 — 紙アンケート集計
                  </p>
                </div>
              </SubSection>
              <SubSection title="8-2. 副次評価項目（Secondary Outcomes）">
                <Table
                  headers={["指標", "定義"]}
                  rows={[
                    ["アンケート回答率", "（回答数 / 推定来院患者数）× 100 の月次推移"],
                    ["質問別スコア変化", "各質問カテゴリのスコア変化量"],
                    ["スタッフ行動指標", "日次目標達成率、ストリーク日数、ダッシュボード閲覧頻度（介入群のみ）"],
                    ["経営指標変化", "月間来院数、自費率、売上高の変化量（探索的分析）"],
                    ["改善アクション実施数", "研究期間中の改善アクション数（介入群のみ）"],
                  ]}
                />
              </SubSection>
              <SubSection title="8-3. プロセス指標">
                <Table
                  headers={["指標", "目的"]}
                  rows={[
                    ["システムログイン頻度", "MIERUの利用定着度を評価"],
                    ["月次レポート入力率", "経営指標の自己モニタリング行動を評価"],
                    ["InsightCards閲覧率", "データに基づく意思決定行動を評価"],
                  ]}
                />
              </SubSection>
            </Chapter>

            {/* ===== Chapter 9: データ収集スケジュール ===== */}
            <Chapter id="ch9" number="09" title="データ収集スケジュール" icon={Calendar}>
              <SubSection title="9-1. タイムラインと測定ポイント">
                <div className="overflow-x-auto rounded-xl border bg-muted/30 p-4 sm:p-5">
                  <pre className="text-xs leading-relaxed text-foreground/80 sm:text-sm">{`          ベースライン   月1    月2    月3    月4    月5    月6（最終）
           ┃         ┃     ┃     ┃     ┃     ┃     ┃
介入群      ○─────────●─────●─────●─────●─────●─────●
           MIERU導入                                    最終評価
対照群      ○─────────○─────○─────○─────○─────○─────○
           紙ベース                                     最終評価→MIERU導入

○ = 測定ポイント、● = MIERU自動収集（連続）`}</pre>
                </div>
              </SubSection>
              <SubSection title="9-2. 各時点での収集項目">
                <Table
                  headers={["時点", "介入群", "対照群"]}
                  rows={[
                    ["ベースライン（月0）", "医院基本情報、直近3ヶ月経営指標、紙アンケート1ヶ月分", "同左"],
                    ["毎月（月1-6）", "MIERU自動収集、月次レポート入力、システム利用ログ", "紙アンケート、月次経営指標報告"],
                    ["中間（月3）", "スタッフアンケート（自己効力感・満足度）", "同左"],
                    ["最終（月6）", "最終評価（スタッフアンケート＋院長インタビュー）", "同左"],
                  ]}
                />
              </SubSection>
            </Chapter>

            {/* ===== Chapter 10: 統計解析計画 ===== */}
            <Chapter id="ch10" number="10" title="統計解析計画" icon={LineChart}>
              <SubSection title="10-1. 解析対象集団">
                <ul className="ml-5 list-disc space-y-1 text-sm text-foreground/90">
                  <li><strong>ITT（Intention-to-Treat）集団:</strong> ランダム化された全30院（主解析）</li>
                  <li><strong>Per-Protocol集団:</strong> プロトコルを遵守した医院のみ（感度分析）</li>
                </ul>
              </SubSection>
              <SubSection title="10-2. 主解析">
                <div className="space-y-3">
                  <p className="text-sm font-medium text-foreground">
                    マルチレベル線形混合効果モデル（患者がクラスター〔医院〕にネストされた階層構造を反映）
                  </p>
                  <div className="overflow-x-auto rounded-xl border bg-slate-50 p-4">
                    <pre className="text-xs leading-relaxed text-foreground/80">{`モデル構造:
  Level 1（患者レベル）:
    満足度スコア_ij = β_0j + β_1j × 時点 + β_2 × 患者属性 + e_ij

  Level 2（医院レベル）:
    β_0j = γ_00 + γ_01 × 群（介入/対照） + γ_02 × 医院属性 + u_0j
    β_1j = γ_10 + γ_11 × 群（介入/対照） + u_1j

  主要検定: γ_11（群×時点の交互作用） ≠ 0`}</pre>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    使用ソフトウェア: R（lme4パッケージ）またはStata（mixed）
                  </p>
                </div>
              </SubSection>
              <SubSection title="10-3. 副次解析">
                <Table
                  headers={["分析", "手法"]}
                  rows={[
                    ["質問別改善パターン", "質問カテゴリごとの群×時点交互作用"],
                    ["スタッフ行動と満足度の関連", "配布率・ストリーク・利用頻度を説明変数とした回帰分析"],
                    ["経営指標との相関", "満足度変化量と来院数・自費率変化量のPearson/Spearman相関"],
                    ["サブグループ分析", "医院規模別、開業年数別、自費率別の効果修飾"],
                    ["募集チャネル別分析", "サロン会員 vs LINE/SNS経由の参加者で介入効果に差があるか"],
                    ["用量反応関係", "MIERU利用頻度と効果の関連"],
                  ]}
                />
              </SubSection>
              <SubSection title="10-4. 感度分析">
                <Table
                  headers={["分析", "目的"]}
                  rows={[
                    ["ITT vs Per-Protocol", "プロトコル遵守の影響を評価"],
                    ["欠測データの多重代入法", "欠測がランダムでない場合の影響を評価"],
                    ["紙 vs デジタルの媒体効果補正", "収集方法差を検討"],
                    ["クラスターサイズ不均衡補正", "医院ごとの回答数のばらつきのロバスト性確認"],
                    ["募集チャネル別効果修飾分析", "チャネルによる効果差の検討"],
                    ["汚染除外分析", "逸脱があった医院を除外した再分析"],
                  ]}
                />
              </SubSection>
              <SubSection title="10-5. 有意水準">
                <ul className="ml-5 list-disc space-y-1 text-sm text-foreground/90">
                  <li>主要評価項目: 両側 α = 0.05</li>
                  <li>副次評価項目: Bonferroni補正またはFDR（False Discovery Rate）制御</li>
                </ul>
              </SubSection>
            </Chapter>

            {/* ===== Chapter 11: 倫理的配慮 ===== */}
            <Chapter id="ch11" number="11" title="倫理的配慮" icon={ShieldCheck}>
              <SubSection title="11-1. 倫理審査">
                <ul className="ml-5 list-disc space-y-1 text-sm text-foreground/90">
                  <li>共著の大学教員が所属する機関の倫理審査委員会（IRB）に申請</li>
                  <li>ヘルシンキ宣言および「人を対象とする生命科学・医学系研究に関する倫理指針」に準拠</li>
                </ul>
              </SubSection>
              <SubSection title="11-2. 同意取得">
                <Table
                  headers={["対象", "同意方法"]}
                  rows={[
                    ["参加医院（院長）", "書面による説明同意。研究目的、方法、期間、リスク・利益、辞退の自由を説明"],
                    ["スタッフ", "書面による説明同意。研究への参加が任意であること、不参加による不利益がないことを明記"],
                    ["患者", "アンケート冒頭に研究目的と匿名性を掲示。回答をもって同意とみなす（オプトアウト方式）"],
                  ]}
                />
              </SubSection>
              <SubSection title="11-3. 個人情報保護">
                <ul className="ml-5 list-disc space-y-1 text-sm text-foreground/90">
                  <li>患者の個人情報は収集しない（匿名アンケート）</li>
                  <li>IPアドレスはSHA-256ハッシュ化して保存（重複回答防止目的のみ）</li>
                  <li>医院・スタッフのデータは研究IDで匿名化して管理</li>
                  <li>データは暗号化されたクラウドサーバー（Google Cloud, asia-northeast1）に保管</li>
                  <li>研究終了後10年間保管し、その後適切に廃棄</li>
                </ul>
              </SubSection>
              <SubSection title="11-4. 利益相反（COI）の開示">
                <div className="space-y-3">
                  <InfoBox title="開示事項">
                    <p className="text-sm text-muted-foreground">
                      筆頭著者（またはその関係者）は、本研究で使用するMIERU PXの開発・提供元である株式会社ファンクション・ティの代表取締役（または関係者）である。
                    </p>
                  </InfoBox>
                  <p className="text-sm font-medium">COI管理方針:</p>
                  <ol className="ml-5 list-decimal space-y-1 text-sm text-foreground/90">
                    <li>研究デザインの策定は利益相反のない共著者と協議の上で決定</li>
                    <li>ランダム化の割付は独立した統計専門家が実施</li>
                    <li>データ分析は利益相反のない共著者が独立して実施（可能であれば盲検化）</li>
                    <li>研究プロトコルはUMIN-CTRに事前登録し、事後的な変更を防止</li>
                    <li>全共著者のCOI自己申告書を倫理審査時に提出</li>
                  </ol>
                </div>
              </SubSection>
            </Chapter>

            {/* ===== Chapter 12: 臨床試験登録 ===== */}
            <Chapter id="ch12" number="12" title="臨床試験登録" icon={ClipboardList}>
              <SubSection title="12-1. 登録先">
                <ul className="ml-5 list-disc space-y-1 text-sm text-foreground/90">
                  <li><strong>UMIN-CTR</strong>（UMIN臨床試験登録システム）に事前登録</li>
                  <li>介入開始前に登録を完了し、登録番号を取得</li>
                </ul>
              </SubSection>
              <SubSection title="12-2. 登録内容">
                <p className="text-sm text-foreground/90">
                  研究題目、研究デザイン、対象、介入内容、主要/副次評価項目、サンプルサイズ、予定登録期間。登録番号は論文に記載。
                </p>
              </SubSection>
            </Chapter>

            {/* ===== Chapter 13: 品質管理 ===== */}
            <Chapter id="ch13" number="13" title="品質管理" icon={CheckSquare}>
              <SubSection title="13-1. データモニタリング">
                <ul className="ml-5 list-disc space-y-1 text-sm text-foreground/90">
                  <li>月次でデータ完全性を確認（欠測率、異常値の検出）</li>
                  <li>介入群: MIERUのシステムログで利用状況をモニタリング</li>
                  <li>対照群: 紙アンケートの回収状況を月次で確認</li>
                </ul>
              </SubSection>
              <SubSection title="13-2. プロトコル逸脱の管理">
                <ul className="ml-5 list-disc space-y-1 text-sm text-foreground/90">
                  <li>逸脱の定義: 月間アンケート回収数が10件未満、2ヶ月連続で月次レポート未提出 等</li>
                  <li>逸脱が発生した場合の対応手順を事前に規定</li>
                  <li>全逸脱を記録し、論文で報告</li>
                </ul>
              </SubSection>
              <SubSection title="13-3. 汚染（Contamination）リスクの管理">
                <div className="space-y-3">
                  <p className="text-sm text-foreground/90">
                    3チャネルからの募集により、介入群と対照群の参加者が情報交換し「汚染」のリスクがある。以下の対策を講じる：
                  </p>
                  <Table
                    headers={["対策", "内容"]}
                    rows={[
                      ["地理的分離", "同一地域の医院を介入群と対照群に同時に割り付けない"],
                      ["情報共有の制限", "サロン・LINE内で研究の具体的な介入内容の共有を控えるよう書面で依頼"],
                      ["対照群への動機抑制", "6ヶ月後にシステム導入保証を明示し、独自ツール導入動機を抑制"],
                      ["逸脱の記録", "独自PXツール導入を逸脱として記録、感度分析で除外して再分析"],
                      ["チャネル別分析", "流入チャネルを記録し、チャネルによる効果修飾を副次分析で検討"],
                    ]}
                  />
                </div>
              </SubSection>
              <SubSection title="13-4. 脱落対策">
                <ul className="ml-5 list-disc space-y-1 text-sm text-foreground/90">
                  <li>月1回の進捗確認コール（介入群・対照群双方）</li>
                  <li>介入群: 利用率が低下した場合の個別サポート</li>
                  <li>対照群: 「6ヶ月後にMIERU導入保証」のリマインド</li>
                  <li>研究完了医院への謝礼: 研究成果の先行共有、修了証書</li>
                </ul>
              </SubSection>
            </Chapter>

            {/* ===== Chapter 14: 研究体制 ===== */}
            <Chapter id="ch14" number="14" title="研究体制" icon={Building2}>
              <SubSection title="14-1. 必要な共著者構成">
                <Table
                  headers={["役割", "人数", "主な担当"]}
                  rows={[
                    ["筆頭著者（研究代表者）", "1", "研究設計・データ収集統括・論文執筆"],
                    ["統計専門家（生物統計）", "1", "検出力分析・ランダム化実施・主解析・感度分析"],
                    ["歯科系大学教員", "1-2", "学術的監修・倫理審査の受け皿・歯科領域の文脈付け"],
                    ["医療情報学研究者", "0-1", "デジタルヘルス介入の方法論的助言"],
                  ]}
                />
              </SubSection>
              <SubSection title="14-2. 共著者確保の優先アクション">
                <ol className="ml-5 list-decimal space-y-1 text-sm text-foreground/90">
                  <li>オンラインサロン会員の中から歯科系大学教員を探索</li>
                  <li>歯科大学の社会歯科学・予防歯科学・歯科医療管理学教室にコンタクト</li>
                  <li>医療情報学会・歯科医療管理学会での人脈形成</li>
                </ol>
              </SubSection>
            </Chapter>

            {/* ===== Chapter 15: 論文作成計画 ===== */}
            <Chapter id="ch15" number="15" title="論文作成計画" icon={BookOpen}>
              <SubSection title="15-1. 投稿先候補（戦略的優先順位）">
                <Table
                  headers={["優先度", "ジャーナル", "IF（概算）", "選択理由"]}
                  rows={[
                    ["第1候補", "JMIR", "~7.0", "デジタルヘルス最高峰。RCTなら歓迎"],
                    ["第2候補", "BMC Oral Health", "~4.0", "OA。歯科×デジタルヘルスに好意的"],
                    ["第3候補", "Int. Dental Journal", "~3.5", "国際歯科系。中堅誌"],
                    ["第4候補", "Patient Experience J.", "—", "患者体験特化。採択率高め"],
                    ["国内", "日本歯科医療管理学会雑誌", "—", "日本語可。実績作り"],
                  ]}
                />
              </SubSection>
              <SubSection title="15-2. 報告ガイドライン">
                <ul className="ml-5 list-disc space-y-1 text-sm text-foreground/90">
                  <li><strong>CONSORT 2010:</strong> クラスターRCTの拡張版チェックリストに準拠</li>
                  <li><strong>TIDieR:</strong> 介入内容の報告にTemplate for Intervention Description and Replicationを使用</li>
                </ul>
              </SubSection>
              <SubSection title="15-3. 執筆スケジュール（介入終了後）">
                <Table
                  headers={["期間", "作業"]}
                  rows={[
                    ["月1", "データクリーニング・主解析実施"],
                    ["月2", "Methods → Results 執筆"],
                    ["月3", "Discussion → Introduction → Abstract 執筆"],
                    ["月4", "共著者レビュー・英文校正"],
                    ["月5", "投稿・査読対応開始"],
                  ]}
                />
              </SubSection>
            </Chapter>

            {/* ===== Chapter 16: 学会発表計画 ===== */}
            <Chapter id="ch16" number="16" title="学会発表計画" icon={GraduationCap}>
              <p className="text-sm text-foreground/90">
                論文投稿と並行して、以下の学会での発表を検討する：
              </p>
              <Table
                headers={["学会", "種別", "目的"]}
                rows={[
                  ["日本歯科医療管理学会", "口演", "国内歯科管理分野での認知"],
                  ["日本医療情報学会", "ポスター", "デジタルヘルス文脈での評価"],
                  ["IADR（国際歯科研究学会）", "ポスター", "国際的な認知・フィードバック取得"],
                ]}
              />
            </Chapter>

            {/* ===== Chapter 17: 研究の限界 ===== */}
            <Chapter id="ch17" number="17" title="研究の限界" icon={AlertTriangle}>
              <p className="mb-3 text-sm text-foreground/90">
                予め認識しておく事項：
              </p>
              <div className="space-y-3">
                {[
                  { label: "選択バイアス", desc: "参加医院はオンラインサロン・LINE・SNSからの自発的応募。3チャネル併用で緩和されるが、オンラインコミュニティ非参加の歯科医院への外的妥当性には限界がある" },
                  { label: "盲検化の不可能", desc: "介入の性質上、参加者の盲検化は不可能。解析者の盲検化で部分的に対応" },
                  { label: "収集媒体の差異", desc: "介入群（デジタル）と対照群（紙）のアンケート収集媒体が異なり、媒体効果が交絡しうる。感度分析で対処" },
                  { label: "観察期間", desc: "6ヶ月の介入期間では長期効果（1年以上）は不明" },
                  { label: "利益相反", desc: "著者がシステム開発元に関連。COI管理方針で透明性を確保" },
                  { label: "ホーソン効果", desc: "研究参加自体が行動変容を促す可能性がある（介入群・対照群双方に影響）" },
                  { label: "汚染", desc: "対照群が介入群の情報を得て独自の改善活動を行う可能性。地理的分離・情報共有制限・プロトコル逸脱の記録で対処" },
                  { label: "チャネル間の異質性", desc: "募集チャネルにより参加者の特性が異なる可能性。チャネルを共変量とした感度分析で対処" },
                ].map((item, i) => (
                  <div key={i} className="rounded-xl border border-amber-200/60 bg-amber-50/40 p-4">
                    <p className="text-sm">
                      <span className="font-semibold text-amber-800">{i + 1}. {item.label}</span>
                      <span className="text-foreground/80"> — {item.desc}</span>
                    </p>
                  </div>
                ))}
              </div>
            </Chapter>

            {/* ===== Chapter 18: タイムライン ===== */}
            <Chapter id="ch18" number="18" title="タイムライン全体像" icon={Clock}>
              <div className="space-y-3">
                {[
                  { period: "2026年3月", label: "準備", desc: "共著者チーム確定・研究計画書正式版作成" },
                  { period: "2026年4月", label: "審査", desc: "倫理審査申請・UMIN-CTR登録" },
                  { period: "2026年5月", label: "募集", desc: "倫理審査承認（想定）・参加医院募集開始" },
                  { period: "2026年6月", label: "選定", desc: "30院選定・ランダム化・導入準備" },
                  { period: "2026年7月", label: "基準", desc: "ベースライン測定（1ヶ月間）" },
                  { period: "2026年8月", label: "開始", desc: "介入開始", highlight: true },
                  { period: "2026年8月〜2027年1月", label: "介入", desc: "介入期間（6ヶ月間）", highlight: true },
                  { period: "2027年1月", label: "終了", desc: "介入終了・最終測定" },
                  { period: "2027年2-3月", label: "解析", desc: "データクリーニング・解析・論文執筆" },
                  { period: "2027年4-5月", label: "執筆", desc: "共著者レビュー・英文校正" },
                  { period: "2027年6月", label: "投稿", desc: "投稿" },
                  { period: "2027年7-9月", label: "査読", desc: "査読対応" },
                ].map((item, i) => (
                  <div
                    key={i}
                    className={`flex items-start gap-4 rounded-xl border p-4 ${
                      item.highlight
                        ? "border-primary/30 bg-primary/[0.03]"
                        : "bg-card"
                    }`}
                  >
                    <div className="flex flex-col items-center">
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                          item.highlight
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {i + 1}
                      </div>
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                          {item.period}
                        </span>
                        <span className="text-[11px] font-medium uppercase tracking-wider text-primary">
                          {item.label}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-foreground/90">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Chapter>

            {/* ===== Chapter 19: 予算概算 ===== */}
            <Chapter id="ch19" number="19" title="予算概算" icon={Wallet}>
              <Table
                headers={["項目", "概算費用", "備考"]}
                rows={[
                  ["MIERU利用料（介入群15院 × 6ヶ月）", "¥0", "研究協力として無償提供"],
                  ["紙アンケート印刷・郵送費", "¥150,000", "15院 × 6ヶ月"],
                  ["統計解析外注", "¥300,000-500,000", "生物統計専門家への委託"],
                  ["英文校正", "¥100,000-200,000", "論文1本分"],
                  ["論文投稿料（OA）", "¥200,000-400,000", "BMC Oral Health: 約$2,000"],
                  ["学会参加費・旅費", "¥200,000", "国内学会2回想定"],
                ]}
                highlightLast={false}
              />
              <div className="mt-4 rounded-xl border border-primary/20 bg-primary/[0.03] p-4 text-center">
                <p className="text-xs text-muted-foreground">合計</p>
                <p className="text-2xl font-bold text-gradient">¥950,000 〜 ¥1,450,000</p>
              </div>
            </Chapter>

            {/* ===== Chapter 20: 付録 ===== */}
            <Chapter id="ch20" number="20" title="付録" icon={Paperclip}>
              <SubSection title="付録A: 統一アンケート質問項目（案）">
                <p className="mb-3 text-sm text-foreground/90">
                  研究用に以下の統一テンプレートを使用する（各質問は5段階評価、最後に自由記述欄）：
                </p>
                <Table
                  headers={["#", "質問", "カテゴリ"]}
                  rows={[
                    ["Q1", "受付の対応はいかがでしたか？", "接遇"],
                    ["Q2", "待ち時間は許容範囲でしたか？", "待ち時間"],
                    ["Q3", "治療の説明はわかりやすかったですか？", "説明"],
                    ["Q4", "治療中の痛みへの配慮は十分でしたか？", "治療"],
                    ["Q5", "スタッフの対応は丁寧でしたか？", "スタッフ"],
                    ["Q6", "院内の清潔さはいかがでしたか？", "環境"],
                    ["Q7", "費用の説明は十分でしたか？", "費用"],
                    ["Q8", "全体的な満足度はいかがですか？", "総合"],
                  ]}
                />
              </SubSection>
              <SubSection title="付録B: 医院募集時の属性収集項目">
                <Table
                  headers={["#", "項目", "選択肢 / 形式"]}
                  rows={[
                    ["1", "医院名", "自由記述"],
                    ["2", "所在地（都道府県）", "選択式"],
                    ["3", "立地", "都市部 / 郊外 / 地方"],
                    ["4", "ユニット数", "数値入力"],
                    ["5", "常勤スタッフ数", "数値入力"],
                    ["6", "開業年数", "数値入力"],
                    ["7", "月間平均来院患者数", "数値入力"],
                    ["8", "自費率（概算）", "10%未満 / 10-20% / 20-30% / 30%以上"],
                    ["9", "患者満足度の自己評価", "高い / 普通 / 低い"],
                    ["10", "募集を知った経路", "サロン / LINE / SNS / その他"],
                  ]}
                />
              </SubSection>
              <SubSection title="付録C: CONSORT 2010 チェックリスト（クラスターRCT拡張）">
                <p className="mb-3 text-sm text-foreground/90 italic">
                  論文執筆時に各項目の該当箇所を記入する。ここではチェックリストの枠組みのみ記載。
                </p>
                <div className="space-y-1.5">
                  {[
                    "Title and abstract",
                    "Introduction: Background and objectives",
                    "Methods: Trial design",
                    "Methods: Participants (eligibility criteria, settings)",
                    "Methods: Interventions",
                    "Methods: Outcomes",
                    "Methods: Sample size (including ICC and cluster size)",
                    "Methods: Randomisation (sequence generation, allocation concealment)",
                    "Methods: Blinding",
                    "Methods: Statistical methods (accounting for clustering)",
                    "Results: Participant flow (CONSORT diagram with clusters)",
                    "Results: Baseline data",
                    "Results: Numbers analysed",
                    "Results: Outcomes and estimation (with ICC)",
                    "Discussion: Limitations",
                    "Discussion: Generalisability",
                    "Other: Registration, Protocol, Funding, COI",
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 rounded-lg border bg-card px-4 py-2">
                      <div className="h-4 w-4 shrink-0 rounded border-2 border-muted-foreground/30" />
                      <span className="text-sm text-foreground/80">{item}</span>
                    </div>
                  ))}
                </div>
              </SubSection>
            </Chapter>

            {/* ===== Footer note ===== */}
            <div className="border-t pt-10 text-center">
              <p className="text-xs text-muted-foreground">
                本文書は研究計画書のドラフト（v0.1）です。共著者チーム確定後に正式版へ改訂されます。
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                &copy; 2025-2026 株式会社ファンクション・ティ. All rights reserved.
              </p>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Sub Components                                                     */
/* ------------------------------------------------------------------ */

function Chapter({
  id,
  number,
  title,
  icon: Icon,
  children,
}: {
  id: string
  number: string
  title: string
  icon: React.ComponentType<{ className?: string }>
  children: React.ReactNode
}) {
  return (
    <section id={id} className="scroll-mt-20">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wider text-primary">
            Chapter {number}
          </p>
          <h2 className="text-xl font-bold tracking-tight sm:text-2xl">{title}</h2>
        </div>
      </div>
      <div className="space-y-6">{children}</div>
    </section>
  )
}

function SubSection({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div>
      <h3 className="mb-3 text-base font-semibold text-foreground/90">{title}</h3>
      {children}
    </div>
  )
}

function Table({
  headers,
  rows,
  highlightLast = false,
}: {
  headers: string[]
  rows: string[][]
  highlightLast?: boolean
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            {headers.map((h, i) => (
              <th key={i} className="pb-2 pr-4 text-left text-xs font-semibold text-muted-foreground last:pr-0">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={i}
              className={`border-b last:border-0 ${
                highlightLast && i === rows.length - 1
                  ? "bg-primary/[0.03] font-medium"
                  : ""
              }`}
            >
              {row.map((cell, j) => (
                <td key={j} className="py-2.5 pr-4 text-foreground/80 last:pr-0">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function InfoBox({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-blue-200/60 bg-blue-50/40 p-4">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-blue-700">{title}</p>
      {children}
    </div>
  )
}
