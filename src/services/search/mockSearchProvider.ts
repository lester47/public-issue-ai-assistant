import type { SourceReference } from "@/types/publicIssue";
import type { SearchIssueInput, SearchProvider } from "./types";

export class MockSearchProvider implements SearchProvider {
  async search(input: SearchIssueInput): Promise<SourceReference[]> {
    const retrievedAt = new Date().toISOString();
    const topic = input.query.trim() || "公共議題";

    return [
      {
        id: "source-1",
        title: `目前無法連線搜尋來源：${topic}`,
        url: "https://example.com/search-provider-required",
        snippet:
          "系統目前無法取得外部新聞或官方資料來源。這筆資料是本機保守模式提示，用來避免無來源時捏造回答。",
        sourceName: "本機保守模式",
        retrievedAt,
        type: "unknown"
      }
    ];
  }
}
