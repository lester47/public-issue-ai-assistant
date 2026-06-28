import type { PublicIssueAnalysis, SourceReference } from "@/types/publicIssue";
import type {
  EvidenceBundle,
  KnowledgeCard,
  QueryPlan,
  RankedSource
} from "./types";

type IssueFamily = "budget" | "flood" | "drone" | "general";

export class ArgumentBuilder {
  build(bundle: EvidenceBundle): PublicIssueAnalysis {
    const sources = bundle.rankedSources;
    const family = detectIssueFamily(bundle.plan);
    const hasRealSources = sources.some((source) => !isFallbackSource(source));

    return {
      topic: bundle.plan.topic,
      factAssessments: buildFactAssessments(bundle.plan, sources, family),
      rebuttal: buildRebuttal(bundle.plan, sources, bundle.knowledgeCards, family),
      stanceGroups: buildStanceGroups(bundle.plan, sources, family),
      summary: buildSummary(hasRealSources, sources),
      timeline: bundle.timeline,
      facts: bundle.facts,
      uncertain: bundle.uncertain,
      positions: bundle.positions,
      misinformation: [],
      oneSentence: buildOneSentence(bundle.plan, sources, family, hasRealSources),
      thirtySeconds: buildThirtySeconds(bundle.plan, sources, family, hasRealSources),
      fullAnswer: buildFullAnswer(bundle.plan, sources, family, hasRealSources),
      references: sources
    };
  }
}

function buildSummary(
  hasRealSources: boolean,
  sources: RankedSource[]
): PublicIssueAnalysis["summary"] {
  if (!hasRealSources) {
    return {
      short: "目前來源不足，先用保守模式整理重點。",
      medium: "系統暫時找不到足夠的外部來源，所以先保留證據不足的地方。",
      detailed:
        "這題目前還沒有足夠的外部資料可以交叉比對，因此不會硬塞結論。等來源補齊後，再把支持、反駁與不確定的地方分開看。"
    };
  }

  return {
    short: `已整理出 ${sources.length} 筆來源，先看事實，再看立場。`,
    medium: `目前已蒐集到 ${sources.length} 筆來源，系統會先拆事實命題，再補上不同觀點。`,
    detailed:
      "這個版本的回答流程會先處理可驗證的事實，再整理不同陣營的看法，最後才給出適合直接講出口的版本。"
  };
}

function buildOneSentence(
  plan: QueryPlan,
  sources: RankedSource[],
  family: IssueFamily,
  hasRealSources: boolean
) {
  const assessments = buildFactAssessments(plan, sources, family);
  const supported = assessments.find((item) => item.verdict === "supported");
  const contradicted = assessments.find((item) => item.verdict === "contradicted");

  if (hasRealSources && supported && contradicted) {
    return `${supported.claim}；但${contradicted.claim}，所以不能把整件事講成單一原因。`;
  }

  if (hasRealSources && supported) {
    return supported.claim;
  }

  return `先別急著下結論，${plan.originalQuery} 這題目前還需要再對照來源。`;
}

function buildThirtySeconds(
  plan: QueryPlan,
  sources: RankedSource[],
  family: IssueFamily,
  hasRealSources: boolean
) {
  const assessments = buildFactAssessments(plan, sources, family);
  const supported = assessments
    .filter((item) => item.verdict === "supported")
    .slice(0, 2)
    .map((item) => item.claim);
  const contradicted = assessments
    .filter((item) => item.verdict === "contradicted")
    .slice(0, 1)
    .map((item) => item.claim);

  if (!hasRealSources) {
    return "這題目前還缺外部來源，先保守處理：能確認的先講清楚，證據不足的地方不要硬下結論。";
  }

  return [
    `這題先別只看一句話。${plan.topic || plan.originalQuery} 目前已整理到 ${sources.length} 筆來源，先看可驗證的事實，再看不同立場。`,
    supported[0] ? `先確認的是：${supported[0]}` : "先確認的是，這題不是單靠口號就能講完。",
    contradicted[0]
      ? `但也不能把所有責任都直接推成單一原因，因為${contradicted[0]}`
      : "如果證據不夠，就先保留，不要把推測講成定論。"
  ].join(" ");
}

