import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");

  if (!code) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("error", "auth_failed");
    url.searchParams.delete("code");
    return NextResponse.redirect(url);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("error", "auth_failed");
    url.searchParams.delete("code");
    return NextResponse.redirect(url);
  }

  const url = request.nextUrl.clone();
  url.pathname = "/rankings";
  url.search = "";
  return NextResponse.redirect(url);
}
