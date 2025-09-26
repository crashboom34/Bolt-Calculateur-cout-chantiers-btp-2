export type AppConfig = { apiBaseUrl: string | null };

let cache: AppConfig | null = null;

export async function getConfig(): Promise<AppConfig> {
  if (cache) return cache;
  
  try {
    const res = await fetch(`${import.meta.env.BASE_URL}config.json`, {
      cache: 'no-store',
    });
    if (!res.ok) return (cache = { apiBaseUrl: null });
    
    const json = await res.json();
    return (cache = { apiBaseUrl: json?.API_BASE_URL ?? null });
  } catch {
    return (cache = { apiBaseUrl: null });
  }
}
