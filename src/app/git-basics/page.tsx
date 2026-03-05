import type { Metadata } from "next"
import {
  Save,
  Upload,
  Download,
  GitBranch,
  GitMerge,
  FolderGit2,
  PackageCheck,
  Eye,
  RotateCcw,
  GitPullRequest,
  Copy,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  ArrowDown,
  BookOpen,
  Bot,
  Github,
  Container,
  Star,
  MessageSquare,
  Rocket,
  Shield,
  Users,
  Globe,
  Lightbulb,
} from "lucide-react"

export const metadata: Metadata = {
  title: "Git用語ガイド | 初心者向けかんたん解説",
  description:
    "Gitの基本用語をゲームやファイル操作のたとえでわかりやすく解説。初心者が最初に覚えるべき用語を優先順位順に紹介します。",
  robots: { index: false, follow: false },
}

/* ------------------------------------------------------------------ */
/* Data                                                               */
/* ------------------------------------------------------------------ */

type Term = {
  term: string
  analogy: string
  description: string
  icon: React.ElementType
  priority: "must" | "important" | "useful"
  example?: string
}

const terms: Term[] = [
  /* ---- 最優先（must） ---- */
  {
    term: "リポジトリ (Repository)",
    analogy: "プロジェクトの倉庫",
    description:
      "コードとその変更履歴をまとめて保管する場所です。フォルダのようなものですが、過去の全記録も含まれています。",
    icon: FolderGit2,
    priority: "must",
    example: "git init → 今のフォルダをリポジトリにする",
  },
  {
    term: "コミット (Commit)",
    analogy: "ゲームのセーブポイント",
    description:
      "ある時点のコードの状態を記録します。いつでも過去のセーブポイントに戻れます。メッセージ付きで「何を変えたか」も残せます。",
    icon: Save,
    priority: "must",
    example: 'git commit -m "ログイン機能を追加"',
  },
  {
    term: "プッシュ (Push)",
    analogy: "クラウドにアップロード",
    description:
      "ローカル（自分のPC）のコミットをリモート（GitHub等）に送ります。チームメンバーがあなたの変更を見られるようになります。",
    icon: Upload,
    priority: "must",
    example: "git push origin main",
  },
  {
    term: "プル (Pull)",
    analogy: "クラウドからダウンロード＋統合",
    description:
      "リモートの最新の変更を取り込みます。単なるダウンロードではなく、自分の作業と自動的に統合（マージ）してくれます。",
    icon: Download,
    priority: "must",
    example: "git pull origin main",
  },
  {
    term: "ブランチ (Branch)",
    analogy: "パラレルワールド（並行世界）",
    description:
      "本流のコードに影響を与えずに、別の作業を進められる分岐です。新機能やバグ修正を安全に開発できます。",
    icon: GitBranch,
    priority: "must",
    example: "git branch feature/login → 新しいブランチを作成",
  },
  {
    term: "マージ (Merge)",
    analogy: "並行世界を合流させる",
    description:
      "ブランチで作った変更を本流（mainブランチ等）に取り込みます。2つの作業を1つに合体させるイメージです。",
    icon: GitMerge,
    priority: "must",
    example: "git merge feature/login → 現在のブランチにloginブランチを合流",
  },

  /* ---- 重要（important） ---- */
  {
    term: "ステージ (Stage / Add)",
    analogy: "セーブする前の選択",
    description:
      "コミットに含めるファイルを選ぶ操作です。変更したファイルすべてをセーブするのではなく、必要なものだけを選べます。",
    icon: PackageCheck,
    priority: "important",
    example: "git add index.html → このファイルを次のコミットに含める",
  },
  {
    term: "クローン (Clone)",
    analogy: "プロジェクトをまるごとコピー",
    description:
      "リモートのリポジトリを自分のPCに複製します。履歴も含めて全部コピーされるので、すぐに開発を始められます。",
    icon: Copy,
    priority: "important",
    example: "git clone https://github.com/user/repo.git",
  },
  {
    term: "プルリクエスト (Pull Request / PR)",
    analogy: "レビュー依頼書",
    description:
      "「この変更を取り込んでください」というリクエストです。チームメンバーにコードを確認してもらってからマージできます。",
    icon: GitPullRequest,
    priority: "important",
    example: "GitHubの画面から「New Pull Request」ボタンで作成",
  },
  {
    term: "コンフリクト (Conflict)",
    analogy: "同じ場所を2人が同時に編集してしまった",
    description:
      "複数人が同じファイルの同じ箇所を変更したときに起きます。Gitが自動統合できないため、手動でどちらを採用するか選びます。",
    icon: AlertTriangle,
    priority: "important",
    example: "<<<<<<< と >>>>>>> の間で、どちらの変更を残すか選ぶ",
  },
  {
    term: "ステータス (Status)",
    analogy: "今の状況を確認する",
    description:
      "変更したファイル、ステージに上げたファイル、まだ追跡していないファイルなど、現在の状態を一覧表示します。",
    icon: Eye,
    priority: "important",
    example: "git status → 変更状況を一覧表示",
  },

  /* ---- 知っておくと便利（useful） ---- */
  {
    term: "フェッチ (Fetch)",
    analogy: "新着チェック（まだ適用しない）",
    description:
      "リモートの変更をダウンロードだけして、自分の作業には適用しません。Pullの前半部分だけを行うイメージです。",
    icon: Download,
    priority: "useful",
    example: "git fetch origin → リモートの情報を取得するだけ",
  },
  {
    term: "チェックアウト (Checkout)",
    analogy: "セーブデータをロードする",
    description:
      "別のブランチに切り替えたり、過去のコミットの状態に戻したりします。作業場所を移動するイメージです。",
    icon: RotateCcw,
    priority: "useful",
    example: "git checkout main → mainブランチに切り替え",
  },
  {
    term: "diff（ディフ）",
    analogy: "ビフォーアフターの比較",
    description:
      "変更前と変更後の差分を表示します。何を追加・削除・変更したかが一目でわかります。",
    icon: Eye,
    priority: "useful",
    example: "git diff → まだステージに上げていない変更を表示",
  },
  {
    term: "スタッシュ (Stash)",
    analogy: "作業を一時的に引き出しにしまう",
    description:
      "今の作業を一時保存して、きれいな状態に戻します。急な対応が必要になったとき、作業中の変更を退避できます。",
    icon: PackageCheck,
    priority: "useful",
    example: "git stash → 変更を退避 / git stash pop → 退避した変更を復元",
  },
]

