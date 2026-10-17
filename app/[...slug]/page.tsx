import { redirect } from "next/navigation";

// Recovery route for stale/client-side navigation targets.
// Lakshya should never strand a student on a generic Next.js 404 page.
export default function UnknownLakshyaRoute() {
  redirect("/");
}
