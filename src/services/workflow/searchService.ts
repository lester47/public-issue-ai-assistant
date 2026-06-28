import { createSearchProvider } from "@/services/search";
import { MockSearchProvider } from "@/services/search/mockSearchProvider";
import type { SourceReference } from "@/types/publicIssue";
import type { QueryPlan } from "./types";

export class SearchService {
  async search(plan: QueryPlan): Promise<SourceReference[]> {
    const provider = createSearchProvider();

    return provider
      .search({
        query: plan.searchQuery,
        windowDays: plan.timeRangeDays
      })
      .catch(() =>
        new MockSearchProvider().search({
          query: plan.originalQuery,
          windowDays: plan.timeRangeDays
        })
      );
  }
}
