import type { SourceReference } from "@/types/publicIssue";

export type SearchIssueInput = {
  query: string;
  windowDays: number;
};

export type SearchProvider = {
  search(input: SearchIssueInput): Promise<SourceReference[]>;
};
