import { describe, it, expect } from "vitest";
import { buildContentSecurityPolicy } from "./security-headers";

describe("buildContentSecurityPolicy", () => {
  it("Supabase URLがconnect-srcに含まれる", () => {
    const csp = buildContentSecurityPolicy("https://abc.supabase.co");
    expect(csp).toContain("connect-src 'self' https://abc.supabase.co");
  });

  it("末尾スラッシュが除去される", () => {
    const csp = buildContentSecurityPolicy("https://abc.supabase.co/");
    expect(csp).toContain("https://abc.supabase.co");
    expect(csp).not.toContain("https://abc.supabase.co/");
  });

  it("Google OAuthドメインがconnect-srcに含まれる", () => {
    const csp = buildContentSecurityPolicy("https://abc.supabase.co");
    expect(csp).toContain("https://accounts.google.com");
    expect(csp).toContain("https://oauth2.googleapis.com");
  });

  it("frame-ancestorsがnoneである", () => {
    const csp = buildContentSecurityPolicy("https://abc.supabase.co");
    expect(csp).toContain("frame-ancestors 'none'");
  });

  it("style-srcにunsafe-inlineが含まれる", () => {
    const csp = buildContentSecurityPolicy("https://abc.supabase.co");
    expect(csp).toContain("style-src 'self' 'unsafe-inline'");
  });

  it("object-srcがnoneである", () => {
    const csp = buildContentSecurityPolicy("https://abc.supabase.co");
    expect(csp).toContain("object-src 'none'");
  });

  it("script-srcにunsafe-inlineが含まれない", () => {
    const csp = buildContentSecurityPolicy("https://abc.supabase.co");
    expect(csp).toMatch(/script-src 'self'(?!\s*'unsafe-inline')/);
  });

  it("空文字の場合エラーをthrowする", () => {
    expect(() => buildContentSecurityPolicy("")).toThrow(
      "NEXT_PUBLIC_SUPABASE_URL is required to build Content-Security-Policy"
    );
  });

  it("https://で始まらない場合エラーをthrowする", () => {
    expect(() => buildContentSecurityPolicy("http://abc.supabase.co")).toThrow(
      "Invalid SUPABASE_URL: must start with https://"
    );
  });

  it("upgrade-insecure-requestsが値なしディレクティブとして出力される", () => {
    const csp = buildContentSecurityPolicy("https://abc.supabase.co");
    expect(csp).toMatch(/;\s*upgrade-insecure-requests(?:\s*;|$)/);
  });

  it("nonceが指定された場合、script-srcにnonce-xxxが含まれる", () => {
    const csp = buildContentSecurityPolicy("https://abc.supabase.co", "test-nonce-123");
    expect(csp).toContain("'nonce-test-nonce-123'");
  });

  it("nonceが指定された場合、script-srcにstrict-dynamicが含まれる", () => {
    const csp = buildContentSecurityPolicy("https://abc.supabase.co", "test-nonce-123");
    expect(csp).toContain("'strict-dynamic'");
    expect(csp).toContain("script-src 'self' 'nonce-test-nonce-123' 'strict-dynamic'");
  });

  it("nonce未指定時、script-srcにstrict-dynamicが含まれない", () => {
    const csp = buildContentSecurityPolicy("https://abc.supabase.co");
    expect(csp).not.toContain("'strict-dynamic'");
  });

  it("nonceが指定された場合でも、他のディレクティブは変わらない", () => {
    const csp = buildContentSecurityPolicy("https://abc.supabase.co", "abc");
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("style-src 'self' 'unsafe-inline'");
    expect(csp).toContain("object-src 'none'");
  });

  it("nonce未指定時、script-srcにnonceが含まれない", () => {
    const csp = buildContentSecurityPolicy("https://abc.supabase.co");
    expect(csp).not.toContain("nonce-");
  });

  it("nonceが空文字の場合、script-srcにnonceが含まれない", () => {
    const csp = buildContentSecurityPolicy("https://abc.supabase.co", "");
    expect(csp).not.toContain("nonce-");
  });
});
