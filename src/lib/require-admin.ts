import { redirect, notFound } from "next/navigation";
import { auth } from "@/auth";

// No session at all -> send to login (the one legitimate admin, the
// Owner, needs a way in). Signed in but not ADMIN -> 404 rather than a
// "forbidden" page, so an ordinary user isn't told admin routes exist.
export async function requireAdmin() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN") notFound();
  return session;
}
