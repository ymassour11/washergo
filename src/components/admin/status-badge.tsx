const STATUS_CONFIG: Record<string, { bg: string; dot: string; text: string }> = {
  DRAFT:            { bg: "bg-stone-100",  dot: "bg-stone-400",  text: "text-stone-600" },
  QUALIFIED:        { bg: "bg-sky-50",     dot: "bg-sky-500",    text: "text-sky-700" },
  SCHEDULED:        { bg: "bg-blue-50",    dot: "bg-blue-500",   text: "text-blue-700" },
  PAID_SETUP:       { bg: "bg-violet-50",  dot: "bg-violet-500", text: "text-violet-700" },
  CONTRACT_SIGNED:  { bg: "bg-teal-50",    dot: "bg-teal-500",   text: "text-teal-700" },
  ACTIVE:           { bg: "bg-green-50",   dot: "bg-green-500",  text: "text-green-700" },
  PAST_DUE:         { bg: "bg-red-50",     dot: "bg-red-500",    text: "text-red-700" },
  CANCELED:         { bg: "bg-stone-50",   dot: "bg-stone-400",  text: "text-stone-500" },
  CLOSED:           { bg: "bg-stone-100",  dot: "bg-stone-400",  text: "text-stone-600" },
};

export function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.DRAFT;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full ${config.bg} px-2.5 py-1 text-xs font-bold ${config.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {status.replace(/_/g, " ")}
    </span>
  );
}
