import type { SourceReference } from "@/types/publicIssue";

type SourceListProps = {
  sources: SourceReference[];
};

export function SourceList({ sources }: SourceListProps) {
  return (
    <section className="source-section">
      <div className="source-heading">
        <p className="eyebrow">References</p>
        <h2>資料來源</h2>
      </div>

      <div className="source-list">
        {sources.map((source) => (
          <article key={source.id} className="source-item">
            <div>
              <span>{source.id}</span>
              <strong>{source.title}</strong>
            </div>
            <p>{source.snippet}</p>
            <a href={source.url} target="_blank" rel="noreferrer">
              開啟來源
            </a>
          </article>
        ))}
      </div>
    </section>
  );
}
