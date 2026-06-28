import type { SourceReference } from "@/types/publicIssue";
import type { SearchIssueInput, SearchProvider } from "./types";

type TavilyResult = {
  title?: string;
  url?: string;
  content?: string;
  published_date?: string;
};

type TavilyResponse = {
  results?: TavilyResult[];
};

export class TavilySearchProvider implements SearchProvider {
  constructor(private readonly apiKey: string) {}

  async search(input: SearchIssueInput): Promise<SourceReference[]> {
    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        query: `${input.query} 最近 ${input.windowDays} 天 新聞 官方資料 法案 事實查核`,
        search_depth: "advanced",
        include_answer: false,
        include_raw_content: false,
        max_results: 8,
        days: input.windowDays
      })
    });

    if (!response.ok) {
      throw new Error(`Tavily search failed: ${response.status}`);
    }

    const payload = (await response.json()) as TavilyResponse;
    const retrievedAt = new Date().toISOString();

    return (payload.results ?? [])
      .filter((item) => item.url && item.title)
      .map((item, index) => ({
        id: `source-${index + 1}`,
        title: item.title ?? "未命名來源",
        url: item.url ?? "",
        snippet: item.content ?? "",
        publishedAt: item.published_date,
        retrievedAt,
        type: classifySource(item.title, item.url)
      }));
  }
}

function classifySource(title = "", url = ""): SourceReference["type"] {
  const text = `${title} ${url}`.toLowerCase();

  if (text.includes("fact") || text.includes("事實查核")) return "fact-check";
  if (text.includes("gov") || text.includes("政府") || text.includes("立法院")) {
    return "official";
  }
  if (text.includes("法案") || text.includes("條例")) return "bill";
  if (text.includes("記者會") || text.includes("press")) return "press";
  if (text.includes("news") || text.includes("新聞")) return "news";

  return "unknown";
}
