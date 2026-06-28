import type { RankedSource } from "./types";

export class Deduplicator {
  dedupe(sources: RankedSource[]) {
    const seen = new Set<string>();

    return sources.filter((source) => {
      const key = normalize(`${source.title} ${source.sourceName ?? ""}`);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
}

function normalize(value: string) {
  return value
    .toLowerCase()
    .replace(/[^\p{Script=Han}a-z0-9]/gu, "")
    .slice(0, 80);
}
