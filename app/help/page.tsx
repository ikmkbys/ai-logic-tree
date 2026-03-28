"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, TreePine, Sparkles, FileDown, Upload } from "lucide-react";

function MiniNode({ label, isRoot = false, isAi = false }: { label: string; isRoot?: boolean; isAi?: boolean }) {
  return (
    <div className={`relative inline-flex items-center px-3 py-1.5 rounded-node text-xs font-medium border shadow-node
      ${isRoot ? "bg-card border-yellow-roll shadow-node-selected" : "bg-card border-ink-faint"}
    `}>
      {isAi && (
        <span className="absolute -top-1 -right-1 text-[8px] font-bold text-yellow-600 bg-yellow-faint border border-yellow-roll rounded-full px-1">
          AI
        </span>
      )}
      {label}
    </div>
  );
}

function TreeDiagram({ root, children }: { root: string; children: string[] }) {
  return (
    <div className="flex items-center gap-4 py-2">
      <MiniNode label={root} isRoot />
      <div className="flex flex-col gap-1.5 relative">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-4 border-t border-ink-faint" />
        {children.map((child, i) => (
          <div key={i} className="flex items-center gap-0">
            <div className="w-5 border-t border-ink-faint" />
            <MiniNode label={child} isAi />
          </div>
        ))}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-12">
      <h2 className="text-lg font-bold text-ink mb-4 pb-2 border-b border-ink-faint">{title}</h2>
      {children}
    </section>
  );
}

