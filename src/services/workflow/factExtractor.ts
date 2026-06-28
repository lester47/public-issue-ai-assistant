import type { FactItem } from "@/types/publicIssue";
import type { KnowledgeCard, RankedSource } from "./types";

export class FactExtractor {
  extract(sources: RankedSource[], cards: KnowledgeCard[]) {
    const facts: FactItem[] = [
      ...cards.flatMap((card) =>
        card.facts.map((fact) => ({
          ...fact,
          sourceIds: fact.sourceIds.length ? fact.sourceIds : []
        }))
      ),
      ...sources.slice(0, 5).map((source) => ({
        statement: `來源提到：${source.title}`,
        sourceIds: [source.id]
      }))
    ];

    const uncertain: FactItem[] = [
      {
        statement:
          "免 LLM 模式不會自行判定誰的說法完全正確；需要回到來源全文、官方文件與原始資料查證。",
        sourceIds: sources.slice(0, 3).map((source) => source.id)
      }
    ];

    return { facts, uncertain };
  }
}
