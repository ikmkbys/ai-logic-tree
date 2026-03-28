"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { v4 as uuidv4 } from "uuid";
import { Tree, TreeNode, HistoryEntry } from "@/lib/types";
import {
  layoutTree,
  edgePath,
  getAncestorPath,
  NODE_W,
  NODE_H,
} from "@/lib/tree-layout";
import { saveTree } from "@/lib/storage";
import TreeNodeComponent from "./TreeNode";

interface Props {
  tree: Tree;
  onTreeChange: (tree: Tree) => void;
}

const PADDING = 80;
const MAX_HISTORY = 50;

export default function TreeCanvas({ tree, onTreeChange }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [aiLoadingId, setAiLoadingId] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([{ nodes: tree.nodes }]);
  const [historyIdx, setHistoryIdx] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Push a new history entry
  const pushHistory = useCallback(
    (nodes: Record<string, TreeNode>) => {
      setHistory((prev) => {
        const sliced = prev.slice(0, historyIdx + 1);
        const next = [...sliced, { nodes }].slice(-MAX_HISTORY);
        setHistoryIdx(next.length - 1);
        return next;
      });
    },
    [historyIdx]
  );

  function update(nodes: Record<string, TreeNode>) {
    const updated: Tree = { ...tree, nodes, updatedAt: Date.now() };
    onTreeChange(updated);
    saveTree(updated);
    pushHistory(nodes);
  }

  // Undo / Redo
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      const isUndo = (e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey;
      const isRedo = (e.ctrlKey || e.metaKey) && (e.key === "y" || (e.key === "z" && e.shiftKey));

      if (isUndo && historyIdx > 0) {
        const newIdx = historyIdx - 1;
        const nodes = history[newIdx].nodes;
        setHistoryIdx(newIdx);
        const updated: Tree = { ...tree, nodes, updatedAt: Date.now() };
        onTreeChange(updated);
        saveTree(updated);
        e.preventDefault();
      }
      if (isRedo && historyIdx < history.length - 1) {
        const newIdx = historyIdx + 1;
        const nodes = history[newIdx].nodes;
        setHistoryIdx(newIdx);
        const updated: Tree = { ...tree, nodes, updatedAt: Date.now() };
        onTreeChange(updated);
        saveTree(updated);
        e.preventDefault();
      }
    }
    window.addEventListener("keydown", handleKey, { capture: true });
    return () => window.removeEventListener("keydown", handleKey, { capture: true });
  }, [history, historyIdx, tree, onTreeChange]);

  function addChild(parentId: string) {
    const newNode: TreeNode = {
      id: uuidv4(),
      title: "新しいノード",
      children: [],
      parentId,
      createdAt: Date.now(),
    };
    const parent = tree.nodes[parentId];
    const nodes = {
      ...tree.nodes,
      [parentId]: { ...parent, children: [...parent.children, newNode.id] },
      [newNode.id]: newNode,
    };
    update(nodes);
    setSelectedId(newNode.id);
  }

  function deleteNode(nodeId: string) {
    if (nodeId === tree.rootId) return;

    // Collect all descendants
    function collectDescendants(id: string): string[] {
      const node = tree.nodes[id];
      if (!node) return [];
      return [id, ...node.children.flatMap(collectDescendants)];
    }
    const toDelete = new Set(collectDescendants(nodeId));

    const parent = tree.nodes[tree.nodes[nodeId].parentId!];
    const nodes = Object.fromEntries(
      Object.entries(tree.nodes)
        .filter(([id]) => !toDelete.has(id))
        .map(([id, n]) => [
          id,
          id === parent.id
            ? { ...n, children: n.children.filter((c) => c !== nodeId) }
            : n,
        ])
    );
    if (selectedId && toDelete.has(selectedId)) setSelectedId(null);
    update(nodes);
  }

  function updateTitle(nodeId: string, title: string) {
    const nodes = {
      ...tree.nodes,
      [nodeId]: { ...tree.nodes[nodeId], title },
    };
    update(nodes);
  }

  function toggleCollapse(nodeId: string) {
    const node = tree.nodes[nodeId];
    const nodes = {
      ...tree.nodes,
      [nodeId]: { ...node, isCollapsed: !node.isCollapsed },
    };
    update(nodes);
  }

  async function aiExpand(nodeId: string) {
    const node = tree.nodes[nodeId];
    if (!node) return;

    setAiLoadingId(nodeId);
    try {
      const ancestorPath = getAncestorPath(nodeId, tree.nodes);
      const existingChildren = node.children.map((c) => tree.nodes[c]?.title ?? "");

      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nodeTitle: node.title,
          ancestorPath,
          existingChildren,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error ?? "AI生成に失敗しました");
        return;
      }

      const suggestions: string[] = data.suggestions ?? [];
      const now = Date.now();
      const newNodes: Record<string, TreeNode> = {};
      const newChildIds: string[] = [];

      for (const title of suggestions) {
        const id = uuidv4();
        newNodes[id] = {
          id,
          title,
          children: [],
          parentId: nodeId,
          isAiGenerated: true,
          createdAt: now,
        };
        newChildIds.push(id);
      }

      const nodes = {
        ...tree.nodes,
        ...newNodes,
        [nodeId]: {
          ...node,
          children: [...node.children, ...newChildIds],
          isCollapsed: false,
        },
      };
      update(nodes);
    } catch {
      alert("ネットワークエラーが発生しました");
    } finally {
      setAiLoadingId(null);
    }
  }

  const { positions, totalWidth, totalHeight } = layoutTree(tree.rootId, tree.nodes);
  const canvasW = totalWidth + PADDING * 2;
  const canvasH = totalHeight + PADDING * 2;

  // Build visible node IDs (traverse visible tree)
  function collectVisible(nodeId: string): string[] {
    const node = tree.nodes[nodeId];
    if (!node) return [];
    if (node.isCollapsed) return [nodeId];
    return [nodeId, ...node.children.flatMap(collectVisible)];
  }
  const visibleIds = collectVisible(tree.rootId);

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-auto"
      onClick={() => setSelectedId(null)}
    >
      <div
        className="relative"
        style={{ width: canvasW, height: canvasH, minWidth: "100%", minHeight: "100%" }}
      >
        {/* SVG edges */}
        <svg
          className="absolute inset-0 pointer-events-none"
          style={{ width: canvasW, height: canvasH }}
        >
          {visibleIds.map((nodeId) => {
            const node = tree.nodes[nodeId];
            if (!node || node.isCollapsed) return null;
            return node.children
              .filter((cid) => visibleIds.includes(cid))
              .map((childId) => {
                const from = positions[nodeId];
                const to = positions[childId];
                if (!from || !to) return null;
                const fromOffset = { ...from, x: from.x + PADDING, y: from.y + PADDING };
                const toOffset = { ...to, x: to.x + PADDING, y: to.y + PADDING };
                return (
                  <path
                    key={`${nodeId}-${childId}`}
                    d={edgePath(fromOffset, toOffset)}
                    fill="none"
                    stroke="#C8B898"
                    strokeWidth={1.5}
                    strokeLinecap="round"
                    opacity={0.7}
                  />
                );
              });
          })}
        </svg>

        {/* Nodes */}
        <AnimatePresence>
          {visibleIds.map((nodeId) => {
            const pos = positions[nodeId];
            if (!pos) return null;
            const node = tree.nodes[nodeId];
            return (
              <TreeNodeComponent
                key={nodeId}
                node={node}
                x={pos.x + PADDING}
                y={pos.y + PADDING}
                isRoot={nodeId === tree.rootId}
                isSelected={selectedId === nodeId}
                isAiLoading={aiLoadingId === nodeId}
                onClick={() => setSelectedId(nodeId)}
                onTitleChange={(title) => updateTitle(nodeId, title)}
                onAddChild={() => addChild(nodeId)}
                onAiExpand={() => aiExpand(nodeId)}
                onDelete={() => deleteNode(nodeId)}
                onToggleCollapse={() => toggleCollapse(nodeId)}
              />
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
