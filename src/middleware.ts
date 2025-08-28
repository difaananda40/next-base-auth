import { NextResponse, NextRequest } from "next/server";

const protectedRoutes = ["/dashboard"];

// Example of default export
export default function middleware(request: NextRequest) {
  const authToken = request.cookies.get("auth_token");

  const path = request.nextUrl.pathname;
  const isProtectedRoute = protectedRoutes.some((route) =>
    path.startsWith(route),
  );

  if (isProtectedRoute && !authToken) {
    return NextResponse.redirect(new URL("/auth/login", request.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\.png$).*)"],
};
