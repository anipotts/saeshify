# cloudflare cutover

`saeshify.com` is still on namecheap dns and vercel hosting as of the rebuild start.

## current records to preserve

- nameservers: `dns1.registrar-servers.com`, `dns2.registrar-servers.com`
- apex a: `216.150.1.1`, `216.198.79.193`
- www cname: `cname.vercel-dns.com`
- mx:
  - `10 eforward1.registrar-servers.com`
  - `10 eforward2.registrar-servers.com`
  - `10 eforward3.registrar-servers.com`
  - `15 eforward4.registrar-servers.com`
  - `20 eforward5.registrar-servers.com`
- spf: `v=spf1 include:spf.efwd.registrar-servers.com ~all`

## safe sequence

1. add `saeshify.com` as a cloudflare zone in the anipotts account.
2. import records and verify mx/spf before nameserver changes.
3. deploy the worker to `saeshify.workers.dev` and test headers.
4. add worker custom domains for apex and www.
5. update namecheap nameservers to the cloudflare pair.
6. verify `curl -I https://saeshify.com` returns cloudflare, not vercel.

do not perform steps 4-6 without explicit sign-off.

