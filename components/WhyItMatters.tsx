export function WhyItMatters({ text }: { text: string }) {
  const [primary, ...rest] = text.split(/(?<=\.)\s+/);
  return (
    <section className="matters section-shell" aria-labelledby="matters-title">
      <p className="eyebrow">04 / Why it matters</p>
      <h2 id="matters-title">{primary}</h2>
      {rest.length > 0 && <p>{rest.join(" ")}</p>}
      <span className="matters-arrow" aria-hidden="true">
        ↗
      </span>
    </section>
  );
}
