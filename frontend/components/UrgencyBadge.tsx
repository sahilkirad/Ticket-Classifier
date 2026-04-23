interface Props {
  value?: string | null;
}

const colorMap: Record<string, string> = {
  Critical: "var(--critical)",
  High: "var(--high)",
  Medium: "var(--medium)",
  Low: "var(--low)",
};

export default function UrgencyBadge({ value }: Props) {
  const label = value || "Unknown";
  const color = colorMap[label] || "var(--general)";

  return (
    <span
      className="badge-ui"
      style={{
        color,
        backgroundColor: `color-mix(in srgb, ${color} 15%, transparent)`,
        border: `1px solid color-mix(in srgb, ${color} 35%, transparent)`,
      }}
    >
      {label}
    </span>
  );
}
