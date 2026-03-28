"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, TreePine, Trash2, ChevronRight, Upload } from "lucide-react";
import { Tree, TreeNode } from "@/lib/types";
import { loadTrees, createTree, deleteTree, saveTree } from "@/lib/storage";
import { v4 as uuidv4 } from "uuid";

function parseCSVRow(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuote) {
      if (ch === '"' && line[i + 1] === '"') { current += '"'; i++; }  // エスケープ済みダブルクォート
      else if (ch === '"') { inQuote = false; }
      else { current += ch; }
    } else {
      if (ch === '"') { inQuote = true; }
      else if (ch === ',') { result.push(current); current = ""; }
      else { current += ch; }
    }
  }
  result.push(current);
  return result;
}

export default function HomePage() {
  const router = useRouter();
  const [trees, setTrees] = useState<Tree[]>([]);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const importRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTrees(loadTrees());
  }, []);

  function handleCreate() {
    const title = newTitle.trim() || "新しいロジックツリー";
    const tree = createTree(title);
    setNewTitle("");
    setCreating(false);
    router.push(`/tree/${tree.id}`);
  }

  function handleDelete(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm("このツリーを削除しますか？")) return;
    deleteTree(id);
    setTrees((prev) => prev.filter((t) => t.id !== id));
  }

  function handleImportCsv(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";  // 同じファイルを再選択できるようリセット
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const text = (ev.target?.result as string).replace(/^\uFEFF/, "");  // BOM除去
        const lines = text.trim().split(/\r?\n/);
        if (lines.length < 2) throw new Error("データが空です");

        const nodes: Record<string, TreeNode> = {};
        let rootId = "";

        for (let i = 1; i < lines.length; i++) {
          if (!lines[i].trim()) continue;
          const [id, title, parentId, isAiGenerated] = parseCSVRow(lines[i]);
          if (!id || !title) continue;
          nodes[id] = {
            id,
            title,
            children: [],
            parentId: parentId || null,
            isAiGenerated: isAiGenerated === "true",
            createdAt: Date.now(),
          };
          if (!parentId) rootId = id;
        }

        if (!rootId || !nodes[rootId]) throw new Error("ルートノードが見つかりません");

        // childrenを再構築
        for (const node of Object.values(nodes)) {
          if (node.parentId && nodes[node.parentId]) {
            nodes[node.parentId].children.push(node.id);
          }
        }

        const tree: Tree = {
          id: uuidv4(),
          title: nodes[rootId].title,
          rootId,
          nodes,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        saveTree(tree);
        router.push(`/tree/${tree.id}`);
      } catch (err) {
        alert(`インポートに失敗しました: ${err instanceof Error ? err.message : "CSVの形式を確認してください"}`);
      }
    };
    reader.readAsText(file);
  }

  function nodeCount(tree: Tree) {
    return Object.keys(tree.nodes).length;
  }

  function formatDate(ts: number) {
    return new Date(ts).toLocaleDateString("ja-JP", {
      month: "short",
      day: "numeric",
    });
  }

  return (
    <div className="min-h-screen dot-grid">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-paper/90 backdrop-blur-sm border-b border-ink-faint">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TreePine size={20} className="text-ink-soft" />
            <span className="text-base font-semibold tracking-tight text-ink">
              AI Logic Tree
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push("/help")}
              className="w-8 h-8 flex items-center justify-center rounded-full border border-ink-faint text-ink-muted hover:bg-paper-dark hover:text-ink transition text-sm font-semibold"
              title="使い方"
            >
              ?
            </button>
            <input
              ref={importRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleImportCsv}
            />
            <button
              onClick={() => importRef.current?.click()}
              className="flex items-center gap-1.5 px-4 py-1.5 border border-ink-faint text-ink text-sm font-medium rounded-full hover:bg-paper-dark transition-colors"
            >
              <Upload size={14} />
              インポート
            </button>
            <button
              onClick={() => setCreating(true)}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-ink text-paper text-sm font-medium rounded-full hover:bg-ink-soft transition-colors"
            >
              <Plus size={14} />
              新規ツリー
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10">
        {/* Create modal */}
        <AnimatePresence>
          {creating && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 backdrop-blur-sm"
              onClick={() => setCreating(false)}
            >
              <motion.div
                initial={{ scale: 0.94, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.94, opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="bg-card rounded-2xl shadow-2xl p-8 w-full max-w-sm mx-4"
                onClick={(e) => e.stopPropagation()}
              >
                <h2 className="text-lg font-semibold text-ink mb-1">新しいツリーを作成</h2>
                <p className="text-sm text-ink-muted mb-5">
                  ルートノードのタイトルを入力してください
                </p>
                <input
                  autoFocus
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                  placeholder="例: 売上を2倍にするには？"
                  className="w-full px-4 py-3 rounded-xl border border-ink-faint bg-paper text-ink text-sm outline-none focus:border-yellow-roll focus:ring-2 focus:ring-yellow-light transition"
                />
                <div className="flex gap-3 mt-5">
                  <button
                    onClick={() => setCreating(false)}
                    className="flex-1 py-2.5 rounded-xl border border-ink-faint text-sm text-ink-soft hover:bg-paper-dark transition"
                  >
                    キャンセル
                  </button>
                  <button
                    onClick={handleCreate}
                    className="flex-1 py-2.5 rounded-xl bg-ink text-paper text-sm font-medium hover:bg-ink-soft transition"
                  >
                    作成
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {trees.length === 0 ? (
          /* Empty state */
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-32 text-center"
          >
            <div className="w-20 h-20 rounded-2xl bg-yellow-faint border-2 border-dashed border-yellow-roll flex items-center justify-center mb-6">
              <TreePine size={32} className="text-yellow-600" />
            </div>
            <h2 className="text-xl font-semibold text-ink mb-2">
              まだツリーがありません
            </h2>
            <p className="text-sm text-ink-muted mb-8 max-w-xs">
              「新規ツリー」をクリックして、問題分解・思考整理を始めましょう
            </p>
            <button
              onClick={() => setCreating(true)}
              className="flex items-center gap-2 px-6 py-3 bg-yellow-roll text-ink text-sm font-semibold rounded-full hover:bg-yellow-400 transition shadow-sm"
            >
              <Plus size={16} />
              最初のツリーを作成
            </button>
          </motion.div>
        ) : (
          <div>
            <p className="text-xs font-medium text-ink-muted uppercase tracking-wider mb-4">
              {trees.length} 件のツリー
            </p>
            <div className="grid gap-3">
              <AnimatePresence>
                {trees.map((tree, i) => (
                  <motion.div
                    key={tree.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -16 }}
                    transition={{ delay: i * 0.04 }}
                    onClick={() => router.push(`/tree/${tree.id}`)}
                    className="group flex items-center gap-4 bg-card border border-ink-faint rounded-2xl px-6 py-4 cursor-pointer hover:border-ink-muted hover:shadow-node transition-all duration-150"
                  >
                    {/* Icon */}
                    <div className="w-10 h-10 rounded-xl bg-yellow-faint flex items-center justify-center flex-shrink-0 group-hover:bg-yellow-light transition">
                      <TreePine size={18} className="text-yellow-600" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-ink text-sm truncate">
                        {tree.title}
                      </p>
                      <p className="text-xs text-ink-muted mt-0.5">
                        {nodeCount(tree)} ノード · {formatDate(tree.updatedAt)}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={(e) => handleDelete(tree.id, e)}
                        className="opacity-0 group-hover:opacity-100 w-7 h-7 flex items-center justify-center rounded-lg text-ink-muted hover:text-red-500 hover:bg-red-50 transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                      <ChevronRight size={16} className="text-ink-faint group-hover:text-ink-muted transition" />
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