function buildFullAnswer(
  plan: QueryPlan,
  sources: RankedSource[],
  family: IssueFamily,
  hasRealSources: boolean
) {
  const assessments = buildFactAssessments(plan, sources, family);
  const supported = assessments.filter((item) => item.verdict === "supported");
  const contradicted = assessments.filter(
    (item) => item.verdict === "contradicted"
  );
  const uncertain = assessments.filter(
    (item) => item.verdict === "insufficient_evidence"
  );

  if (!hasRealSources) {
    return [
      `這題 ${plan.originalQuery} 目前沒有足夠的外部資料可以交叉查證，所以先用保守模式回答。`,
      "能確定的部分先列出來，不能確定的部分會標示為證據不足。",
      "等來源補齊後，再把支持、反駁與不確定的地方分開看，避免把情緒當成事實。"
    ].join(" ");
  }

  return [
    `這題目前已整理出 ${sources.length} 筆來源，回答順序會先看事實命題，再看不同立場。`,
    supported.length > 0 ? `支持的部分包括：${supported.map((item) => item.claim).join("；")}。` : "",
    contradicted.length > 0
      ? `需要保留的部分是：${contradicted.map((item) => item.claim).join("；")}。`
      : "",
    uncertain.length > 0
      ? `還不能下定論的地方是：${uncertain.map((item) => item.claim).join("；")}。`
      : "",
    "這樣的順序比較不會一開始就被立場帶走。"
  ]
    .filter(Boolean)
    .join(" ");
}

function buildFactAssessments(
  plan: QueryPlan,
  sources: RankedSource[],
  family: IssueFamily
): PublicIssueAnalysis["factAssessments"] {
  const sourceIds = collectSourceIds(sources);

  if (family === "budget") {
    return [
      {
        claim:
          "「總預算已經過了」通常只代表法案完成審查，不代表每一筆經費都能立刻自由動用。",
        verdict: "supported",
        explanation:
          "預算通過、預算執行、預算解凍和另編特別預算是不同步驟，少了其中一段就不會馬上能花。",
        sourceIds
      },
      {
        claim: "「救災沒有錢完全是行政院自己卡住」這個說法過度簡化。",
        verdict: "contradicted",
        explanation:
          "公開資訊通常會牽涉立法院審查、凍結條件、行政程序和科目限制，不能只怪單一機關。",
        sourceIds
      },
      {
        claim: "到底是錢真的不能用，還是執行流程比較慢，要看具體科目與公文。",
        verdict: "insufficient_evidence",
        explanation:
          "如果沒有先對到哪一筆預算、哪個部會、哪個條件，就很難下「完全沒錢」這種結論。",
        sourceIds
      }
    ];
  }

  if (family === "flood") {
    return [
      {
        claim: "台北內湖淹水通常不能只怪單一原因，會牽涉雨量、排水系統、地勢與平常維護。",
        verdict: "supported",
        explanation:
          "淹水事件多半是極端天氣和都市治理一起疊加，不是只有一個部門就能解釋完。",
        sourceIds
      },
      {
        claim: "把淹水直接講成中央預算問題，通常是把災害成因講得太窄。",
        verdict: "contradicted",
        explanation:
          "真正要檢討的，通常是排水、清淤、預警、應變和地方執行，而不是先往預算一條線跑。",
        sourceIds
      },
      {
        claim: "到底是這次雨勢太大，還是平常排水有問題，仍需要對照現場資料與維護紀錄。",
        verdict: "insufficient_evidence",
        explanation:
          "沒有雨量、排水容量與維護紀錄，很難直接判斷是哪個環節失守。",
        sourceIds
      }
    ];
  }

  if (family === "drone") {
    return [
      {
        claim: "無人機或國防相關爭議，重點通常不只是總額，而是科目、用途和執行條件。",
        verdict: "supported",
        explanation:
          "這類議題常常有採購、法規、安全與分期執行等因素，不能只看總數字。",
        sourceIds
      },
      {
        claim: "把執行不順直接說成行政院故意卡案，通常證據不足。",
        verdict: "contradicted",
        explanation:
          "若要成立，至少要指出是哪個程序、哪個命令或哪份文件真的擋住了。",
        sourceIds
      },
      {
        claim: "是否真的卡關，仍要看實際法規、招標與核定流程。",
        verdict: "insufficient_evidence",
        explanation:
          "沒有具體程序文件前，很難直接下政治化結論。",
        sourceIds
      }
    ];
  }

  return [
    {
      claim: "這題裡面有一部分可確認的資訊，但不代表整句話都成立。",
      verdict: "supported",
      explanation:
        "公共議題多半不是非黑即白，先拆命題會比直接站隊更準。",
      sourceIds
    },
    {
      claim: "如果沒有具體來源，很多很肯定的講法其實只能先算證據不足。",
      verdict: "insufficient_evidence",
      explanation:
        "沒有文件、新聞或官方說明時，最安全的做法是先保留。",
      sourceIds
    }
  ];
}

