// explanation about why those changes were done.
// Shows confidence in a readable, color-coded way across submission/review/routing pages.

// Internal working of code
// Badge color changes by threshold bands and displays formatted percentage.

interface Props {
  value?: number | null;
}

export default function ConfidenceBadge({ value }: Props) {
  if (value === null || value === undefined) {
    return <span className="rounded-md bg-slate-200 px-2 py-1 text-xs">N/A</span>;
  }

  const score = Number(value);
  const tone =
    score >= 0.85
      ? "bg-green-100 text-green-800"
      : score >= 0.75
        ? "bg-amber-100 text-amber-800"
        : "bg-red-100 text-red-800";

  return (
    <span className={`rounded-md px-2 py-1 text-xs font-medium ${tone}`}>
      {(score * 100).toFixed(1)}%
    </span>
  );
}
