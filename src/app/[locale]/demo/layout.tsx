"use client";

import { useEffect } from "react";

export default function DemoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    const body = document.body;
    const original = body.style.backgroundColor;
    body.style.backgroundColor = "#0B0F15";
    return () => {
      body.style.backgroundColor = original;
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#0B0F15]">
      {children}
    </div>
  );
}
