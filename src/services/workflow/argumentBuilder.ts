import type { PublicIssueAnalysis, SourceReference } from "@/types/publicIssue";
import type {
  EvidenceBundle,
  KnowledgeCard,
  QueryPlan,
  RankedSource
} from "./types";

export class ArgumentBuilder {
  build(bundle: EvidenceBundle): PublicIssueAnalysis {
    const sources = bundle.rankedSources;
    const hasRealSources = sources.some((source) => !isFallbackSource(source));
    const rebuttal = buildRebuttal(
      bundle.plan,
      sources,
      bundle.knowledgeCards
    );
    const sourceSummary = sources
      .slice(0, 5)
      .map((source) => `「${source.title}」`)
      .join("、");

    return {
      topic: bundle.plan.topic,
      rebuttal,
      summary: {
        short: hasRealSources
          ? `已找到 ${sources.length} 筆近期來源，並整理反駁觀點與查證方向。`
          : "目前無法取得外部來源；系統改用本機保守模式，不會捏造議題結論。",
        medium: hasRealSources
          ? `根據目前搜尋到的來源，近期資訊主要集中在：${sourceSummary}。系統先整理事件線索、事實與反駁觀點，再產生可直接回覆的短句。`
          : "此版本不需要 LLM API key 也能運作；但若外部搜尋暫時無法連線，系統只會提供查證方向與限制提醒。",
        detailed: hasRealSources
          ? "v2 pipeline 會先規劃查詢、搜尋、排序、去重，再建立時間線、事實、立場與反駁觀點。免 LLM 模式不替來源做額外推論。"
          : "目前使用本機保守模式：可接收議題、顯示查證方向、保留來源欄位與資料限制。"
      },
      timeline: bundle.timeline,
      facts: bundle.facts,
      uncertain: bundle.uncertain,
      positions: bundle.positions,
      misinformation: [],
      oneSentence: hasRealSources
        ? `已找到 ${sources.length} 筆近期來源，以下是台灣派可用的反駁觀點。`
        : "目前無法取得外部來源；以下提供本機保守模式的查證提醒。",
      thirtySeconds: hasRealSources
        ? `這題不能只聽一句口號。系統已整理 ${sources.length} 筆來源，先抓出對方論調的問題，再用來源支撐台灣派的反駁觀點。`
        : "這個 MVP 不需要 LLM API key 也能運作；目前外部搜尋未取得資料，因此系統只提供查證提醒與限制說明。",
      fullAnswer: hasRealSources
        ? "目前以免 LLM key 模式運作。系統根據搜尋來源做保守整理：列出近期進度、來源提及事項、待查證提醒與可反駁的觀點。若要更深層的語意歸納，後續可把各 builder 換成 LLM agent。"
        : "目前可以在沒有 LLM API key 的情況下使用。系統會先嘗試免 key 搜尋近期資料；若搜尋連線失敗，會改用本機保守模式。此模式不會自行判斷未取得來源的說法。",
      references: sources
    };
  }
}

function buildRebuttal(
  plan: QueryPlan,
  sources: RankedSource[],
  cards: KnowledgeCard[]
): PublicIssueAnalysis["rebuttal"] {
  const realSources = sources.filter((source) => !isFallbackSource(source));
  const sourceIds = realSources.slice(0, 3).map((source) => source.id);
  const firstSourceName = realSources[0]?.sourceName ?? "目前來源";
  const cardAngles = cards.flatMap((card) => card.rebuttalAngles);

  if (realSources.length === 0) {
    return {
      title: "台灣派可以這樣回",
      viewpoints: [
        {
          targetClaim: "沒有來源的說法可以先當真。",
          counterPoint:
            "沒有新聞、官方資料或原始文件，就只能算待查證說法。",
          whyItMatters:
            "台灣派要守住事實，不要讓錯誤資訊帶動情緒。",
          sourceIds: sources.map((source) => source.id)
        }
      ],
      sentences: [
        "這種說法先不要急著轉傳，沒有來源就只是情緒，不是事實。",
        `如果要講「${plan.originalQuery}」，至少拿出新聞、官方資料或原始文件；愛台灣不是跟著口號生氣，是先把事情查清楚。`
      ],
      sourceIds: sources.map((source) => source.id)
    };
  }

  const viewpoints = cardAngles.length
    ? cardAngles.map((angle) => ({ ...angle, sourceIds }))
    : [
        {
          targetClaim: "單一句話就能代表整個事件。",
          counterPoint:
            "公共議題要看最近來源、當事人說法與可查證資料，不能只靠一句帶風向的說法。",
          whyItMatters:
            "有立場也要有證據，這樣才不會讓台灣社會被錯誤資訊撕裂。",
          sourceIds
        }
      ];

  return {
    title: "台灣派可以這樣回",
    viewpoints,
    sentences: buildSentences(plan, firstSourceName),
    sourceIds
  };
}

function buildSentences(plan: QueryPlan, firstSourceName: string) {
  const query = plan.originalQuery;
  const topicText = `${plan.topic} ${query}`;

  if (hasAny(topicText, ["總預算", "預算", "行政院", "不給錢"])) {
    return [
      "總預算不是一句「過了就該馬上給錢」這麼簡單，錢在哪個科目、誰刪誰擋，都要講清楚。",
      `目前 ${firstSourceName} 等來源顯示爭議牽涉預算審查、救災經費說法和政黨攻防；不要把政治口號包裝成事實。`,
      "愛台灣就是盯緊預算真的用在人民身上，不是聽到一句話就被帶著罵。"
    ];
  }

  if (hasAny(topicText, ["淹水", "暴雨", "內湖", "水溝", "土石流"])) {
    return [
      "不要把淹水硬扯成一句「中央不給錢」就結案，這樣太偷懶。",
      `目前 ${firstSourceName} 等來源都在談暴雨、排水、土石流和地方政府回應；該檢討的是地方防災和排水系統有沒有跟上。`,
      "真正愛台灣，就是災害來了誰負責、哪裡失靈、怎麼補強都講清楚，不是拿中央當萬用藉口。"
    ];
  }

  if (hasAny(topicText, ["條例", "法案", "修法", "立法院"])) {
    return [
      "法案爭議不能只聽一句懶人包，重點是條文怎麼寫、誰受影響、會不會傷到台灣安全或人民權利。",
      `目前 ${firstSourceName} 等來源顯示這不是單一口號能說完的事；要討論就回到條文和近期事件。`,
      "真正站在台灣這邊，是把制度顧好，不是被最響亮的說法牽著走。"
    ];
  }

  return [
    `這題不要被一句「${query}」帶走，先看最近來源到底在講什麼。`,
    `目前 ${firstSourceName} 等來源已經提供一些線索；愛台灣就是把事實釐清，再判斷誰說得有道理。`,
    "可以有立場，但立場要站在證據上，才不會被錯誤論調牽著跑。"
  ];
}

function isFallbackSource(source: SourceReference) {
  return source.url.includes("example.com");
}

function hasAny(text: string, keywords: string[]) {
  return keywords.some((keyword) => text.includes(keyword));
}
