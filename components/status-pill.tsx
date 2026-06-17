import clsx from "clsx";

export default function StatusPill({ label }: { label: string }) {
  const isLive = label.includes("live");

  return (
    <span
      className={clsx(
        "mono inline-flex h-8 max-w-56 items-center truncate whitespace-nowrap rounded-md border px-3 text-[11px] uppercase",
        isLive ? "border-[#32cd7f] text-[#32cd7f]" : "border-white/20 text-white/65"
      )}
    >
      {label}
    </span>
  );
}
