export interface TreeNode {
  id: string;
  title: string;
  children: string[];
  parentId: string | null;
  isAiGenerated?: boolean;
  isCollapsed?: boolean;
  createdAt: number;
}

export interface Tree {
  id: string;
  title: string;
  rootId: string;
  nodes: Record<string, TreeNode>;
  createdAt: number;
  updatedAt: number;
}

export interface NodePosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface LayoutResult {
  positions: Record<string, NodePosition>;
  totalWidth: number;
  totalHeight: number;
}

export interface GenerateRequest {
  nodeTitle: string;
  ancestorPath: string[];
  existingChildren: string[];
}

export interface GenerateResponse {
  suggestions: string[];
}

// History entry for undo/redo
export interface HistoryEntry {
  nodes: Record<string, TreeNode>;
}
