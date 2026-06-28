import type { PositionItem } from "@/types/publicIssue";
import type { RankedSource } from "./types";

export class PositionAnalyzer {
  analyze(sources: RankedSource[]): PositionItem[] {
    return sources.slice(0, 5).map((source) => ({
      actor: source.sourceName ?? "來源報導",
      position: source.title,
      reasons: source.snippet ? [source.snippet] : [],
      sourceIds: [source.id]
    }));
  }
}
