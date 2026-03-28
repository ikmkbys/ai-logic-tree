import { TreeNode, NodePosition, LayoutResult } from "./types";

export const NODE_W = 220;
export const NODE_H = 64;
export const H_GAP = 80;   // horizontal gap between levels
export const V_GAP = 20;   // vertical gap between siblings

/** Returns the number of visible leaf slots under this node */
function subtreeSpan(
  nodeId: string,
  nodes: Record<string, TreeNode>
): number {
  const node = nodes[nodeId];
  if (!node) return 1;
  if (node.isCollapsed || node.children.length === 0) return 1;
  return node.children.reduce(
    (sum, cid) => sum + subtreeSpan(cid, nodes),
    0
  );
}

/** Build positions for all visible nodes */
export function layoutTree(
  rootId: string,
  nodes: Record<string, TreeNode>
): LayoutResult {
  const positions: Record<string, NodePosition> = {};
  const unit = NODE_H + V_GAP;

  function place(nodeId: string, depth: number, startSlot: number): void {
    const node = nodes[nodeId];
    if (!node) return;

    const span = subtreeSpan(nodeId, nodes);
    const centerSlot = startSlot + span / 2;

    positions[nodeId] = {
      x: depth * (NODE_W + H_GAP),
      y: centerSlot * unit - NODE_H / 2,
      width: NODE_W,
      height: NODE_H,
    };

    if (!node.isCollapsed) {
      let slot = startSlot;
      for (const childId of node.children) {
        place(childId, depth + 1, slot);
        slot += subtreeSpan(childId, nodes);
      }
    }
  }

  place(rootId, 0, 0);

  const xs = Object.values(positions).map((p) => p.x + p.width);
  const ys = Object.values(positions).map((p) => p.y + p.height);

  return {
    positions,
    totalWidth: xs.length ? Math.max(...xs) + H_GAP : NODE_W,
    totalHeight: ys.length ? Math.max(...ys) + V_GAP : NODE_H,
  };
}

/** Build the SVG bezier path from parent right-center to child left-center */
export function edgePath(
  from: NodePosition,
  to: NodePosition
): string {
  const x1 = from.x + from.width;
  const y1 = from.y + from.height / 2;
  const x2 = to.x;
  const y2 = to.y + to.height / 2;
  const cx = (x1 + x2) / 2;
  return `M ${x1} ${y1} C ${cx} ${y1}, ${cx} ${y2}, ${x2} ${y2}`;
}

/** Get ancestors path (titles) from root to given node (exclusive) */
export function getAncestorPath(
  nodeId: string,
  nodes: Record<string, TreeNode>
): string[] {
  const path: string[] = [];
  let current = nodes[nodeId];
  while (current?.parentId) {
    current = nodes[current.parentId];
    if (current) path.unshift(current.title);
  }
  return path;
}
