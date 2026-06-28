"use client";

import type { AnalyzeIssueResponse, FactAssessment } from "@/types/publicIssue";
import { SourceList } from "./SourceList";

type ResultSectionsProps = {
  response: AnalyzeIssueResponse;
  newQuestionHref?: string;
  retryHref?: string;
  onRetry?: () => void;
  isRetrying?: boolean;
};

export function ResultSections({
  response,
  newQuestionHref,
  retryHref,
  onRetry,
  isRetrying = false
}: ResultSectionsProps) {
  const { data, meta } = response;
  const rebuttalConclusion =
    data.rebuttal.sentences[0] ||
    data.rebuttal.viewpoints[0]?.counterPoint ||
    data.oneSentence;
  const canRetry = meta.usedFallback && (Boolean(retryHref) || Boolean(onRetry));

  return (
    <section className="results" aria-live="polite">
      <div className="result-header">
        <div>
          <p className="eyebrow">分析結果</p>
          <h2>{data.topic}</h2>
        </div>
        <span className={meta.usedFallback ? "badge warning" : "badge"}>
          {meta.usedFallback ? "保守模式" : "已附來源"}
        </span>
      </div>

      <div className="answer-strip">
        <p>{data.oneSentence}</p>
        {newQuestionHref || canRetry ? (
          <div className="result-action-row">
            {newQuestionHref ? (
              <a className="new-question-button" href={newQuestionHref}>
                問下一題
              </a>
            ) : null}
            {canRetry ? (
              retryHref ? (
                <a className="retry-button" href={retryHref}>
                  重新搜尋來源
                </a>
              ) : (
                <button
                  className="retry-button"
                  type="button"
                  onClick={onRetry}
                  disabled={isRetrying}
                >
                  {isRetrying ? "重新搜尋中..." : "重新搜尋來源"}
                </button>
              )
            ) : null}
          </div>
        ) : null}
      </div>

      <section className="fact-check-section">
        <p className="eyebrow">先看事實</p>
        <div className="fact-check-grid">
          {data.factAssessments.map((item, index) => (
            <FactAssessmentCard key={`${item.claim}-${index}`} item={item} />
          ))}
        </div>
      </section>

      <section className="rebuttal-box">
        <p className="eyebrow">可以直接回的話</p>
        <p className="rebuttal-conclusion">{rebuttalConclusion}</p>
        {data.rebuttal.sourceIds.length > 0 ? (
          <small>來源：{data.rebuttal.sourceIds.join(", ")}</small>
        ) : null}
      </section>

      <section className="stance-section">
        <p className="eyebrow">不同立場</p>
        <div className="stance-grid">
          <StanceCard group={data.stanceGroups.blue} tone="blue" />
          <StanceCard group={data.stanceGroups.green} tone="green" />
        </div>
      </section>

      <details className="more-details">
        <summary>查看更多來源與細節</summary>
        <div className="more-details-body">
          <Accordion title="30 秒版本">
            <p>{data.thirtySeconds}</p>
          </Accordion>

          <Accordion title="摘要">
            <p>{data.summary.medium}</p>
          </Accordion>

          <Accordion title="最近進度">
            {data.timeline.length > 0 ? (
              <ol className="timeline">
                {data.timeline.map((item, index) => (
                  <li key={`${item.title}-${index}`}>
                    <span>{item.date || "日期待確認"}</span>
                    <strong>{item.title}</strong>
                    <p>{item.description}</p>
                  </li>
                ))}
              </ol>
            ) : (
              <p>目前還沒有足夠的時間軸資料。</p>
            )}
          </Accordion>

          <Accordion title="已確認事實">
            <FactList items={data.facts} />
          </Accordion>

          <Accordion title="待查證">
            <FactList items={data.uncertain} />
          </Accordion>

          <Accordion title="主要觀點">
            {data.positions.length > 0 ? (
              <div className="position-list">
                {data.positions.map((item, index) => (
                  <article key={`${item.actor}-${index}`}>
                    <h3>{item.actor}</h3>
                    <p>{item.position}</p>
                    {item.reasons.length > 0 ? (
                      <ul>
                        {item.reasons.map((reason) => (
                          <li key={reason}>{reason}</li>
                        ))}
                      </ul>
                    ) : null}
                  </article>
                ))}
              </div>
            ) : (
              <p>目前還沒有足夠的立場資料。</p>
            )}
          </Accordion>

          <Accordion title="詳細回答">
            <p>{data.fullAnswer}</p>
          </Accordion>

          <SourceList sources={data.references} />
        </div>
      </details>
    </section>
  );
}

function Accordion({
  title,
  children,
  defaultOpen = false
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <details className="accordion" open={defaultOpen}>
      <summary>{title}</summary>
      <div className="accordion-body">{children}</div>
    </details>
  );
}

function FactAssessmentCard({ item }: { item: FactAssessment }) {
  return (
    <article className={`fact-assessment ${item.verdict}`}>
      <div className="fact-assessment-head">
        <span className="fact-assessment-badge">{verdictLabel(item.verdict)}</span>
        <p>{item.claim}</p>
      </div>
      <p className="fact-assessment-body">{item.explanation}</p>
      {item.sourceIds.length > 0 ? (
        <small>來源：{item.sourceIds.join(", ")}</small>
      ) : null}
    </article>
  );
}

function verdictLabel(verdict: FactAssessment["verdict"]) {
  switch (verdict) {
    case "supported":
      return "支持";
    case "contradicted":
      return "反駁";
    default:
      return "證據不足";
  }
}

function StanceCard({
  group,
  tone
}: {
  group: {
    label: string;
    conclusions: Array<{ statement: string; sourceIds: string[] }>;
  };
  tone: "blue" | "green";
}) {
  return (
    <article className={`stance-card ${tone}`}>
      <h3>{group.label}</h3>
      <ol>
        {group.conclusions.slice(0, 3).map((item) => (
          <li key={item.statement}>
            <span>{item.statement}</span>
            {item.sourceIds.length > 0 ? (
              <small>來源：{item.sourceIds.join(", ")}</small>
            ) : null}
          </li>
        ))}
      </ol>
    </article>
  );
}

function FactList({
  items
}: {
  items: Array<{ statement: string; sourceIds: string[] }>;
}) {
  if (items.length === 0) {
    return <p>目前還沒有足夠的查證項目。</p>;
  }

  return (
    <ul className="fact-list">
      {items.map((item, index) => (
        <li key={`${item.statement}-${index}`}>
          <span>{item.statement}</span>
          {item.sourceIds.length > 0 ? (
            <small>來源：{item.sourceIds.join(", ")}</small>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
