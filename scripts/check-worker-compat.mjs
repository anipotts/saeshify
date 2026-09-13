import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const require = createRequire(import.meta.url);
const wranglerRequire = createRequire(require.resolve('wrangler/package.json'));
const { Miniflare, convertV4MiniflareOptions } = wranglerRequire('miniflare');
const { build } = wranglerRequire('esbuild');
const config = await readFile('wrangler.toml', 'utf8');
const compatibilityDate = config.match(/compatibility_date = "([^"]+)"/)[1];
const compatibilityFlags = JSON.parse(config.match(/compatibility_flags = (\[[^\n]+\])/)[1]);
let mf;
try {
 const result = await build({stdin:{contents:`
 import webpush from 'web-push';
 import { createECDH, randomBytes } from 'node:crypto';
 import { getClientCredentialsToken } from './lib/spotify/auth';
 export default { async fetch() {
   const token = await getClientCredentialsToken();
   if (token.access_token !== 'fixture-token') throw new Error('Spotify token failed');
   const key = createECDH('prime256v1'); key.generateKeys();
   const vapid = webpush.generateVAPIDKeys();
   webpush.setVapidDetails('mailto:fixture@example.test', vapid.publicKey, vapid.privateKey);
   await webpush.sendNotification({endpoint:'https://push.example.test/send',keys:{p256dh:key.getPublicKey().toString('base64url'),auth:randomBytes(16).toString('base64url')}}, 'fixture payload');
   return new Response('ok');
 }};`,resolveDir:process.cwd()},banner:{js:"import { createRequire } from 'node:module'; const nativeRequire = createRequire('file:///fixture.mjs'); const require = (id) => { const value = nativeRequire(id); return value.default ?? {...value}; };"},bundle:true,write:false,format:'esm',platform:'node',external:['node:*'],alias:{http:'node:http',https:'node:https',crypto:'node:crypto',stream:'node:stream',url:'node:url',util:'node:util',buffer:'node:buffer',events:'node:events'},define:{'process.env.SPOTIFY_CLIENT_ID':'"fixture-client"','process.env.SPOTIFY_CLIENT_SECRET':'"fixture-secret"'}});
 const calls=[];
 mf=new Miniflare(convertV4MiniflareOptions({modules:true,script:result.outputFiles[0].text,compatibilityDate,compatibilityFlags,persist:false,outboundService:async request=>{
   const url=new URL(request.url); calls.push(url.hostname);
   if(url.hostname==='accounts.spotify.com') {
    assert.equal(request.method,'POST');
    assert.equal(await request.text(),'grant_type=client_credentials');
    return Response.json({access_token:'fixture-token',token_type:'Bearer',expires_in:3600});
   }
   assert.equal(url.hostname,'push.example.test');
   assert.equal(request.method,'POST');
   assert.match(request.headers.get('authorization'), /^vapid /);
   assert.equal(request.headers.get('content-encoding'), 'aes128gcm');
   assert.ok((await request.arrayBuffer()).byteLength > 16);
   return new Response(null,{status:201});
 }}));
 const response=await mf.dispatchFetch('https://fixture.test');
 assert.equal(response.status,200,await response.text());
 assert.deepEqual(calls,['accounts.spotify.com','push.example.test']);
 console.log('Workers Spotify fetch and web-push HTTP fixture checks passed');
} finally {await mf?.dispose();}
