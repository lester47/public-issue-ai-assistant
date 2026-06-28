import { GoogleNewsRssProvider } from "./googleNewsRssProvider";
import { TavilySearchProvider } from "./tavilySearchProvider";
import type { SearchProvider } from "./types";

export function createSearchProviders(): SearchProvider[] {
  const tavilyApiKey = process.env.TAVILY_API_KEY;
  const providers: SearchProvider[] = [];

  if (tavilyApiKey) {
    providers.push(new TavilySearchProvider(tavilyApiKey));
  }

  if (process.env.DISABLE_KEYLESS_SEARCH !== "true") {
    providers.push(new GoogleNewsRssProvider());
  }

  return providers;
}