export default function HelpPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen dot-grid">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-paper/90 backdrop-blur-sm border-b border-ink-faint">
        <div className="max-w-2xl mx-auto px-6 h-14 flex items-center gap-3">
          <button
            onClick={() => router.push("/")}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-ink-muted hover:bg-paper-dark hover:text-ink transition"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="flex items-center gap-2">
            <TreePine size={16} className="text-ink-soft" />
            <span className="text-sm font-semibold text-ink">使い方ガイド</span>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-10">

        {/* Hero */}
        <div className="mb-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-yellow-faint border-2 border-yellow-roll flex items-center justify-center mx-auto mb-4">
            <TreePine size={28} className="text-yellow-600" />
          </div>
          <h1 className="text-2xl font-bold text-ink mb-2">AI Logic Tree</h1>
          <p className="text-sm text-ink-muted">AIと一緒に、思考を構造化する</p>
        </div>

        {/* ロジックツリーとは */}
        <Section title="ロジックツリーとは？">
          <p className="text-sm text-ink-soft leading-relaxed mb-5">
            ロジックツリー（Logic Tree）は、複雑な問題を構成要素に分解し、木（ツリー）のような階層構造で可視化する思考ツールです。
            大きな問題を小さな問題に切り分けることで、原因の特定や解決策の立案を論理的に行うことができます。
          </p>
          <div className="bg-card rounded-2xl border border-ink-faint p-5">
            <TreeDiagram
              root="大きな問題"
              children={["要素 A", "要素 B", "要素 C"]}
            />
          </div>
        </Section>

        {/* MECE */}
        <Section title="重要なルール：MECE（ミッシー）">
          <div className="bg-yellow-faint border border-yellow-roll rounded-2xl p-5 mb-5">
            <p className="text-xs font-mono text-ink-soft mb-1">Mutually Exclusive, Collectively Exhaustive</p>
            <p className="text-xl font-bold text-ink">「モレなく、ダブりなく」</p>
          </div>
          <p className="text-sm text-ink-soft leading-relaxed mb-4">
            例えば「人間」を分解するとき、「男性」と「女性」ならMECEです。
            しかし「男性」と「会社員」だと、会社員の男性がダブり、会社員でない女性がモレてしまいます。
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-card rounded-xl border border-green-200 p-4">
              <p className="text-xs font-semibold text-green-700 mb-3">✅ MECE</p>
              <TreeDiagram root="人間" children={["男性", "女性"]} />
            </div>
            <div className="bg-card rounded-xl border border-red-200 p-4">
              <p className="text-xs font-semibold text-red-500 mb-3">❌ 非MECE</p>
              <TreeDiagram root="人間" children={["男性", "会社員"]} />
            </div>
          </div>
          <p className="text-xs text-ink-muted mt-3 text-center">
            AI Logic Tree では、AIがMECEを意識した分解案を提案してくれます
          </p>
        </Section>

        {/* 使い方 */}
        <Section title="主な使い方">
          <div className="space-y-4">
            <div className="bg-card rounded-2xl border border-ink-faint p-5">
              <p className="text-xs font-semibold text-ink-muted uppercase tracking-wider mb-1">Why ツリー</p>
              <h3 className="text-sm font-bold text-ink mb-2">原因の追求</h3>
              <p className="text-xs text-ink-soft mb-4">「なぜ？」を繰り返して、問題の真因を突き止めます。</p>
              <TreeDiagram
                root="売上が低下"
                children={["客数が減った", "単価が下がった"]}
              />
            </div>
            <div className="bg-card rounded-2xl border border-ink-faint p-5">
              <p className="text-xs font-semibold text-ink-muted uppercase tracking-wider mb-1">How ツリー</p>
              <h3 className="text-sm font-bold text-ink mb-2">解決策の立案</h3>
              <p className="text-xs text-ink-soft mb-4">「どうやって？」を繰り返して、具体的なアクションを導き出します。</p>
              <TreeDiagram
                root="客数を増やす"
                children={["広告を打つ", "リピート改善"]}
              />
            </div>
          </div>
        </Section>

        {/* AI機能 */}
        <Section title="AIで思考を加速する">
          <p className="text-sm text-ink-soft leading-relaxed mb-5">
            一人で考えていると、視点が偏ったりアイデアが尽きたりしがちです。
            このアプリでは <strong className="text-ink">Google Gemini AI</strong> があなたの壁打ち相手になります。
          </p>
          <div className="space-y-3">
            {[
              "自分では思いつかなかった切り口をAIが提案",
              "客観的な視点でMECEな分解をサポート",
              "思考の行き詰まり（Writer's Block）を解消",
            ].map((text, i) => (
              <div key={i} className="flex items-start gap-3 bg-card rounded-xl border border-ink-faint px-4 py-3">
                <Sparkles size={14} className="text-yellow-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-ink-soft">{text}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-ink-muted mt-3 text-center">
            ノードにホバーして <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-yellow-light text-yellow-700 rounded-md text-[10px] font-medium">✦ AI</span> ボタンを押すだけ
          </p>
        </Section>

        {/* その他の機能 */}
        <Section title="その他の機能">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-card rounded-xl border border-ink-faint p-4">
              <div className="flex items-center gap-2 mb-2">
                <FileDown size={14} className="text-ink-soft" />
                <p className="text-sm font-semibold text-ink">CSVエクスポート</p>
              </div>
              <p className="text-xs text-ink-muted">ツリーをCSVとしてダウンロード。Excelでも開けます。別のツリーとしてインポートも可能。</p>
            </div>
            <div className="bg-card rounded-xl border border-ink-faint p-4">
              <div className="flex items-center gap-2 mb-2">
                <Upload size={14} className="text-ink-soft" />
                <p className="text-sm font-semibold text-ink">CSVインポート</p>
              </div>
              <p className="text-xs text-ink-muted">ホーム画面から「インポート」でCSVファイルを読み込み、ツリーを復元できます。</p>
            </div>
          </div>
          <div className="mt-3 bg-card rounded-xl border border-ink-faint p-4">
            <p className="text-sm font-semibold text-ink mb-1">PNG エクスポート</p>
            <p className="text-xs text-ink-muted">ツリーを画像として保存。資料への貼り付けやチームへの共有に便利です。</p>
          </div>
          <div className="mt-3 bg-card rounded-xl border border-ink-faint p-4">
            <p className="text-sm font-semibold text-ink mb-2">キーボードショートカット</p>
            <div className="space-y-1.5">
              {[
                ["ダブルクリック", "ノード名を編集"],
                ["⌘Z / Ctrl+Z", "元に戻す（最大50ステップ）"],
                ["⌘⇧Z / Ctrl+Shift+Z", "やり直し"],
              ].map(([key, desc]) => (
                <div key={key} className="flex items-center justify-between">
                  <kbd className="text-[10px] bg-paper-dark text-ink-soft px-2 py-0.5 rounded font-mono">{key}</kbd>
                  <span className="text-xs text-ink-muted">{desc}</span>
                </div>
              ))}
            </div>
          </div>
        </Section>

        {/* CTA */}
        <div className="text-center pb-8">
          <button
            onClick={() => router.push("/")}
            className="inline-flex items-center gap-2 px-6 py-3 bg-yellow-roll text-ink text-sm font-semibold rounded-full hover:bg-yellow-400 transition shadow-sm"
          >
            <TreePine size={16} />
            さっそく使ってみる
          </button>
        </div>

      </main>
    </div>
  );
}
