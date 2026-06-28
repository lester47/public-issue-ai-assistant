export type SourceType =
  | "news"
  | "official"
  | "bill"
  | "press"
  | "fact-check"
  | "background"
  | "unknown";

export type SourceReference = {
  id: string;
  title: string;
  url: string;
  snippet: string;
  sourceName?: string;
  publishedAt?: string;
  retrievedAt: string;
  type: SourceType;
};

export type TimelineEvent = {
  date?: string;
  title: string;
  description: string;
  sourceIds: string[];
};

export type FactItem = {
  statement: string;
  sourceIds: string[];
};

export type PositionItem = {
  actor: string;
  position: string;
  reasons: string[];
  sourceIds: string[];
};

export type StanceConclusion = {
  statement: string;
  sourceIds: string[];
};

export type StanceGroup = {
  label: string;
  conclusions: StanceConclusion[];
};

export type FactAssessmentVerdict =
  | "supported"
  | "contradicted"
  | "insufficient_evidence";

export type FactAssessment = {
  claim: string;
  verdict: FactAssessmentVerdict;
  explanation: string;
  sourceIds: string[];
};

export type PublicIssueAnalysis = {
  topic: string;
  factAssessments: FactAssessment[];
  rebuttal: {
    title: string;
    viewpoints: Array<{
      targetClaim: string;
      counterPoint: string;
      whyItMatters: string;
      sourceIds: string[];
    }>;
    sentences: string[];
    sourceIds: string[];
  };
  stanceGroups: {
    blue: StanceGroup;
    green: StanceGroup;
  };
  summary: {
    short: string;
    medium: string;
    detailed: string;
  };
  timeline: TimelineEvent[];
  facts: FactItem[];
  uncertain: FactItem[];
  positions: PositionItem[];
  misinformation: FactItem[];
  oneSentence: string;
  thirtySeconds: string;
  fullAnswer: string;
  references: SourceReference[];
};

export type AnalyzeIssueRequest = {
  query: string;
};

export type AnalyzeIssueResponse = {
  ok: true;
  data: PublicIssueAnalysis;
  meta: {
    query: string;
    searchedAt: string;
    searchWindowDays: number;
    usedFallback: boolean;
  };
};

export type AnalyzeIssueErrorResponse = {
  ok: false;
  error: {
    code: "bad_request" | "search_failed" | "llm_failed" | "unknown";
    message: string;
  };
};

export type AnalyzeIssueApiResponse =
  | AnalyzeIssueResponse
  | AnalyzeIssueErrorResponse;
