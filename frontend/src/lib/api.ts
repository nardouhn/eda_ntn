const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api/v1";

export async function apiGet<T>(path: string, params: Record<string, string | number | undefined> = {}): Promise<T> {
  const isAbsolute = API_BASE.startsWith("http");
  const baseUrl = isAbsolute ? API_BASE : (typeof window !== "undefined" ? window.location.origin + API_BASE : "http://localhost:3000" + API_BASE);
  const url = new URL(`${baseUrl}${path}`);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") url.searchParams.set(key, String(value));
  }
  const response = await fetch(url, { 
    cache: "no-store",
    headers: {
      "ngrok-skip-browser-warning": "69420",
    }
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `API error ${response.status}`);
  }
  return response.json() as Promise<T>;
}
