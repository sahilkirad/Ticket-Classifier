// explanation about why those changes were done.
// Provides consistent category styling anywhere category is displayed.

// Internal working of code
// Maps known categories to fixed color classes and falls back to neutral tone.

interface Props {
  value?: string | null;
}

const colorMap: Record<string, string> = {
  Billing: "bg-blue-100 text-blue-800",
  Refund: "bg-cyan-100 text-cyan-800",
  "Technical Issue": "bg-indigo-100 text-indigo-800",
  Cancellation: "bg-orange-100 text-orange-800",
  "Product Inquiry": "bg-emerald-100 text-emerald-800",
  General: "bg-slate-200 text-slate-800",
};

export default function CategoryBadge({ value }: Props) {
  const label = value || "Unknown";
  const tone = colorMap[label] || "bg-slate-200 text-slate-800";

  return <span className={`rounded-md px-2 py-1 text-xs font-medium ${tone}`}>{label}</span>;
}
