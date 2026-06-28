import type { SourceReference } from "@/types/publicIssue";
import type { QueryPlan, RankedSource } from "./types";

export class SearchRanker {
  rank(plan: QueryPlan, sources: SourceReference[]): RankedSource[] {
    return sources
      .map((source) => ({
        ...source,
        score: scoreSource(plan, source)
      }))
      .sort((a, b) => b.score - a.score);
  }
}

function scoreSource(plan: QueryPlan, source: SourceReference) {
  const text = `${source.title} ${source.snippet} ${source.sourceName ?? ""}`;
  const keywordScore = plan.keywords.filter((keyword) =>
    text.includes(keyword)
  ).length;
  const recencyScore = source.publishedAt
    ? Math.max(0, 10 - ageInDays(source.publishedAt))
    : 0;
  const typeScore = source.type === "official" ? 5 : source.type === "news" ? 2 : 0;
  const qualityScore = sourceQualityScore(source);

  return keywordScore * 10 + recencyScore + typeScore + qualityScore;
}

function ageInDays(date: string) {
  return Math.floor((Date.now() - new Date(date).getTime()) / 86_400_000);
}

function sourceQualityScore(source: SourceReference) {
  const text = `${source.url} ${source.sourceName ?? ""}`.toLowerCase();

  if (
    ["facebook", "threads", "instagram", "tiktok", "youtube"].some((site) =>
      text.includes(site)
    )
  ) {
    return -30;
  }

  if (
    [
      "gov",
      "立法院",
      "行政院",
      "中央社",
      "公視",
      "自由時報",
      "udn",
      "聯合",
      "三立",
      "民視",
      "鏡報",
      "yahoo",
      "line today"
    ].some((site) => text.includes(site.toLowerCase()))
  ) {
    return 8;
  }

  return 0;
}
