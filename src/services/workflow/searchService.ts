import { createSearchProviders } from "@/services/search";
import { MockSearchProvider } from "@/services/search/mockSearchProvider";
import type { SourceReference } from "@/types/publicIssue";
import type { QueryPlan } from "./types";

export class SearchService {
  async search(plan: QueryPlan): Promise<SourceReference[]> {
    const providers = createSearchProviders();
    const queries = unique([plan.searchQuery, plan.originalQuery, plan.topic]);
    const sources: SourceReference[] = [];

    for (const provider of providers) {
      for (const query of queries) {
        try {
          const results = await provider.search({
            query,
            windowDays: plan.timeRangeDays
          });
          sources.push(...results.filter((source) => !isFallbackSource(source)));
        } catch {
          // Try the next provider/query before falling back to local guardrails.
        }

        if (sources.length >= 8) {
          return reindexSources(sources);
        }
      }
    }

    if (sources.length > 0) {
      return reindexSources(sources);
    }

    return new MockSearchProvider().search({
      query: plan.originalQuery,
      windowDays: plan.timeRangeDays
    });
  }
}

function reindexSources(sources: SourceReference[]) {
  return sources.slice(0, 8).map((source, index) => ({
    ...source,
    id: `source-${index + 1}`
  }));
}

function isFallbackSource(source: SourceReference) {
  return source.url.includes("example.com");
}

function unique(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}
