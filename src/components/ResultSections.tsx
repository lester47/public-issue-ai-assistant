import type { AnalyzeIssueResponse } from "@/types/publicIssue";
import { SourceList } from "./SourceList";

type ResultSectionsProps = {
  response: AnalyzeIssueResponse;
};

export function ResultSections({ response }: ResultSectionsProps) {
  const { data, meta } = response;

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
      </div>

      <section className="rebuttal-box">
        <p className="eyebrow">{data.rebuttal.title}</p>
        {data.rebuttal.viewpoints.length > 0 ? (
          <div className="viewpoint-list">
            {data.rebuttal.viewpoints.map((viewpoint) => (
              <article key={viewpoint.counterPoint}>
                <strong>{viewpoint.counterPoint}</strong>
                <p>反駁的是：{viewpoint.targetClaim}</p>
                <p>{viewpoint.whyItMatters}</p>
              </article>
            ))}
          </div>
        ) : null}
        <ol>
          {data.rebuttal.sentences.map((sentence) => (
            <li key={sentence}>{sentence}</li>
          ))}
        </ol>
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
