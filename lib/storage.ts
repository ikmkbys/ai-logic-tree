import { Tree, TreeNode } from "./types";
import { v4 as uuidv4 } from "uuid";

const STORAGE_KEY = "ai-logic-tree:trees";

export function loadTrees(): Tree[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Tree[];
  } catch {
    return [];
  }
}

export function saveTree(tree: Tree): void {
  if (typeof window === "undefined") return;
  const trees = loadTrees();
  const idx = trees.findIndex((t) => t.id === tree.id);
  if (idx >= 0) {
    trees[idx] = tree;
  } else {
    trees.unshift(tree);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trees));
}

export function loadTree(id: string): Tree | null {
  const trees = loadTrees();
  return trees.find((t) => t.id === id) ?? null;
}

export function deleteTree(id: string): void {
  if (typeof window === "undefined") return;
  const trees = loadTrees().filter((t) => t.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trees));
}

export function createTree(title: string): Tree {
  const rootId = uuidv4();
  const now = Date.now();
  const root: TreeNode = {
    id: rootId,
    title,
    children: [],
    parentId: null,
    createdAt: now,
  };
  const tree: Tree = {
    id: uuidv4(),
    title,
    rootId,
    nodes: { [rootId]: root },
    createdAt: now,
    updatedAt: now,
  };
  saveTree(tree);
  return tree;
}
