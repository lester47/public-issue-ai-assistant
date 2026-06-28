import { analyzePublicIssue } from "@/services/analysis/publicIssueAnalyzer";
import type {
  AnalyzeIssueApiResponse,
  AnalyzeIssueRequest
} from "@/types/publicIssue";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<AnalyzeIssueRequest>;
    const query = body.query?.trim();

    if (!query || query.length < 2) {
      return NextResponse.json<AnalyzeIssueApiResponse>(
        {
          ok: false,
          error: {
            code: "bad_request",
            message: "請輸入至少 2 個字的公共議題。"
          }
        },
        { status: 400 }
      );
    }

    const result = await analyzePublicIssue(query);
    return NextResponse.json<AnalyzeIssueApiResponse>(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "分析時發生未知錯誤。";

    return NextResponse.json<AnalyzeIssueApiResponse>(
      {
        ok: false,
        error: {
          code: message.includes("search") ? "search_failed" : "llm_failed",
          message
        }
      },
      { status: 500 }
    );
  }
}
