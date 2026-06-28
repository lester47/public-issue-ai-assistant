"use client";

import type { AnalyzeIssueResponse } from "@/types/publicIssue";
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
                  {isRetrying ? "重新搜尋中" : "重新搜尋來源"}
                </button>
              )
            ) : null}
          </div>
        ) : null}
      </div>

      <section className="rebuttal-box">
        <p className="eyebrow">一句話結論</p>
        <p className="rebuttal-conclusion">{rebuttalConclusion}</p>
        {data.rebuttal.sourceIds.length > 0 ? (
          <small>來源：{data.rebuttal.sourceIds.join(", ")}</small>
        ) : null}
      </section>

      <Accordion title="30 秒回答" defaultOpen>
        <p>{data.thirtySeconds}</p>
      </Accordion>

      <Accordion title="事件摘要" defaultOpen>
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
          <p>目前來源不足，尚未整理出可靠時間線。</p>
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
          <p>目前來源不足，尚未整理出可歸因的主要觀點。</p>
        )}
      </Accordion>

      <Accordion title="詳細回答">
        <p>{data.fullAnswer}</p>
      </Accordion>

      <SourceList sources={data.references} />
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

function FactList({
  items
}: {
  items: Array<{ statement: string; sourceIds: string[] }>;
}) {
  if (items.length === 0) {
    return <p>目前來源不足，尚未能確認。</p>;
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
