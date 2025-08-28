import { AuthProvider } from "@/contexts/auth-context";
import { authService } from "@/lib/auth-api";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await authService.getCurrentUser();
  if (!user) redirect("/auth/login");

  return <AuthProvider user={user}>{children}</AuthProvider>;
}
