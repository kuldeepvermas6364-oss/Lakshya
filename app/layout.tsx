import type { Metadata } from "next";
import "./globals.css";
import "./lakshya-polish.css";
import "./premium-motion.css";
import "./auth-premium.css";
import "./premium-brand.css";
import "./premium-dashboard.css";
import AppFrame from "./app-frame";

export const metadata: Metadata = {
  title: "Lakshya — Study Smarter",
  description: "Lakshya is a premium India-first study platform for focused learning, practice, AI assistance, planning and progress.",
  applicationName: "Lakshya",
  keywords: ["Lakshya", "study app", "JEE", "NEET", "students", "AI study assistant"],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><AppFrame>{children}</AppFrame></body></html>;
}