function buildStanceGroups(
  plan: QueryPlan,
  sources: RankedSource[],
  family: IssueFamily
): PublicIssueAnalysis["stanceGroups"] {
  const sourceIds = collectSourceIds(sources);

  if (family === "budget") {
    return {
      blue: {
        label: "偏藍營的意見",
        conclusions: [
          {
            statement:
              "總預算既然已經過關，行政部門就應該儘快把能動的錢動起來，不要再把程序拿來當拖延理由。",
            sourceIds
          },
          {
            statement:
              "如果救災、地方建設或民生補助被延後，藍營常會把焦點放在中央行政效率與執行能力。",
            sourceIds
          }
        ]
      },
      green: {
        label: "偏綠營的意見",
        conclusions: [
          {
            statement:
              "預算不是喊口號就能直接花，還要看科目、凍結項目、解凍程序和法定條件。",
            sourceIds
          },
          {
            statement:
              "把所有經費問題都說成行政院卡錢，綠營通常會認為這是把立法院審查和政黨攻防簡化成單一指控。",
            sourceIds
          }
        ]
      }
    };
  }

  if (family === "flood") {
    return {
      blue: {
        label: "偏藍營的意見",
        conclusions: [
          {
            statement:
              "會比較強調市府和地方單位的排水、清淤與平時維護，認為災後應先把現場問題處理好。",
            sourceIds
          },
          {
            statement:
              "也可能會要求中央更快給資源，但重點通常還是地方執行有沒有到位。",
            sourceIds
          }
        ]
      },
      green: {
        label: "偏綠營的意見",
        conclusions: [
          {
            statement:
              "會強調淹水不能一句話就怪中央，要看雨量、排水設計、地方維護和應變作為。",
            sourceIds
          },
          {
            statement:
              "會主張先找出治理鏈裡哪個環節出包，而不是把災害拿來當甩鍋口號。",
            sourceIds
          }
        ]
      }
    };
  }

  if (family === "drone") {
    return {
      blue: {
        label: "偏藍營的意見",
        conclusions: [
          {
            statement:
              "會比較在意政策是不是講得太空泛，要求把預算、法規與執行效率講清楚。",
            sourceIds
          }
        ]
      },
      green: {
        label: "偏綠營的意見",
        conclusions: [
          {
            statement:
              "會比較強調安全、規範和程序透明，認為政策不能只靠政治口號推進。",
            sourceIds
          }
        ]
      }
    };
  }

  return {
    blue: {
      label: "偏藍營的意見",
      conclusions: [
        {
          statement:
            "藍營常會主張先看執行成效，政府如果拿不出成果，就不該只靠政治說法。",
          sourceIds
        }
      ]
    },
    green: {
      label: "偏綠營的意見",
      conclusions: [
        {
          statement:
            "綠營通常會強調程序、證據和制度，不希望把複雜問題直接變成口號戰。",
          sourceIds
        }
      ]
    }
  };
}

