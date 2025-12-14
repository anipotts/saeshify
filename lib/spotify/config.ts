export const SPOTIFY_CONFIG = {
  clientId: process.env.SPOTIFY_CLIENT_ID!,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET!,
  redirectUri: process.env.SPOTIFY_REDIRECT_URI!,
  scopes: [
    'user-library-read',
    'user-library-modify',
    'user-read-private',
    'user-read-email',
  ].join(' '),
};

export const SPOTIFY_API_BASE = 'https://api.spotify.com/v1';
export const SPOTIFY_AUTH_BASE = 'https://accounts.spotify.com';
