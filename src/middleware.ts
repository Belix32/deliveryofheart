import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { getUserRolesWithClient } from "@/lib/auth/check-role";
import { isDesignatedAdmin } from "@/lib/auth/admin-access";

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

function hasSupabaseAuthCookie(request: NextRequest): boolean {
  return request.cookies.getAll().some((c) => c.name.includes("-auth-token"));
}

function unauthorizedApi() {
  return NextResponse.json({ error: "Требуется авторизация" }, { status: 401 });
}

function forbiddenApi() {
  return NextResponse.json({ error: "Доступ запрещён" }, { status: 403 });
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicRoute(pathname) && !hasSupabaseAuthCookie(request)) {
    return NextResponse.next();
  }

  const { supabase, user, supabaseResponse } = await updateSession(request);

  if (isPublicRoute(pathname)) {
    return supabaseResponse;
  }

  // Fail closed for privileged API prefixes (route handlers still enforce roles).
  if (pathname.startsWith("/api/admin")) {
    if (!user) return unauthorizedApi();
    if (!isDesignatedAdmin(user.id)) return forbiddenApi();
    const roles = await getUserRolesWithClient(supabase, user.id);
    if (!roles.includes("admin")) return forbiddenApi();
    return supabaseResponse;
  }

  if (pathname.startsWith("/api/courier")) {
    if (!user) return unauthorizedApi();
    const roles = await getUserRolesWithClient(supabase, user.id);
    if (!roles.includes("courier")) return forbiddenApi();
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
    if (!roles.includes("admin") || !isDesignatedAdmin(user.id)) {
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
