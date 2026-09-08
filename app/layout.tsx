import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lakshya — Study Smarter",
  description: "A professional study platform for focused learning, planning and progress.",
  applicationName: "Lakshya",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
