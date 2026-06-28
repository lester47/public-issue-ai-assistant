import type { SourceReference } from "@/types/publicIssue";
import type { SearchIssueInput, SearchProvider } from "./types";

type RssItem = {
  title: string;
  link: string;
  description: string;
  pubDate?: string;
  sourceName?: string;
};

export class GoogleNewsRssProvider implements SearchProvider {
  async search(input: SearchIssueInput): Promise<SourceReference[]> {
    const cutoff = getCutoffDate(input.windowDays);
    const query = encodeURIComponent(`${input.query} after:${cutoff}`);
    const url = `https://news.google.com/rss/search?q=${query}&hl=zh-TW&gl=TW&ceid=TW:zh-Hant`;
    const response = await fetch(url, {
      headers: {
        "User-Agent": "PublicIssueAssistant/0.1"
      },
      next: {
        revalidate: 900
      }
    });

    if (!response.ok) {
      throw new Error(`Google News RSS failed: ${response.status}`);
    }

    const xml = await response.text();
    const retrievedAt = new Date().toISOString();
    const cutoffTime = new Date(`${cutoff}T00:00:00.000Z`).getTime();

    const sources: SourceReference[] = parseRssItems(xml)
      .filter((item) => {
        if (!item.pubDate) return false;
        return new Date(item.pubDate).getTime() >= cutoffTime;
      })
      .slice(0, 8)
      .map((item, index) => ({
        id: `source-${index + 1}`,
        title: item.title,
        url: item.link,
        snippet: stripHtml(item.description),
        sourceName: item.sourceName,
        publishedAt: item.pubDate
          ? new Date(item.pubDate).toISOString()
          : undefined,
        retrievedAt,
        type: "news"
      }));

    if (sources.length > 0) return sources;

    return [
      {
        id: "source-1",
        title: `最近 ${input.windowDays} 天未找到 Google News RSS 來源：${input.query}`,
        url: "https://example.com/no-recent-google-news-results",
        snippet:
          "Google News RSS 可連線，但目前沒有找到符合最近時間範圍的來源。請改用更明確的關鍵字，或等待更多近期報導。",
        sourceName: "Google News RSS",
        retrievedAt,
        type: "unknown"
      }
    ];
  }
}

function getCutoffDate(windowDays: number) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - windowDays);
  return date.toISOString().slice(0, 10);
}

function parseRssItems(xml: string): RssItem[] {
  return Array.from(xml.matchAll(/<item>([\s\S]*?)<\/item>/g)).map((match) => {
    const itemXml = match[1] ?? "";

    return {
      title: decodeXml(readTag(itemXml, "title")),
      link: decodeXml(readTag(itemXml, "link")),
      description: decodeXml(readTag(itemXml, "description")),
      pubDate: decodeXml(readTag(itemXml, "pubDate")),
      sourceName: decodeXml(readTag(itemXml, "source"))
    };
  });
}

function readTag(xml: string, tagName: string) {
  const match = xml.match(new RegExp(`<${tagName}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tagName}>`));
  return match?.[1]?.trim() ?? "";
}

function decodeXml(value: string) {
  return value
    .replaceAll("<![CDATA[", "")
    .replaceAll("]]>", "")
    .replaceAll("&amp;", "&")
    .replaceAll("&nbsp;", " ")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", "\"")
    .replaceAll("&#39;", "'");
}

function stripHtml(value: string) {
  return decodeXml(value).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}
