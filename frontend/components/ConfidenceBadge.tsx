interface Props {
  value?: number | null;
}

export default function ConfidenceBadge({ value }: Props) {
  if (value === null || value === undefined) {
    return (
      <span className="badge-ui" style={{ color: "var(--text-secondary)", backgroundColor: "color-mix(in srgb, var(--general) 12%, transparent)" }}>
        N/A
      </span>
    );
  }

  const score = Number(value);
  const color = score >= 0.85 ? "var(--success)" : score >= 0.75 ? "var(--warning)" : "var(--error)";

  return (
    <span
      className="badge-ui tabular-nums"
      style={{
        color,
        backgroundColor: `color-mix(in srgb, ${color} 15%, transparent)`,
        border: `1px solid color-mix(in srgb, ${color} 35%, transparent)`,
      }}
    >
      {(score * 100).toFixed(1)}%
    </span>
  );
}
