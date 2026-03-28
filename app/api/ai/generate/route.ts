import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { GenerateRequest, GenerateResponse } from "@/lib/types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY ?? "" });

// Simple in-memory rate limiter (3 sec cooldown per IP)
const lastRequest = new Map<string, number>();

export async function POST(req: NextRequest): Promise<NextResponse> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY が設定されていません。.env.local を確認してください。" },
      { status: 500 }
    );
  }

  // Rate limit
  const ip = req.headers.get("x-forwarded-for") ?? "local";
  const now = Date.now();
  const last = lastRequest.get(ip) ?? 0;
  if (now - last < 3000) {
    return NextResponse.json(
      { error: "リクエストが多すぎます。少し待ってから再試行してください。" },
      { status: 429 }
    );
  }
  lastRequest.set(ip, now);

  let body: GenerateRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "リクエスト形式が不正です。" }, { status: 400 });
  }

  const { nodeTitle, ancestorPath, existingChildren } = body;
  if (!nodeTitle?.trim()) {
    return NextResponse.json({ error: "ノードタイトルが必要です。" }, { status: 400 });
  }

  const context = ancestorPath.length > 0
    ? `文脈（親→子の順）: ${ancestorPath.join(" → ")} → ${nodeTitle}`
    : `対象ノード: ${nodeTitle}`;

  const existing = existingChildren.length > 0
    ? `既存の子ノード（重複不可）: ${existingChildren.join("、")}`
    : "既存の子ノード: なし";

  const prompt = `あなたはMECE思考の専門家です。ロジックツリーの展開をサポートしてください。

${context}
${existing}

「${nodeTitle}」をMECEの原則に従って分解する子要素を4〜6個提案してください。

【重要なMECE基準】
1. 漏れなく（Collectively Exhaustive）: すべての要因・側面を網羅する
2. ダブりなく（Mutually Exclusive）: 各要素は互いに重複しない独立した概念
3. 同じ抽象レベルで並列に並ぶ（例: 「顧客数」と「単価」と「頻度」は売上の積算要素として同レベル）
4. 一般的なビジネスフレームワーク（売上=顧客数×単価×頻度、コスト=固定費+変動費 等）を活用する

- 各要素は15文字以内の簡潔な日本語
- 既存の子ノードと重複しない
- 説明文やマークダウン不要

必ず以下のJSON形式のみで返答してください:
{"suggestions": ["要素1", "要素2", "要素3", "要素4"]}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const text = response.text ?? "";
    const jsonMatch = text.match(/\{[\s\S]*"suggestions"[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json(
        { error: "AIの応答を解析できませんでした。再試行してください。" },
        { status: 500 }
      );
    }

    const parsed = JSON.parse(jsonMatch[0]) as GenerateResponse;
    if (!Array.isArray(parsed.suggestions)) {
      return NextResponse.json({ error: "AIの応答形式が不正です。" }, { status: 500 });
    }

    return NextResponse.json({ suggestions: parsed.suggestions.slice(0, 6) });
  } catch (err) {
    console.error("Gemini API error:", err);
    return NextResponse.json(
      { error: "AI生成に失敗しました。APIキーと無料枠の残量を確認してください。" },
      { status: 500 }
    );
  }
}
