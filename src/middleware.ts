import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { getUserRolesWithClient } from "@/lib/auth/check-role";

const AUTH_REQUIRED_PREFIXES = ["/cart", "/grocery/cart", "/profile", "/order", "/favorites"];
const PUBLIC_PREFIXES = ["/", "/auth", "/catalog", "/restaurant", "/api/auth"];

function isPublicRoute(pathname: string): boolean {
  if (pathname.startsWith("/_next") || pathname.startsWith("/static")) return true;
  if (pathname.includes(".") && !pathname.startsWith("/api")) return true;
  if (pathname === "/favicon.ico") return true;
  if (pathname.startsWith("/api/auth")) return true;
  if (PUBLIC_PREFIXES.some((p) => p !== "/" && pathname.startsWith(p))) return true;
  if (pathname === "/") return true;
  return false;
}

function requiresAuth(pathname: string): boolean {
  return AUTH_REQUIRED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const { supabase, user, supabaseResponse } = await updateSession(request);

  if (isPublicRoute(pathname)) {
    return supabaseResponse;
  }

  if (requiresAuth(pathname) && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith("/admin")) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/auth";
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }

    const roles = await getUserRolesWithClient(supabase, user.id);
    if (!roles.includes("admin")) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
  }

  if (pathname.startsWith("/courier")) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/auth";
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }

    const roles = await getUserRolesWithClient(supabase, user.id);
    if (!roles.includes("courier")) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
