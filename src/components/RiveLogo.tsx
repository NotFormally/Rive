export default function RiveLogo({ className = "" }: { className?: string }) {
  return (
    <span
      className={`font-outfit font-semibold uppercase tracking-[0.3em] ${className}`}
      aria-label="Rive"
    >
      RIVE
    </span>
  );
}
