// explanation about why those changes were done.
// Gives urgency a clear visual priority marker in every view.

// Internal working of code
// Selects class by urgency level and renders compact badge text.

interface Props {
  value?: string | null;
}

const colorMap: Record<string, string> = {
  Critical: "bg-red-100 text-red-800",
  High: "bg-orange-100 text-orange-800",
  Medium: "bg-yellow-100 text-yellow-800",
  Low: "bg-green-100 text-green-800",
};

export default function UrgencyBadge({ value }: Props) {
  const label = value || "Unknown";
  const tone = colorMap[label] || "bg-slate-200 text-slate-800";

  return <span className={`rounded-md px-2 py-1 text-xs font-medium ${tone}`}>{label}</span>;
}
