import type { TimelineEvent } from "@/types/publicIssue";
import type { RankedSource } from "./types";

export class TimelineBuilder {
  build(sources: RankedSource[]): TimelineEvent[] {
    return sources
      .filter((source) => source.publishedAt)
      .sort(
        (a, b) =>
          new Date(a.publishedAt ?? 0).getTime() -
          new Date(b.publishedAt ?? 0).getTime()
      )
      .slice(0, 8)
      .map((source) => ({
        date: source.publishedAt?.slice(0, 10),
        title: source.title,
        description:
          source.snippet || "此來源未提供摘要，請開啟來源查看完整內容。",
        sourceIds: [source.id]
      }));
  }
}
