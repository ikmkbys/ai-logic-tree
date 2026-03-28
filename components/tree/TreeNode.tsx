"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Sparkles, Trash2, ChevronRight, ChevronDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { TreeNode as TreeNodeType } from "@/lib/types";
import { NODE_W, NODE_H } from "@/lib/tree-layout";

interface Props {
  node: TreeNodeType;
  x: number;
  y: number;
  isRoot: boolean;
  isSelected: boolean;
  isAiLoading: boolean;
  onClick: () => void;
  onTitleChange: (title: string) => void;
  onAddChild: () => void;
  onAiExpand: () => void;
  onDelete: () => void;
  onToggleCollapse: () => void;
}

export default function TreeNode({
  node,
  x,
  y,
  isRoot,
  isSelected,
  isAiLoading,
  onClick,
  onTitleChange,
  onAddChild,
  onAiExpand,
  onDelete,
  onToggleCollapse,
}: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(node.title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDraft(node.title);
  }, [node.title]);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  function commitEdit() {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== node.title) {
      onTitleChange(trimmed);
    } else {
      setDraft(node.title);
    }
    setIsEditing(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") commitEdit();
    if (e.key === "Escape") {
      setDraft(node.title);
      setIsEditing(false);
    }
  }

  const hasChildren = node.children.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.88 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: NODE_W,
        height: NODE_H,
      }}
      className="group"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      {/* Main card */}
      <div
        className={cn(
          "relative flex items-center w-full h-full px-4 rounded-node cursor-pointer select-none",
          "bg-card border transition-all duration-150",
          isSelected
            ? "border-yellow-roll shadow-node-selected"
            : "border-ink-faint shadow-node hover:shadow-node-hover hover:border-ink-muted",
          node.isAiGenerated && !isSelected && "border-l-[3px] border-l-yellow-roll"
        )}
        onDoubleClick={(e) => {
          e.stopPropagation();
          setIsEditing(true);
        }}
      >
        {/* Collapse toggle */}
        {hasChildren && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleCollapse();
            }}
            className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full bg-card border border-ink-faint shadow-sm hover:border-ink-muted hover:bg-paper z-10 text-ink-muted"
          >
            {node.isCollapsed
              ? <ChevronRight size={12} />
              : <ChevronDown size={12} />
            }
          </button>
        )}

        {/* Title */}
        {isEditing ? (
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={handleKeyDown}
            onClick={(e) => e.stopPropagation()}
            className="w-full text-sm font-medium text-ink bg-transparent outline-none border-b border-yellow-roll"
          />
        ) : (
          <span className="text-sm font-medium text-ink leading-tight line-clamp-2 flex-1 pr-1">
            {node.title}
          </span>
        )}

        {/* AI badge */}
        {node.isAiGenerated && (
          <span className="absolute top-1 right-2 text-[9px] font-semibold text-yellow-600 opacity-60">
            AI
          </span>
        )}
      </div>

      {/* Action buttons — appear on hover/select */}
      <div
        className={cn(
          "absolute -bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-1 transition-all duration-150",
          "opacity-0 group-hover:opacity-100",
          isSelected && "opacity-100"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Add child */}
        <ActionButton
          onClick={onAddChild}
          title="子ノードを追加"
          className="bg-ink text-paper hover:bg-ink-soft"
        >
          <Plus size={11} />
        </ActionButton>

        {/* AI expand */}
        <ActionButton
          onClick={onAiExpand}
          disabled={isAiLoading}
          title="AIで展開"
          className="bg-yellow-roll text-ink hover:bg-yellow-400"
        >
          {isAiLoading
            ? <Loader2 size={11} className="animate-spin" />
            : <Sparkles size={11} />
          }
        </ActionButton>

        {/* Delete */}
        {!isRoot && (
          <ActionButton
            onClick={onDelete}
            title="削除"
            className="bg-red-100 text-red-600 hover:bg-red-200"
          >
            <Trash2 size={11} />
          </ActionButton>
        )}
      </div>
    </motion.div>
  );
}

function ActionButton({
  children,
  onClick,
  disabled,
  title,
  className,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  title?: string;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        "w-6 h-6 flex items-center justify-center rounded-full shadow-sm transition-all duration-100",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        className
      )}
    >
      {children}
    </button>
  );
}