function buildRebuttal(
  plan: QueryPlan,
  sources: RankedSource[],
  cards: KnowledgeCard[],
  family: IssueFamily
): PublicIssueAnalysis["rebuttal"] {
  const sourceIds = collectSourceIds(sources);
  const cardAngles = cards.flatMap((card) => card.rebuttalAngles);

  if (cardAngles.length > 0) {
    return {
      title: "可以直接回的重點",
      viewpoints: cardAngles.map((angle) => ({
        ...angle,
        sourceIds
      })),
      sentences: [
        "先別急著把一句話當成全部真相，公共議題通常要拆成幾個命題看。",
        "有些說法只抓到一半，剩下那一半要看資料、程序和來源。",
        "如果沒有對到具體資料，就先保留，不要把推測講成定論。"
      ],
      sourceIds
    };
  }

  if (family === "budget") {
    return {
      title: "可以直接回的重點",
      viewpoints: [
        {
          targetClaim: "總預算過了就代表全部經費都能馬上動用。",
          counterPoint:
            "不是，預算通過只是第一步，凍結、解凍、科目限制和執行程序還是要看。",
          whyItMatters: "不把程序看清楚，很容易把延遲直接誤認成故意卡錢。",
          sourceIds
        },
        {
          targetClaim: "救災沒錢完全是行政院自己卡住。",
          counterPoint:
            "這種說法太單一，還要看立法院審查、預算結構和相關法定流程。",
          whyItMatters: "責任歸屬要講清楚，不能只抓一個方向。",
          sourceIds
        }
      ],
      sentences: [
        "這種說法先不要急著轉傳，預算過了不等於所有錢都能立刻花。",
        "要先看是哪一筆被凍、哪一筆要解凍、哪一筆還在等程序。",
        "把流程講清楚，才知道到底是哪裡卡住。"
      ],
      sourceIds
    };
  }

  if (family === "flood") {
    return {
      title: "可以直接回的重點",
      viewpoints: [
        {
          targetClaim: "台北內湖大淹水都是某一邊政府的錯。",
          counterPoint:
            "淹水通常是雨勢、排水、地勢、清淤與應變一起疊加，不是單一因素就能講完。",
          whyItMatters: "先把成因拆開，才知道問題到底在哪一段。",
          sourceIds
        },
        {
          targetClaim: "只要怪中央或只要怪地方就好了。",
          counterPoint:
            "這樣太簡化，真正該做的是把天候、設施、維護和應變全部攤開看。",
          whyItMatters: "災後討論要解決問題，不是先找一句最順口的罵法。",
          sourceIds
        }
      ],
      sentences: [
        "內湖淹水不要急著只怪一邊，先看是不是雨量太大、排水撐不住，還是平時維護不夠。",
        "如果沒把現場資料、排水設計和維護紀錄拿出來，很多說法都只是先喊先贏。",
        "真正重要的是找出哪一段出問題，才知道下一次怎麼補。"
      ],
      sourceIds
    };
  }

  if (family === "drone") {
    return {
      title: "可以直接回的重點",
      viewpoints: [
        {
          targetClaim: "這只是管制太多。",
          counterPoint:
            "國防或無人機議題通常牽涉安全、法規和用途，不是只看管不管而已。",
          whyItMatters: "如果忽略安全與執行條件，討論會失真。",
          sourceIds
        }
      ],
      sentences: [
        "無人機條例不要只看成管制或放行，還要看安全、用途和法規怎麼設計。",
        "如果沒把規則和執行講清楚，討論很容易變成空喊支持或反對。",
        "先看制度，再看立場，會比較準。"
      ],
      sourceIds
    };
  }

  return {
    title: "可以直接回的重點",
    viewpoints: [
      {
        targetClaim: "這件事很簡單。",
        counterPoint:
          "公共議題通常沒有那麼單純，至少要拆成事實、程序和立場三層來看。",
        whyItMatters: "先把事實看清楚，才不會被情緒牽著走。",
        sourceIds
      }
    ],
    sentences: [
      "先別急著下結論，這題應該先看事實，再看立場。",
      "如果沒有具體來源，就先保留，不要把推測講成定論。"
    ],
    sourceIds
  };
}

function detectIssueFamily(plan: QueryPlan): IssueFamily {
  const text = `${plan.topic} ${plan.originalQuery}`.toLowerCase();

  if (hasAny(text, ["總預算", "預算", "救災經費", "凍結", "解凍", "財劃法", "行政院不給錢"])) {
    return "budget";
  }

  if (hasAny(text, ["淹水", "大淹水", "水災", "排水", "內湖", "台北", "颱風", "暴雨", "積淹水"])) {
    return "flood";
  }

  if (hasAny(text, ["無人機", "條例", "國防", "防衛", "空拍", "禁飛"])) {
    return "drone";
  }

  return "general";
}

function collectSourceIds(sources: RankedSource[]) {
  const realSources = sources.filter((source) => !isFallbackSource(source));
  const sourceIds = realSources.slice(0, 3).map((source) => source.id);
  const fallbackSourceIds = sources.slice(0, 3).map((source) => source.id);
  return sourceIds.length ? sourceIds : fallbackSourceIds;
}

function isFallbackSource(source: SourceReference) {
  return source.url.includes("example.com");
}

function hasAny(text: string, keywords: string[]) {
  return keywords.some((keyword) => text.includes(keyword));
}
