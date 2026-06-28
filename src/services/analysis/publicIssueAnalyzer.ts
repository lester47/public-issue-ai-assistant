import { ArgumentBuilder } from "@/services/workflow/argumentBuilder";
import { Deduplicator } from "@/services/workflow/deduplicator";
import { FactExtractor } from "@/services/workflow/factExtractor";
import { KnowledgeCardRepository } from "@/services/workflow/knowledgeCardRepository";
import { PositionAnalyzer } from "@/services/workflow/positionAnalyzer";
import { QueryPlanner } from "@/services/workflow/queryPlanner";
import { SearchRanker } from "@/services/workflow/searchRanker";
import { SearchService } from "@/services/workflow/searchService";
import { TimelineBuilder } from "@/services/workflow/timelineBuilder";
import type { AnalyzeIssueResponse } from "@/types/publicIssue";

const SEARCH_WINDOW_DAYS = 28;

export async function analyzePublicIssue(
  query: string
): Promise<AnalyzeIssueResponse> {
  const searchedAt = new Date().toISOString();
  const knowledgeCards = new KnowledgeCardRepository().findRelevant(query);
  const plan = new QueryPlanner().plan(query, knowledgeCards, SEARCH_WINDOW_DAYS);
  const sources = await new SearchService().search(plan);
  const rankedSources = new Deduplicator().dedupe(
    new SearchRanker().rank(plan, sources)
  );
  const timeline = new TimelineBuilder().build(rankedSources);
  const { facts, uncertain } = new FactExtractor().extract(
    rankedSources,
    knowledgeCards
  );
  const positions = new PositionAnalyzer().analyze(rankedSources);
  const data = new ArgumentBuilder().build({
    plan,
    knowledgeCards,
    sources,
    rankedSources,
    timeline,
    facts,
    uncertain,
    positions
  });

  return {
    ok: true,
    data,
    meta: {
      query,
      searchedAt,
      searchWindowDays: SEARCH_WINDOW_DAYS,
      usedFallback: rankedSources.some((source) =>
        source.url.includes("example.com")
      )
    }
  };
}
