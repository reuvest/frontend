"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function NavigationProgress() {
  const pathname = usePathname();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Start progress bar when navigation begins
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("http") || anchor.target === "_blank") return;

      setVisible(true);
      setProgress(15);
    };

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  // Advance bar while navigating
  useEffect(() => {
    if (!visible) return;
    if (progress >= 85) return;

    const t = setTimeout(() => {
      setProgress((p) => Math.min(p + Math.random() * 20, 85));
    }, 200);
    return () => clearTimeout(t);
  }, [visible, progress]);

  // Complete when pathname changes (navigation done)
  useEffect(() => {
    if (!visible) return;
    setProgress(100);
    const t = setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  if (!visible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-9999 h-0.75 bg-transparent">
      <div
        className="h-full transition-all ease-out"
        style={{
          width: `${progress}%`,
          background: "linear-gradient(90deg, #C8873A, #E8A850)",
          transitionDuration: progress === 100 ? "300ms" : "200ms",
          boxShadow: "0 0 10px #C8873A80",
        }}
      />
    </div>
  );
}