import { PUBLIC_ISSUE_SYSTEM_PROMPT, buildPublicIssueUserPrompt } from "@/prompts/publicIssue";
import type { PublicIssueAnalysis, SourceReference } from "@/types/publicIssue";

type OpenAIResponsesPayload = {
  output_text?: string;
  output?: Array<{
    content?: Array<{
      type?: string;
      text?: string;
    }>;
  }>;
};

export async function generatePublicIssueAnalysis(
  query: string,
  sources: SourceReference[]
): Promise<PublicIssueAnalysis> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return buildFallbackAnalysis(query, sources);
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL ?? "gpt-5.1",
      instructions: PUBLIC_ISSUE_SYSTEM_PROMPT,
      input: buildPublicIssueUserPrompt(query, sources),
      text: {
        format: {
          type: "json_object"
        }
      }
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI response failed: ${response.status}`);
  }

  const payload = (await response.json()) as OpenAIResponsesPayload;
  const rawText = extractResponseText(payload);
  const parsed = JSON.parse(rawText) as Omit<PublicIssueAnalysis, "references">;

  return {
    ...parsed,
    rebuttal: parsed.rebuttal ?? buildRebuttal(query, sources),
    stanceGroups: parsed.stanceGroups ?? buildStanceGroups(query, sources),
    references: sources
  };
}

function extractResponseText(payload: OpenAIResponsesPayload): string {
  if (payload.output_text) return payload.output_text;

  const text = payload.output
    ?.flatMap((item) => item.content ?? [])
    .map((content) => content.text)
    .filter(Boolean)
    .join("\n");

  if (!text) {
    throw new Error("OpenAI response did not include text output.");
  }

  return text;
}

function buildFallbackAnalysis(
  query: string,
  sources: SourceReference[]
): PublicIssueAnalysis {
  const sourceIds = sources.map((source) => source.id);
  const hasRealSources = sources.some(
    (source) => !source.url.includes("example.com")
  );
  const topSources = sources.slice(0, 5);
  const sourceTitles = topSources.map((source) => source.title);
  const sourceSummary =
    sourceTitles.length > 0
      ? sourceTitles.map((title) => `「${title}」`).join("、")
      : "目前沒有可用來源";

  return {
    topic: query,
    rebuttal: buildRebuttal(query, sources),
    stanceGroups: buildStanceGroups(query, sources),
    summary: {
      short: hasRealSources
        ? `已找到 ${sources.length} 筆近期來源；目前以免 LLM 模式提供保守整理。`
        : "目前無法取得外部來源；系統改用本機保守模式，不會捏造議題結論。",
      medium:
        hasRealSources
          ? `根據目前搜尋到的來源，這個議題的近期資訊主要集中在：${sourceSummary}。免 LLM 模式不會自行推論政治立場，只會把來源標題、摘要與日期整理成可查核的初步脈絡。`
          : "此版本不需要 LLM API key 也能運作；但若外部搜尋暫時無法連線，系統只會提供查證方向與限制提醒，不會假裝已有來源。",
      detailed:
        hasRealSources
          ? "目前使用免 LLM key 的規則式整理：系統會保留來源、列出近期報導、標示哪些資訊仍需人工查證。這個模式適合快速掌握資料入口，但不取代完整研究，也不會做沒有來源支持的立場歸納。"
          : "目前使用本機保守模式：可接收議題、顯示查證方向、保留來源欄位與資料限制。待外部搜尋恢復後，系統會自動改用免 key 搜尋結果整理。"
    },
    timeline: topSources.map((source) => ({
      date: source.publishedAt?.slice(0, 10),
      title: source.title,
      description: source.snippet || "此來源未提供摘要，請開啟來源查看完整內容。",
      sourceIds: [source.id]
    })),
    facts: [
      ...(hasRealSources
        ? topSources.map((source) => ({
            statement: `來源提到：${source.title}`,
            sourceIds: [source.id]
          }))
        : [
            {
              statement: `使用者想查證的議題是：「${query}」。目前尚未取得外部來源，因此不能判定此說法為真或假。`,
              sourceIds
            }
          ])
    ],
    uncertain: [
      {
        statement: hasRealSources
          ? "免 LLM 模式不會自動判斷各方立場是否完整，也不會推論未明示的因果關係；需要開啟來源進一步查核。"
          : "尚未取得真實搜尋來源時，不能判斷事件事實、責任歸屬或各方立場。",
        sourceIds
      }
    ],
    positions: hasRealSources
      ? topSources.map((source) => ({
          actor: source.sourceName ?? "來源報導",
          position: source.title,
          reasons: source.snippet ? [source.snippet] : [],
          sourceIds: [source.id]
        }))
      : [],
    misinformation: [],
    oneSentence: hasRealSources
      ? `已找到 ${sources.length} 筆近期來源，以下是免 LLM 模式的保守整理。`
      : "目前無法取得外部來源；以下提供本機保守模式的查證提醒。",
    thirtySeconds:
      hasRealSources
        ? `免 LLM 模式已找到 ${sources.length} 筆來源，並整理成近期進度、來源提及事項與待查證提醒；此模式不會替來源做額外推論。`
        : "這個 MVP 不需要 LLM API key 也能運作；目前外部搜尋未取得資料，因此系統只提供查證提醒與限制說明，不會捏造議題內容。",
    fullAnswer:
      hasRealSources
        ? `這次查詢以免 LLM key 模式運作。系統搜尋近期資料後，保留了 ${sources.length} 筆來源，並依照來源標題與摘要建立初步整理。請注意：這不是生成式深度分析，因此不會自動判定誰的說法正確，也不會推論未在來源中出現的資訊。建議從下方資料來源逐一開啟查核。`
        : "目前可以在沒有 LLM API key 的情況下使用。系統會先嘗試免 key 搜尋近期資料；若搜尋連線失敗，會改用本機保守模式，提醒使用者需要查證哪些面向，例如官方公告、新聞報導、法案或預算文件，以及事實查核資料。此模式不會自行判斷未取得來源的說法。",
    references: sources
  };
}

function buildRebuttal(query: string, sources: SourceReference[]) {
  const realSources = sources.filter((source) => !source.url.includes("example.com"));
  const sourceIds = realSources.slice(0, 3).map((source) => source.id);
  const firstSourceName = realSources[0]?.sourceName ?? "目前來源";
  const queryText = query.toLowerCase();
  const evidenceText = [query, ...realSources.map((source) => source.title)]
    .join(" ")
    .toLowerCase();

  if (realSources.length === 0) {
    return {
      title: "台灣派可以這樣回",
      viewpoints: [
        {
          targetClaim: "沒有來源的說法可以先當真。",
          counterPoint: "沒有新聞、官方資料或原始文件，就只能算待查證說法。",
          whyItMatters: "台灣派要守住事實，不要讓錯誤資訊帶動情緒。",
          sourceIds: sources.map((source) => source.id)
        }
      ],
      sentences: [
        "這種說法先不要急著轉傳，沒有來源就只是情緒，不是事實。",
        `如果要講「${query}」，至少拿出新聞、官方資料或原始文件；愛台灣不是跟著口號生氣，是先把事情查清楚。`
      ],
      sourceIds: sources.map((source) => source.id)
    };
  }

  if (hasAny(queryText, ["總預算", "預算", "行政院", "不給錢"])) {
    return {
      title: "台灣派可以這樣回",
      viewpoints: [
        {
          targetClaim: "總預算過了，行政院就是故意不給錢。",
          counterPoint: "預算要看科目、審查內容、刪凍項目和執行程序，不能把複雜制度講成一句陰謀。",
          whyItMatters: "公共預算是人民的錢，台灣派要守的是透明和負責，不是被口號牽著走。",
          sourceIds
        },
        {
          targetClaim: "救災經費問題可以直接怪單一一方。",
          counterPoint: "來源顯示爭議牽涉預算審查、行政說法與政黨攻防，應要求各方把文件和程序攤開。",
          whyItMatters: "真正照顧台灣，是讓救災和民生預算能被清楚監督、確實執行。",
          sourceIds
        }
      ],
      sentences: [
        "總預算不是一句「過了就該馬上給錢」這麼簡單，錢在哪個科目、誰刪誰擋，都要講清楚。",
        `目前 ${firstSourceName} 等來源顯示爭議牽涉預算審查、救災經費說法和政黨攻防；不要把政治口號包裝成事實。`,
        "愛台灣就是盯緊預算真的用在人民身上，不是聽到一句話就被帶著罵。"
      ],
      sourceIds
    };
  }

  if (hasAny(queryText, ["淹水", "暴雨", "內湖", "水溝", "土石流"])) {
    return {
      title: "台灣派可以這樣回",
      viewpoints: [
        {
          targetClaim: "台北淹水可以直接怪中央不給錢。",
          counterPoint: "淹水要看暴雨強度、排水系統、地方防災和市府應變，不能用一句話甩鍋。",
          whyItMatters: "災害檢討要找出哪一層治理失靈，才真的能保護台灣人的生活。",
          sourceIds
        },
        {
          targetClaim: "只要喊中央問題，地方責任就不用談。",
          counterPoint: "來源提到北市府回應、排水與土石流等面向，地方政府必須說明防災準備。",
          whyItMatters: "愛台灣不是護航任何人，而是要求有權力的人把事情做好。",
          sourceIds
        }
      ],
      sentences: [
        "不要把淹水硬扯成一句「中央不給錢」就結案，這樣太偷懶。",
        `目前 ${firstSourceName} 等來源都在談暴雨、排水、土石流和北市府回應；該檢討的是地方防災和排水系統有沒有跟上。`,
        "真正愛台灣，就是災害來了誰負責、哪裡失靈、怎麼補強都講清楚，不是拿中央當萬用藉口。"
      ],
      sourceIds
    };
  }

  if (hasAny(evidenceText, ["條例", "法案", "修法", "立法院"])) {
    return {
      title: "台灣派可以這樣回",
      viewpoints: [
        {
          targetClaim: "法案爭議只要聽政治人物一句話就夠。",
          counterPoint: "法案要回到條文、影響對象和實際後果來討論。",
          whyItMatters: "制度會影響台灣安全與人民權利，不能被口號取代。",
          sourceIds
        }
      ],
      sentences: [
        "法案爭議不能只聽一句懶人包，重點是條文怎麼寫、誰受影響、會不會傷到台灣安全或人民權利。",
        `目前 ${firstSourceName} 等來源顯示這不是單一口號能說完的事；要討論就回到條文和近期事件。`,
        "真正站在台灣這邊，是把制度顧好，不是被最響亮的說法牽著走。"
      ],
      sourceIds
    };
  }

  return {
    title: "台灣派可以這樣回",
    viewpoints: [
      {
        targetClaim: "單一句話就能代表整個事件。",
        counterPoint: "公共議題要看最近來源、當事人說法與可查證資料，不能只靠一句帶風向的說法。",
        whyItMatters: "有立場也要有證據，這樣才不會讓台灣社會被錯誤資訊撕裂。",
        sourceIds
      }
    ],
    sentences: [
      `這題不要被一句「${query}」帶走，先看最近來源到底在講什麼。`,
      `目前 ${firstSourceName} 等來源已經提供一些線索；愛台灣就是把事實釐清，再判斷誰說得有道理。`,
      "可以有立場，但立場要站在證據上，才不會被錯誤論調牽著跑。"
    ],
    sourceIds
  };
}

function buildStanceGroups(
  query: string,
  sources: SourceReference[]
): PublicIssueAnalysis["stanceGroups"] {
  const sourceIds = sources
    .filter((source) => !source.url.includes("example.com"))
    .slice(0, 3)
    .map((source) => source.id);
  const fallbackIds = sources.slice(0, 3).map((source) => source.id);
  const ids = sourceIds.length ? sourceIds : fallbackIds;

  return {
    blue: {
      label: "偏藍營的意見",
      conclusions: [
        {
          statement:
            "傾向質疑政府效率、行政責任或執政黨是否把問題處理清楚。",
          sourceIds: ids
        },
        {
          statement:
            "會要求官方提出更明確的資料、時程和責任說明。",
          sourceIds: ids
        }
      ]
    },
    green: {
      label: "偏綠營的意見",
      conclusions: [
        {
          statement:
            "傾向主張先看來源、制度和完整脈絡，不要把未查證說法直接當事實。",
          sourceIds: ids
        },
        {
          statement:
            "會強調台灣公共討論需要證據，不該被簡化口號或錯誤資訊帶著走。",
          sourceIds: ids
        }
      ]
    }
  };
}

function hasAny(text: string, keywords: string[]) {
  return keywords.some((keyword) => text.includes(keyword));
}
