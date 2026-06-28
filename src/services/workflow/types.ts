import type {
  FactItem,
  PositionItem,
  SourceReference,
  TimelineEvent
} from "@/types/publicIssue";

export type IssueIntent =
  | "event_summary"
  | "fact_check"
  | "argument_help"
  | "background";

export type QueryPlan = {
  originalQuery: string;
  topic: string;
  intent: IssueIntent;
  keywords: string[];
  searchQuery: string;
  timeRangeDays: number;
};

export type KnowledgeCard = {
  id: string;
  topic: string;
  aliases: string[];
  keywords: string[];
  facts: FactItem[];
  rebuttalAngles: Array<{
    targetClaim: string;
    counterPoint: string;
    whyItMatters: string;
  }>;
};

export type RankedSource = SourceReference & {
  score: number;
};

export type EvidenceBundle = {
  plan: QueryPlan;
  knowledgeCards: KnowledgeCard[];
  sources: SourceReference[];
  rankedSources: RankedSource[];
  timeline: TimelineEvent[];
  facts: FactItem[];
  uncertain: FactItem[];
  positions: PositionItem[];
};
