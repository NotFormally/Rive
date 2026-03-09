export default function RiveLogo({ className = "" }: { className?: string }) {
  return (
    <span
      className={`font-outfit tracking-[0.05em] ${className}`}
      aria-label="RiveHub"
    >
      <span className="font-semibold">Rive</span>
      <span className="font-bold">Hub</span>
    </span>
  );
}
