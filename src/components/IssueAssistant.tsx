"use client";

import { FormEvent, useRef, useState } from "react";
import type {
  AnalyzeIssueApiResponse,
  AnalyzeIssueResponse
} from "@/types/publicIssue";
import { ResultSections } from "./ResultSections";
import { VoiceInputButton } from "./VoiceInputButton";

const examples = ["最近不是在吵無人機條例嗎？", "最近總預算爭議是什麼？"];

export function IssueAssistant() {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<AnalyzeIssueResponse | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  function handleQueryChange(event: FormEvent<HTMLTextAreaElement>) {
    setQuery(event.currentTarget.value);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const currentQuery = (textareaRef.current?.value ?? query).trim();

    if (currentQuery.length < 2) {
      setError("請輸入至少 2 個字的公共議題。");
      return;
    }

    setIsLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ query: currentQuery })
      });
      const payload = (await response.json()) as AnalyzeIssueApiResponse;

      if (!payload.ok) {
        setError(payload.error.message);
        return;
      }

      setResult(payload);
    } catch {
      setError("連線失敗，請稍後再試。");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="app-shell">
      <section className="intro">
        <p className="eyebrow">Public Issue AI Assistant</p>
        <h1>AI 公共議題助手</h1>
        <p className="intro-copy">
          輸入或說出近期公共議題，系統會先搜尋來源，再整理摘要、事實、待查證資訊與各方觀點。
        </p>
      </section>

      <form
        className="query-panel"
        onSubmit={handleSubmit}
        action="/analyze"
        method="get"
      >
        <label htmlFor="query">想了解什麼議題？</label>
        <textarea
          id="query"
          name="query"
          ref={textareaRef}
          value={query}
          onChange={handleQueryChange}
          onInput={handleQueryChange}
          placeholder="例如：最近不是在吵無人機條例嗎？"
          rows={5}
        />

        <div className="actions">
          <VoiceInputButton onTranscript={setQuery} disabled={isLoading} />
          <button className="primary-button" type="submit" disabled={isLoading}>
            {isLoading ? "分析中" : "開始分析"}
          </button>
        </div>

        <div className="example-row" aria-label="範例議題">
          {examples.map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => setQuery(example)}
              disabled={isLoading}
            >
              {example}
            </button>
          ))}
        </div>
      </form>

      {isLoading ? (
        <section className="status-panel" aria-live="polite">
          <span className="spinner" aria-hidden="true" />
          <div>
            <h2>正在搜尋近期資料</h2>
            <p>會優先整理最近 2 到 4 週的新聞、官方資料、法案與事實查核來源。</p>
          </div>
        </section>
      ) : null}

      {error ? (
        <section className="error-panel" aria-live="polite">
          <h2>無法完成分析</h2>
          <p>{error}</p>
        </section>
      ) : null}

      {result ? <ResultSections response={result} /> : null}
    </main>
  );
}
