type TokenOk = { access_token: string; token_type: string; expires_in: number };
type TokenErr = { error: string; status?: number };

let cached: { token: string; expiresAt: number } | null = null;

export async function getClientCredentialsToken(): Promise<TokenOk | TokenErr> {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return { error: "missing_spotify_client_id_or_secret" };
  }

  const now = Date.now();
  if (cached && cached.expiresAt - 30_000 > now) {
    return { access_token: cached.token, token_type: "Bearer", expires_in: Math.floor((cached.expiresAt - now) / 1000) };
  }

  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ grant_type: "client_credentials" }),
    cache: "no-store",
  });

  const json = await res.json();

  if (!res.ok) {
    return {
      error: json?.error_description || json?.error || "token_request_failed",
      status: res.status,
    };
  }

  cached = { token: json.access_token, expiresAt: now + json.expires_in * 1000 };
  return json as TokenOk;
}
