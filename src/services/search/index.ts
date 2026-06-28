import { GoogleNewsRssProvider } from "./googleNewsRssProvider";
import { MockSearchProvider } from "./mockSearchProvider";
import { TavilySearchProvider } from "./tavilySearchProvider";
import type { SearchProvider } from "./types";

export function createSearchProvider(): SearchProvider {
  const tavilyApiKey = process.env.TAVILY_API_KEY;

  if (tavilyApiKey) {
    return new TavilySearchProvider(tavilyApiKey);
  }

  if (process.env.DISABLE_KEYLESS_SEARCH !== "true") {
    return new GoogleNewsRssProvider();
  }

  return new MockSearchProvider();
}
