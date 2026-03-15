type CspDirectives = Record<string, readonly string[]>;

function buildCspString(directives: CspDirectives): string {
  return Object.entries(directives)
    .map(([key, values]) =>
      values.length > 0 ? `${key} ${values.join(" ")}` : key
    )
    .join("; ");
}

export function buildContentSecurityPolicy(
  supabaseUrl: string,
  nonce?: string,
): string {
  if (!supabaseUrl) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL is required to build Content-Security-Policy"
    );
  }

  if (!supabaseUrl.startsWith("https://")) {
    throw new Error(
      `Invalid SUPABASE_URL: must start with https:// (got: ${supabaseUrl})`
    );
  }

  const supabaseDomain = supabaseUrl.replace(/\/$/, "");

  const scriptSrc: readonly string[] = nonce
    ? ["'self'", `'nonce-${nonce}'`]
    : ["'self'"];

  const directives: CspDirectives = {
    "default-src": ["'self'"],
    "script-src": scriptSrc,
    "style-src": ["'self'", "'unsafe-inline'"],
    "img-src": ["'self'", "data:", "blob:"],
    "font-src": ["'self'"],
    "connect-src": [
      "'self'",
      supabaseDomain,
      "https://accounts.google.com",
      "https://oauth2.googleapis.com",
    ],
    "frame-src": ["https://accounts.google.com"],
    "frame-ancestors": ["'none'"],
    "form-action": ["'self'"],
    "base-uri": ["'self'"],
    "object-src": ["'none'"],
    "upgrade-insecure-requests": [],
  };

  return buildCspString(directives);
}
