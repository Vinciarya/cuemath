export function getBaseUrl() {
  if (typeof window !== "undefined") {
    // Client-side: use the current origin
    return window.location.origin;
  }

  // Server-side:
  // 1. Check for manual environment variable
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }

  // 2. Check for Vercel's automatic deployment URL or use hardcoded production URL
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  // 3. Fallback to production URL for hosted environment
  if (process.env.NODE_ENV === "production") {
    return "https://cuemath-zeta.vercel.app";
  }

  // 4. Default to localhost for development
  return "http://localhost:3000";
}