const priorityConfig = {
  must: {
    label: "最初に覚える（必須）",
    color: "bg-red-50 border-red-200",
    badge: "bg-red-100 text-red-700",
  },
  important: {
    label: "チーム開発で必要",
    color: "bg-amber-50 border-amber-200",
    badge: "bg-amber-100 text-amber-700",
  },
  useful: {
    label: "知っておくと便利",
    color: "bg-blue-50 border-blue-200",
    badge: "bg-blue-100 text-blue-700",
  },
}

const workflow = [
  { step: "コード編集", desc: "ファイルを変更する" },
  { step: "git add", desc: "ステージに上げる（選択）" },
  { step: "git commit", desc: "セーブポイントを作る" },
  { step: "git push", desc: "GitHubにアップロード" },
]

/* ------------------------------------------------------------------ */
/* Recommended Setup Data                                             */
/* ------------------------------------------------------------------ */

type SetupTool = {
  name: string
  tagline: string
  icon: React.ElementType
  color: string
  bgColor: string
  borderColor: string
  analogy: string
  description: string
  reasons: string[]
}

const setupTools: SetupTool[] = [
  {
    name: "Claude Code",
    tagline: "AIプログラミング助手",
    icon: Bot,
    color: "text-orange-600",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200",
    analogy: "何でも聞けるプログラミングの先生",
    description:
      "AIがあなたの代わりにコードを書いたり、エラーを直したり、わからないことを教えてくれるツールです。「こんな機能を作りたい」と日本語で伝えるだけで、コードを自動生成してくれます。",
    reasons: [
      "日本語で指示するだけでコードを書いてくれる",
      "エラーが出ても原因を見つけて直してくれる",
      "プログラミングの知識がなくても開発を始められる",
      "GitやDockerの操作もAIにおまかせできる",
    ],
  },
  {
    name: "GitHub",
    tagline: "コードの保管庫＆共有サービス",
    icon: Github,
    color: "text-gray-900",
    bgColor: "bg-gray-50",
    borderColor: "border-gray-200",
    analogy: "コード専用のクラウドストレージ",
    description:
      "作ったコードをインターネット上に保管できるサービスです。Google ドライブのコード版と考えてください。変更の履歴が全部残るので、いつでも前の状態に戻せます。チームでの共同作業にも対応しています。",
    reasons: [
      "コードをなくす心配がない（クラウドに自動バックアップ）",
      "変更の履歴が全部残るので安心して開発できる",
      "世界中の開発者が使っている定番サービス",
      "無料で始められる",
    ],
  },
  {
    name: "Docker",
    tagline: "どこでも同じ環境を再現",
    icon: Container,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    analogy: "アプリを箱詰めして届ける配送サービス",
    description:
      "あなたのパソコンで動いているアプリを、そのまま別のパソコンやサーバーでも動かせるようにする仕組みです。「自分のパソコンでは動くのに、他の環境では動かない」という問題を解決します。",
    reasons: [
      "「自分のPCでは動くのに…」問題がなくなる",
      "難しい設定なしで開発環境を一発で用意できる",
      "アプリを公開するときも同じ仕組みで簡単にできる",
      "チーム全員が同じ環境で開発できる",
    ],
  },
]


