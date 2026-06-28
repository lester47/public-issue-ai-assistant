import type { IssueIntent, KnowledgeCard, QueryPlan } from "./types";

const STOP_WORDS = new Set([
  "最近",
  "不是",
  "很多人",
  "有人",
  "到底",
  "什麼",
  "怎麼",
  "為什麼",
  "台灣",
  "已經",
  "可以",
  "請問"
]);

export class QueryPlanner {
  plan(query: string, cards: KnowledgeCard[], timeRangeDays: number): QueryPlan {
    const matchedCard = findBestCard(query, cards);
    const keywords = unique([
      ...(matchedCard?.keywords ?? []),
      ...extractKeywords(query)
    ]).slice(0, 8);
    const topic = matchedCard?.topic ?? inferTopic(query, keywords);

    return {
      originalQuery: query,
      topic,
      intent: inferIntent(query),
      keywords,
      searchQuery: unique([topic, ...keywords]).join(" "),
      timeRangeDays
    };
  }
}

function findBestCard(query: string, cards: KnowledgeCard[]) {
  return cards
    .map((card) => ({
      card,
      score: [...card.aliases, ...card.keywords].filter((term) =>
        query.includes(term)
      ).length
    }))
    .sort((a, b) => b.score - a.score)[0]?.score
    ? cards
        .map((card) => ({
          card,
          score: [...card.aliases, ...card.keywords].filter((term) =>
            query.includes(term)
          ).length
        }))
        .sort((a, b) => b.score - a.score)[0].card
    : undefined;
}

function extractKeywords(query: string) {
  return query
    .split(/[，。！？\s、,!?]+/)
    .map((word) => word.trim())
    .filter((word) => word.length >= 2 && !STOP_WORDS.has(word));
}

function inferTopic(query: string, keywords: string[]) {
  if (query.includes("總預算") || query.includes("不給錢")) {
    return "中央政府總預算";
  }

  if (query.includes("淹水") || query.includes("內湖")) {
    return "台北淹水與地方防災";
  }

  if (query.includes("無人機")) {
    return "無人機條例";
  }

  return keywords[0] ?? query;
}

function inferIntent(query: string): IssueIntent {
  if (query.includes("錯") || query.includes("反駁") || query.includes("懟")) {
    return "argument_help";
  }

  if (query.includes("真假") || query.includes("查證")) {
    return "fact_check";
  }

  if (query.includes("背景")) {
    return "background";
  }

  return "event_summary";
}

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}
