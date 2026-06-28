import Link from "next/link";
import { ResultSections } from "@/components/ResultSections";
import { analyzePublicIssue } from "@/services/analysis/publicIssueAnalyzer";

type AnalyzePageProps = {
  searchParams: Promise<{
    query?: string;
  }>;
};

export default async function AnalyzePage({ searchParams }: AnalyzePageProps) {
  const params = await searchParams;
  const query = params.query?.trim() ?? "";

  if (query.length < 2) {
    return (
      <main className="app-shell">
        <section className="error-panel">
          <div>
            <h1>無法完成分析</h1>
            <p>請輸入至少 2 個字的公共議題。</p>
            <Link className="text-link" href="/">
              回到首頁
            </Link>
          </div>
        </section>
      </main>
    );
  }

  const response = await analyzePublicIssue(query);

  return (
    <main className="app-shell">
      <Link className="text-link" href="/">
        ← 回到首頁
      </Link>
      <ResultSections response={response} />
    </main>
  );
}
