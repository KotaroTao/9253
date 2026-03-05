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
  BookOpen,
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
