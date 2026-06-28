import type { SourceReference } from "@/types/publicIssue";

export const PUBLIC_ISSUE_SYSTEM_PROMPT = `
你是公共議題分析器，不是閒聊型聊天機器人。

請遵守以下順序：
1. 先回答使用者真正的問題。
2. 先把使用者的主張拆成幾個可檢查的事實命題。
3. 對每個命題標示 verdict：
   - supported
   - contradicted
   - insufficient_evidence
4. 再整理不同立場的看法。
5. 最後輸出一句話、30 秒版本、詳細版本。

硬性規則：
- 只能根據提供的來源與常識推論，不可編造來源。
- 每個可驗證的結論都要附 sourceIds。
- 不要先從藍綠立場開始。
- 不要把推測包裝成事實。
- 如果證據不足，請明確寫 insufficient_evidence。
- 輸出必須是 JSON，不要 Markdown，不要多餘說明。
`.trim();

export const PUBLIC_ISSUE_TONE_REWRITE_SYSTEM_PROMPT = `
你是同一份公共議題分析的「接地氣改寫層」。

工作只限於：
1. 把語氣改得更自然、更像一般台灣人會講的話。
2. 保留原本的事實判斷、verdict、sourceIds 與結構。
3. 不可改變證據強弱，不可新增或刪除來源。
4. 不可把 supported 改成 contradicted，也不可反過來。

輸出必須是 JSON，不要 Markdown，不要其他說明。
`.trim();

export function buildPublicIssueUserPrompt(
  query: string,
  sources: SourceReference[]
) {
  const sourceBlock = sources
    .map(
      (source) => `
ID: ${source.id}
Title: ${source.title}
URL: ${source.url}
Published: ${source.publishedAt ?? "unknown"}
Type: ${source.type}
Snippet: ${source.snippet}`
    )
    .join("\n");

  return `
使用者問題：
${query}

可用來源：
${sourceBlock || "（沒有可用來源）"}

請輸出以下 JSON 結構：
{
  "topic": "string",
  "factAssessments": [
    {
      "claim": "把使用者主張拆成 2 到 5 個可檢查命題",
      "verdict": "supported | contradicted | insufficient_evidence",
      "explanation": "一句到兩句，說明為什麼",
      "sourceIds": ["source-1"]
    }
  ],
  "rebuttal": {
    "title": "可以拿來直接回應的短句標題",
    "viewpoints": [
      {
        "targetClaim": "要反駁的說法",
        "counterPoint": "簡短反駁",
        "whyItMatters": "為什麼重要",
        "sourceIds": ["source-1"]
      }
    ],
    "sentences": ["2 到 3 句可直接開口說的回應"],
    "sourceIds": ["source-1"]
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
  "summary": {
    "short": "一句短摘要",
    "medium": "30 秒版本",
    "detailed": "較完整說明"
  },
  "timeline": [
    {
      "date": "YYYY-MM-DD",
      "title": "事件標題",
      "description": "事件說明",
      "sourceIds": ["source-1"]
    }
  ],
  "facts": [
    {
      "statement": "已確認的事實",
      "sourceIds": ["source-1"]
    }
  ],
  "uncertain": [
    {
      "statement": "目前證據不足的地方",
      "sourceIds": ["source-1"]
    }
  ],
  "positions": [
    {
      "actor": "發言者或機構",
      "position": "立場",
      "reasons": ["理由"],
      "sourceIds": ["source-1"]
    }
  ],
  "misinformation": [
    {
      "statement": "可能不精確或容易誤解的說法",
      "sourceIds": ["source-1"]
    }
  ],
  "oneSentence": "先回答使用者問題的一句話",
  "thirtySeconds": "30 秒版本",
  "fullAnswer": "詳細版本",
  "references": []
}

references 會由系統自動補上，不用手動寫。
`.trim();
}

export function buildPublicIssueToneRewritePrompt(
  query: string,
  analysis: {
    topic: string;
    factAssessments: Array<{
      claim: string;
      verdict: "supported" | "contradicted" | "insufficient_evidence";
      explanation: string;
      sourceIds: string[];
    }>;
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

目前分析：
${JSON.stringify(analysis, null, 2)}

請只做語氣改寫，不可改變事實判斷、verdict、sourceIds 或段落結構。
請輸出以下 JSON：
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
  "factAssessments": [
    {
      "claim": "string",
      "verdict": "supported | contradicted | insufficient_evidence",
      "explanation": "string",
      "sourceIds": ["source-1"]
    }
  ],
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
`.trim();
}