/* ------------------------------------------------------------------ */
/* Components                                                         */
/* ------------------------------------------------------------------ */

function TermCard({ t }: { t: Term }) {
  const config = priorityConfig[t.priority]
  const Icon = t.icon

  return (
    <div className={`rounded-xl border-2 p-5 ${config.color}`}>
      <div className="mb-3 flex items-start gap-3">
        <div className="mt-0.5 rounded-lg bg-white p-2 shadow-sm">
          <Icon className="h-5 w-5 text-gray-700" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-900">{t.term}</h3>
          <p className="mt-0.5 text-sm font-semibold text-gray-600">
            たとえ：{t.analogy}
          </p>
        </div>
      </div>
      <p className="mb-3 text-sm leading-relaxed text-gray-700">
        {t.description}
      </p>
      {t.example && (
        <div className="rounded-lg bg-gray-900 px-3 py-2">
          <code className="text-xs text-green-400">{t.example}</code>
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Page                                                               */
/* ------------------------------------------------------------------ */

export default function GitBasicsPage() {
  const mustTerms = terms.filter((t) => t.priority === "must")
  const importantTerms = terms.filter((t) => t.priority === "important")
  const usefulTerms = terms.filter((t) => t.priority === "useful")

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero */}
      <header className="border-b bg-white px-4 py-12 text-center">
        <div className="mx-auto max-w-2xl">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-900">
            <BookOpen className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
            Git用語ガイド
          </h1>
          <p className="mt-2 text-base text-gray-500">
            初心者が覚えるべき用語を、
            <br className="sm:hidden" />
            かんたんなたとえで解説します
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10">
        {/* Workflow overview */}
        <section className="mb-12">
          <h2 className="mb-4 text-center text-lg font-bold text-gray-900">
            基本の流れ
          </h2>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {workflow.map((w, i) => (
              <div key={w.step} className="flex items-center gap-2">
                <div className="rounded-lg border bg-white px-4 py-2 text-center shadow-sm">
                  <p className="text-sm font-bold text-gray-900">{w.step}</p>
                  <p className="text-xs text-gray-500">{w.desc}</p>
                </div>
                {i < workflow.length - 1 && (
                  <ArrowRight className="h-4 w-4 text-gray-400" />
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Priority sections */}
        {[
          { key: "must" as const, items: mustTerms },
          { key: "important" as const, items: importantTerms },
          { key: "useful" as const, items: usefulTerms },
        ].map(({ key, items }) => {
          const config = priorityConfig[key]
          return (
            <section key={key} className="mb-10">
              <div className="mb-4 flex items-center gap-2">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold ${config.badge}`}
                >
                  {config.label}
                </span>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {items.map((t) => (
                  <TermCard key={t.term} t={t} />
                ))}
              </div>
            </section>
          )
        })}

        {/* ============================================================ */}
        {/* Recommended Setup Section                                    */}
        {/* ============================================================ */}
        <section className="mb-12 mt-4">
          <div className="mb-6 text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-100 px-3 py-1 text-xs font-bold text-purple-700">
              <Star className="h-3.5 w-3.5" />
              おすすめ構成
            </span>
            <h2 className="mt-3 text-2xl font-extrabold text-gray-900">
              初心者におすすめの開発ツール3選
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              この3つを組み合わせると、プログラミング初心者でも
              <br className="sm:hidden" />
              本格的なアプリ開発から公開までできます
            </p>
          </div>

          {/* Flow diagram */}
          <div className="mb-8 rounded-2xl border-2 border-purple-100 bg-gradient-to-b from-purple-50 to-white p-6">
            <h3 className="mb-5 text-center text-sm font-bold text-gray-700">
              全体の流れ
            </h3>

            {/* Horizontal flow for desktop */}
            <div className="hidden items-center justify-center gap-3 md:flex">
              {/* You */}
              <div className="flex flex-col items-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-purple-100">
                  <MessageSquare className="h-6 w-6 text-purple-600" />
                </div>
                <p className="mt-1.5 text-xs font-bold text-gray-700">
                  あなた
                </p>
                <p className="text-[10px] text-gray-400">日本語で指示</p>
              </div>

              <ArrowRight className="h-5 w-5 text-purple-300" />

              {/* Claude Code */}
              <div className="flex flex-col items-center rounded-xl border-2 border-orange-200 bg-orange-50 px-4 py-3">
                <Bot className="h-7 w-7 text-orange-600" />
                <p className="mt-1 text-xs font-bold text-gray-800">
                  Claude Code
                </p>
                <p className="text-[10px] text-gray-500">AIがコードを作成</p>
              </div>

              <ArrowRight className="h-5 w-5 text-purple-300" />

              {/* GitHub */}
              <div className="flex flex-col items-center rounded-xl border-2 border-gray-200 bg-gray-50 px-4 py-3">
                <Github className="h-7 w-7 text-gray-900" />
                <p className="mt-1 text-xs font-bold text-gray-800">GitHub</p>
                <p className="text-[10px] text-gray-500">コードを保管・管理</p>
              </div>

              <ArrowRight className="h-5 w-5 text-purple-300" />

              {/* Docker */}
              <div className="flex flex-col items-center rounded-xl border-2 border-blue-200 bg-blue-50 px-4 py-3">
                <Container className="h-7 w-7 text-blue-600" />
                <p className="mt-1 text-xs font-bold text-gray-800">Docker</p>
                <p className="text-[10px] text-gray-500">アプリを公開</p>
              </div>

              <ArrowRight className="h-5 w-5 text-purple-300" />

              {/* World */}
              <div className="flex flex-col items-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
                  <Globe className="h-6 w-6 text-green-600" />
                </div>
                <p className="mt-1.5 text-xs font-bold text-gray-700">
                  世界に公開!
                </p>
              </div>
            </div>

            {/* Vertical flow for mobile */}
            <div className="flex flex-col items-center gap-2 md:hidden">
              <div className="flex items-center gap-3 rounded-xl border bg-white px-4 py-3 shadow-sm">
                <MessageSquare className="h-6 w-6 text-purple-600" />
                <div>
                  <p className="text-sm font-bold text-gray-800">あなた</p>
                  <p className="text-xs text-gray-500">
                    「ログイン画面を作って」と日本語で指示
                  </p>
                </div>
              </div>
              <ArrowDown className="h-4 w-4 text-purple-300" />
              <div className="flex items-center gap-3 rounded-xl border-2 border-orange-200 bg-orange-50 px-4 py-3">
                <Bot className="h-6 w-6 text-orange-600" />
                <div>
                  <p className="text-sm font-bold text-gray-800">Claude Code</p>
                  <p className="text-xs text-gray-500">
                    AIがコードを自動で書いてくれる
                  </p>
                </div>
              </div>
              <ArrowDown className="h-4 w-4 text-purple-300" />
              <div className="flex items-center gap-3 rounded-xl border-2 border-gray-200 bg-gray-50 px-4 py-3">
                <Github className="h-6 w-6 text-gray-900" />
                <div>
                  <p className="text-sm font-bold text-gray-800">GitHub</p>
                  <p className="text-xs text-gray-500">
                    コードを安全に保管・チームで共有
                  </p>
                </div>
              </div>
              <ArrowDown className="h-4 w-4 text-purple-300" />
              <div className="flex items-center gap-3 rounded-xl border-2 border-blue-200 bg-blue-50 px-4 py-3">
                <Container className="h-6 w-6 text-blue-600" />
                <div>
                  <p className="text-sm font-bold text-gray-800">Docker</p>
                  <p className="text-xs text-gray-500">
                    アプリを箱詰めしてサーバーに公開
                  </p>
                </div>
              </div>
              <ArrowDown className="h-4 w-4 text-purple-300" />
              <div className="flex items-center gap-3 rounded-xl border bg-green-50 px-4 py-3 shadow-sm">
                <Globe className="h-6 w-6 text-green-600" />
                <div>
                  <p className="text-sm font-bold text-gray-800">
                    世界に公開!
                  </p>
                  <p className="text-xs text-gray-500">
                    誰でもアクセスできるように
                  </p>
                </div>
              </div>
            </div>

            {/* Summary sentence */}
            <p className="mt-5 text-center text-xs leading-relaxed text-gray-500">
              <Lightbulb className="mr-1 inline h-3.5 w-3.5 text-amber-500" />
              日本語で伝えるだけ → AIがコードを作成 → 自動で保管 →
              ボタンひとつで世界に公開
            </p>
          </div>

          {/* Tool detail cards */}
          <div className="space-y-5">
            {setupTools.map((tool, i) => {
              const Icon = tool.icon
              return (
                <div
                  key={tool.name}
                  className={`rounded-2xl border-2 ${tool.borderColor} ${tool.bgColor} p-6`}
                >
                  <div className="mb-4 flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
                      <Icon className={`h-6 w-6 ${tool.color}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-gray-500 shadow-sm">
                          STEP {i + 1}
                        </span>
                        <h3 className="text-xl font-extrabold text-gray-900">
                          {tool.name}
                        </h3>
                      </div>
                      <p className="mt-0.5 text-sm font-semibold text-gray-500">
                        {tool.tagline}
                      </p>
                    </div>
                  </div>

                  {/* Analogy callout */}
                  <div className="mb-4 rounded-lg bg-white/70 px-4 py-2.5">
                    <p className="text-sm text-gray-700">
                      <span className="font-bold text-gray-900">
                        かんたんに言うと：
                      </span>
                      {tool.analogy}
                    </p>
                  </div>

                  <p className="mb-4 text-sm leading-relaxed text-gray-700">
                    {tool.description}
                  </p>

                  {/* Reasons */}
                  <div>
                    <p className="mb-2 text-xs font-bold text-gray-600">
                      <Rocket className="mr-1 inline h-3.5 w-3.5" />
                      おすすめの理由
                    </p>
                    <ul className="grid gap-1.5 sm:grid-cols-2">
                      {tool.reasons.map((reason) => (
                        <li
                          key={reason}
                          className="flex items-start gap-2 text-sm text-gray-700"
                        >
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                          <span>{reason}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Why this combination */}
          <div className="mt-6 rounded-2xl border-2 border-purple-200 bg-purple-50 p-6">
            <h3 className="mb-3 flex items-center gap-2 text-base font-bold text-gray-900">
              <Users className="h-5 w-5 text-purple-600" />
              3つを組み合わせるとここがすごい
            </h3>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl bg-white p-4 text-center shadow-sm">
                <MessageSquare className="mx-auto mb-2 h-6 w-6 text-purple-500" />
                <p className="text-sm font-bold text-gray-900">
                  コードを書けなくてもOK
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Claude
                  Codeに日本語で伝えるだけ。プログラミング言語を覚えなくても始められます
                </p>
              </div>
              <div className="rounded-xl bg-white p-4 text-center shadow-sm">
                <Shield className="mx-auto mb-2 h-6 w-6 text-purple-500" />
                <p className="text-sm font-bold text-gray-900">
                  失敗しても安心
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  GitHubに全ての履歴が残るので、いつでもやり直しできます。怖がらずに試行錯誤できます
                </p>
              </div>
              <div className="rounded-xl bg-white p-4 text-center shadow-sm">
                <Globe className="mx-auto mb-2 h-6 w-6 text-purple-500" />
                <p className="text-sm font-bold text-gray-900">
                  すぐに公開できる
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Dockerのおかげで、作ったアプリを誰でもアクセスできる形で簡単に公開できます
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Tips */}
        <section className="mb-10 rounded-xl border-2 border-green-200 bg-green-50 p-6">
          <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-gray-900">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            初心者へのアドバイス
          </h2>
          <ul className="space-y-2 text-sm leading-relaxed text-gray-700">
            <li>
              ・
              <span className="font-semibold">
                まずは commit → push の流れだけ
              </span>
              覚えれば十分です
            </li>
            <li>
              ・
              <span className="font-semibold">
                こまめにコミット
              </span>
              するのがコツ。1つの変更ごとにセーブしましょう
            </li>
            <li>
              ・
              <span className="font-semibold">
                コミットメッセージ
              </span>
              は「何をしたか」を短く書く（例：「ヘッダーの色を変更」）
            </li>
            <li>
              ・ 失敗しても大丈夫！Gitはいつでも
              <span className="font-semibold">過去の状態に戻せます</span>
            </li>
            <li>
              ・ 困ったら{" "}
              <code className="rounded bg-gray-200 px-1.5 py-0.5 text-xs">
                git status
              </code>{" "}
              で現在の状態を確認しましょう
            </li>
          </ul>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t bg-gray-50 py-6 text-center text-xs text-gray-400">
        Git用語ガイド — 初心者向けかんたん解説
      </footer>
    </div>
  )
}
