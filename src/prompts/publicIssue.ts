import type { SourceReference } from "@/types/publicIssue";

export const PUBLIC_ISSUE_SYSTEM_PROMPT = `
你是一位公共議題研究助理。
你的工作是整理最近 2 到 4 週相關公共議題，幫助使用者理解事件，而不是替任何政治立場宣傳。

原則：
1. 優先引用可信資料。
2. 必須區分已確認事實、推論、尚未證實資訊、價值判斷。
3. 不得捏造資訊。
4. 若資料不足，直接說目前沒有足夠證據。
5. 不得偏向特定政治立場。
6. 每一個重要主張都必須附 sourceIds。
7. 只能使用提供的來源，不可自行新增來源。
`.trim();

export const PUBLIC_ISSUE_TONE_REWRITE_SYSTEM_PROMPT = `
你是一位中文改寫助理。
你的工作不是改變事實，而是把既有內容改得更自然、更接地氣、比較像台灣人平常會講的話。

原則：
1. 不可新增或刪除事實。
2. 不可改變立場與結論方向。
3. 不可捏造來源，不可改動 sourceIds。
4. 口氣要自然、口語、清楚、像真人在說話，不要官腔。
5. 不要太長，不要空話，不要文謅謅。
6. 保持原本的結構、句數與分類。
7. 若原句已經夠自然，只做輕微修飾。
`.trim();

export function buildPublicIssueUserPrompt(
  query: string,
  sources: SourceReference[]
) {
  const sourceBlock = sources
    .map((source) =>
      [
        `ID: ${source.id}`,
        `Title: ${source.title}`,
        `URL: ${source.url}`,
        `Published: ${source.publishedAt ?? "unknown"}`,
        `Type: ${source.type}`,
        `Snippet: ${source.snippet}`
      ].join("\n")
    )
    .join("\n\n");

  return `
使用者問題：
${query}

搜尋來源：
${sourceBlock || "沒有可用來源。"}

請輸出符合下列 JSON schema 的純 JSON，不要加 Markdown：
{
  "topic": "string",
  "rebuttal": {
    "title": "可以這樣回",
    "viewpoints": [
      {
        "targetClaim": "對方錯誤論調",
        "counterPoint": "反駁觀點",
        "whyItMatters": "為什麼這對台灣重要",
        "sourceIds": ["source-1"]
      }
    ],
    "sentences": ["2 到 3 句，口語、清楚、可直接回覆錯誤論調；不要人身攻擊"],
    "sourceIds": ["source-1"]
  },
  "summary": {
    "short": "100 字以內",
    "medium": "300 字以內",
    "detailed": "較完整摘要"
  },
  "stanceGroups": {
    "blue": {
      "label": "偏藍營的意見",
      "conclusions": [
        {
          "statement": "1 到 3 個結論，描述偏藍營常見看法；不要人身攻擊",
          "sourceIds": ["source-1"]
        }
      ]
    },
    "green": {
      "label": "偏綠營的意見",
      "conclusions": [
        {
          "statement": "1 到 3 個結論，描述偏綠營常見看法；不要人身攻擊",
          "sourceIds": ["source-1"]
        }
      ]
    }
  },
  "timeline": [
    {
      "date": "YYYY-MM-DD 或空字串",
      "title": "string",
      "description": "string",
      "sourceIds": ["source-1"]
    }
  ],
  "facts": [
    {
      "statement": "已確認事實",
      "sourceIds": ["source-1"]
    }
  ],
  "uncertain": [
    {
      "statement": "尚待查證或資料不足之處",
      "sourceIds": ["source-1"]
    }
  ],
  "positions": [
    {
      "actor": "行動者或立場方",
      "position": "主要觀點",
      "reasons": ["理由"],
      "sourceIds": ["source-1"]
    }
  ],
  "misinformation": [
    {
      "statement": "常見誤解或需釐清說法",
      "sourceIds": ["source-1"]
    }
  ],
  "oneSentence": "一句話回答",
  "thirtySeconds": "30 秒回答",
  "fullAnswer": "詳細回答，需自然提到來源限制",
  "references": []
}

references 欄位請保留空陣列，系統會用搜尋結果填回完整來源。
`.trim();
}

export function buildPublicIssueToneRewritePrompt(
  query: string,
  analysis: {
    topic: string;
    oneSentence: string;
    thirtySeconds: string;
    summary: {
      short: string;
      medium: string;
      detailed: string;
    };
    rebuttal: {
      title: string;
      sentences: string[];
    };
    stanceGroups: {
      blue: {
        label: string;
        conclusions: Array<{
          statement: string;
          sourceIds: string[];
        }>;
      };
      green: {
        label: string;
        conclusions: Array<{
          statement: string;
          sourceIds: string[];
        }>;
      };
    };
  }
) {
  return `
使用者問題：
${query}

目前內容：
${JSON.stringify(analysis, null, 2)}

請把內容改寫得更自然、更接地氣、更像台灣人平常會講的話。
只改文字口氣，不改事實、不改 sourceIds、不改分類數量，不要新增新的意思。

請輸出純 JSON，格式如下：
{
  "oneSentence": "string",
  "thirtySeconds": "string",
  "summary": {
    "short": "string",
    "medium": "string",
    "detailed": "string"
  },
  "rebuttal": {
    "title": "string",
    "sentences": ["string"]
  },
  "stanceGroups": {
    "blue": {
      "label": "string",
      "conclusions": [
        {
          "statement": "string",
          "sourceIds": ["source-1"]
        }
      ]
    },
    "green": {
      "label": "string",
      "conclusions": [
        {
          "statement": "string",
          "sourceIds": ["source-1"]
        }
      ]
    }
  }
}

請保留原本的 sourceIds，不要改動數量與順序。
`.trim();
}
