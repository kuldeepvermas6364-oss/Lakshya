"use client";

import { usePathname } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";

export default function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    setVisible(false);
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, [pathname]);

  return (
    <div
      key={pathname}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0) scale(1)" : "translateY(10px) scale(.992)",
        filter: visible ? "blur(0)" : "blur(2px)",
        transition: "opacity 360ms cubic-bezier(.22,1,.36,1), transform 500ms cubic-bezier(.22,1,.36,1), filter 360ms ease",
        willChange: "opacity, transform, filter",
      }}
    >
      {children}
    </div>
  );
}
