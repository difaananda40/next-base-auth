import { authService } from "@/lib/auth-api";
import { redirect } from "next/navigation";

export default async function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await authService.getCurrentUser();
  if (user) redirect("/dashboard");

  return <>{children}</>;
}
