"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toPng } from "html-to-image";
import {
  ArrowLeft,
  Download,
  RotateCcw,
  RotateCw,
  TreePine,
  Pencil,
  Check,
} from "lucide-react";
import { Tree } from "@/lib/types";
import { loadTree, saveTree } from "@/lib/storage";
import TreeCanvas from "@/components/tree/TreeCanvas";

export default function TreePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [tree, setTree] = useState<Tree | null>(null);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");
  const [exporting, setExporting] = useState(false);
  const canvasWrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = loadTree(id);
    if (!t) {
      router.push("/");
      return;
    }
    setTree(t);
    setTitleDraft(t.title);
  }, [id, router]);

  function handleTitleCommit() {
    if (!tree) return;
    const title = titleDraft.trim() || tree.title;
    const updated = { ...tree, title, updatedAt: Date.now() };
    setTree(updated);
    saveTree(updated);
    setEditingTitle(false);
  }

  async function handleExport() {
    if (!canvasWrapRef.current) return;
    setExporting(true);
    try {
      const inner = canvasWrapRef.current.querySelector(".relative") as HTMLElement;
      if (!inner) return;
      const dataUrl = await toPng(inner, {
        backgroundColor: "#F5F0E3",
        pixelRatio: 2,
      });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `logic_tree_${new Date().toISOString().slice(0, 10)}.png`;
      a.click();
    } catch {
      alert("エクスポートに失敗しました");
    } finally {
      setExporting(false);
    }
  }

  if (!tree) {
    return (
      <div className="min-h-screen dot-grid flex items-center justify-center">
        <div className="text-ink-muted text-sm">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col dot-grid overflow-hidden">
      {/* Toolbar */}
      <header className="flex-shrink-0 h-14 bg-paper/90 backdrop-blur-sm border-b border-ink-faint flex items-center px-4 gap-3 z-20">
        {/* Back */}
        <button
          onClick={() => router.push("/")}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-ink-muted hover:bg-paper-dark hover:text-ink transition"
        >
          <ArrowLeft size={16} />
        </button>

        <div className="w-px h-5 bg-ink-faint mx-1" />

        {/* Title */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <TreePine size={16} className="text-ink-muted flex-shrink-0" />
          {editingTitle ? (
            <input
              autoFocus
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              onBlur={handleTitleCommit}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleTitleCommit();
                if (e.key === "Escape") setEditingTitle(false);
              }}
              className="flex-1 min-w-0 text-sm font-semibold text-ink bg-transparent outline-none border-b border-yellow-roll"
            />
          ) : (
            <span
              className="text-sm font-semibold text-ink truncate cursor-default"
              onDoubleClick={() => setEditingTitle(true)}
            >
              {tree.title}
            </span>
          )}
          {editingTitle ? (
            <button
              onClick={handleTitleCommit}
              className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-md bg-yellow-roll text-ink hover:bg-yellow-400 transition"
            >
              <Check size={12} />
            </button>
          ) : (
            <button
              onClick={() => setEditingTitle(true)}
              className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-md text-ink-muted hover:bg-paper-dark hover:text-ink transition opacity-0 group-hover:opacity-100"
            >
              <Pencil size={12} />
            </button>
          )}
        </div>

        <div className="w-px h-5 bg-ink-faint mx-1" />

        {/* Shortcuts hint */}
        <span className="text-[11px] text-ink-muted hidden sm:block">
          ダブルクリックで編集 · ⌘Z で元に戻す
        </span>

        <div className="w-px h-5 bg-ink-faint mx-1 hidden sm:block" />

        {/* Export */}
        <button
          onClick={handleExport}
          disabled={exporting}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-ink text-paper text-xs font-medium rounded-full hover:bg-ink-soft transition disabled:opacity-50"
        >
          <Download size={12} />
          {exporting ? "..." : "PNG"}
        </button>
      </header>

      {/* Canvas */}
      <div ref={canvasWrapRef} className="flex-1 overflow-auto">
        <TreeCanvas
          tree={tree}
          onTreeChange={(updated) => setTree(updated)}
        />
      </div>

      {/* Bottom hint */}
      <div className="flex-shrink-0 h-8 bg-paper/80 border-t border-ink-faint flex items-center justify-center">
        <span className="text-[11px] text-ink-muted">
          ノードにホバーして <kbd className="px-1 py-0.5 rounded bg-paper-dark text-ink-soft text-[10px]">+</kbd> 追加 ·{" "}
          <kbd className="px-1 py-0.5 rounded bg-yellow-light text-yellow-700 text-[10px]">✦</kbd> AIで展開
        </span>
      </div>
    </div>
  );
}
