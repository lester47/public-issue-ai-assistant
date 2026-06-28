import type { KnowledgeCard } from "./types";

const KNOWLEDGE_CARDS: KnowledgeCard[] = [
  {
    id: "budget",
    topic: "中央政府總預算",
    aliases: ["總預算", "中央政府總預算", "行政院不給錢", "預算卡關"],
    keywords: ["總預算", "立法院", "行政院", "救災經費", "預算審查"],
    facts: [
      {
        statement:
          "總預算爭議需要回到預算科目、審查程序、刪減或凍結項目來判斷。",
        sourceIds: []
      }
    ],
    rebuttalAngles: [
      {
        targetClaim: "總預算過了，行政院就是故意不給錢。",
        counterPoint:
          "預算要看科目、審查內容、刪凍項目和執行程序，不能把複雜制度講成一句陰謀。",
        whyItMatters:
          "公共預算是人民的錢，台灣派要守的是透明和負責，不是被口號牽著走。"
      }
    ]
  },
  {
    id: "flood",
    topic: "台北淹水與地方防災",
    aliases: ["台北淹水", "內湖淹水", "暴雨", "水溝", "土石流"],
    keywords: ["台北", "內湖", "淹水", "暴雨", "排水", "地方防災"],
    facts: [
      {
        statement:
          "淹水原因通常需要同時檢視雨量、排水系統、地形、維護與地方政府應變。",
        sourceIds: []
      }
    ],
    rebuttalAngles: [
      {
        targetClaim: "台北淹水可以直接怪中央不給錢。",
        counterPoint:
          "淹水要看暴雨強度、排水系統、地方防災和市府應變，不能用一句話甩鍋。",
        whyItMatters:
          "災害檢討要找出哪一層治理失靈，才真的能保護台灣人的生活。"
      }
    ]
  },
  {
    id: "drone",
    topic: "無人機條例",
    aliases: ["無人機", "無人機條例", "反無人機"],
    keywords: ["無人機", "條例", "修法", "國安", "飛安"],
    facts: [
      {
        statement:
          "無人機相關議題通常涉及飛安、隱私、國安、執法權限與產業發展。",
        sourceIds: []
      }
    ],
    rebuttalAngles: [
      {
        targetClaim: "無人機條例只是一句政治口號就能說清楚。",
        counterPoint:
          "條例要回到條文、管制範圍、執法權限和實際影響討論。",
        whyItMatters:
          "制度設計會影響台灣安全與人民權利，不能被口號取代。"
      }
    ]
  }
];

export class KnowledgeCardRepository {
  findRelevant(query: string) {
    return KNOWLEDGE_CARDS.filter((card) =>
      [...card.aliases, ...card.keywords].some((term) => query.includes(term))
    );
  }
}
