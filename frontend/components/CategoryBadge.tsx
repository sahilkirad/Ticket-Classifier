interface Props {
  value?: string | null;
}

const colorMap: Record<string, string> = {
  Billing: "var(--billing)",
  Refund: "var(--refund)",
  "Technical Issue": "var(--technical)",
  Cancellation: "var(--cancellation)",
  "Product Inquiry": "var(--product)",
  General: "var(--general)",
};

export default function CategoryBadge({ value }: Props) {
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
