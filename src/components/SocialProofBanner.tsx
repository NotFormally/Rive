"use client";

type SocialProofBannerProps = {
  variant?: "dashboard" | "landing" | "pricing";
};

export function SocialProofBanner({
  variant = "dashboard",
}: SocialProofBannerProps) {
  if (variant === "dashboard") {
    return (
      <p className="font-plex-mono text-xs text-foreground opacity-60">
        Intelligence algorithmique pour la restauration gastronomique
      </p>
    );
  }

  if (variant === "pricing") {
    return (
      <div className="text-center py-6">
        <p className="font-plex-mono text-sm text-muted-foreground">
          Intelligence algorithmique pour la restauration gastronomique
        </p>
      </div>
    );
  }

  // Landing variant
  return (
    <section className="w-full py-12">
      <div className="mx-auto max-w-4xl px-4 sm:px-8 text-center">
        <p className="font-plex-mono text-lg sm:text-xl text-muted-foreground">
          Intelligence algorithmique pour la restauration gastronomique
        </p>
      </div>
    </section>
  );
}
