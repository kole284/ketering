# PROJECT SUMMARY

`KeteringGo` je Next.js 16 / React 19 aplikacija za pregled restorana i poručivanje keteringa. Web UI ostaje App Router aplikacija, a backend je pripremljen kroz stabilan `/api/v1` REST sloj za budući Android klijent.

## Tehnologije

- Next.js 16.2.1 i React 19.2.4: `package.json`, `src/app/layout.tsx`.
- TypeScript strict mode i alias `@/*`: `tsconfig.json`.
- PostgreSQL runtime kroz Prisma Client: `prisma/schema.prisma`, `src/lib/database/prisma.ts`.
- Ručne migracije/seed skripte kroz `pg`: `scripts/db-migrate.mjs`, `scripts/db-seed.mjs`.
- Zod validacija: `src/lib/validation/order.ts`, `src/lib/server/env.ts`.
- Vitest/Testing Library: `vitest.config.ts`, `vitest.setup.ts`, test fajlovi u `src/**`.

## Struktura

- `src/app/` - stranice i API rute.
- `src/app/api/v1/` - stabilni REST API za web/future Android.
- `src/components/` - layout, UI, FAQ, checkout i loading komponente.
- `src/services/` - poslovna orkestracija.
- `src/repositories/` - Prisma pristup bazi.
- `src/lib/` - tipovi, validacija, novac, vreme, cart utility, env, CORS, greške i DTO mapiranja.
- `docs/` - API, OpenAPI, Android readiness, admin plan i changelog.

## Glavni tok

Početna strana učitava gradove i restorane preko API-ja (`src/app/page.tsx`, `src/app/api/cities/route.ts`, `src/app/api/restaurants/route.ts`). Lista i detalj restorana koriste servisni sloj (`src/app/restorani/page.tsx`, `src/app/restorani/[id]/page.tsx`, `src/services/restaurant.service.ts`). Checkout šalje samo poslovno bezbedan payload: `restaurantId`, kontakt, termin i stavke po `productId`/`quantity` (`src/components/restaurant-cart-demo.tsx`).

Server validira payload, ponovo učitava restoran/proizvode, računa subtotal/dostavu/total, proverava minimalnu porudžbinu i radno vreme, a zatim čuva porudžbinu u transakciji (`src/lib/validation/order.ts`, `src/repositories/order.repository.ts`, `src/lib/order-time.ts`).

## Stabilizacija porudžbina

- Fallback porudžbine koje nisu trajno sačuvane su uklonjene iz order toka (`src/services/order.service.ts`).
- Ako baza nije dostupna pri kreiranju porudžbine, API vraća `503 DATABASE_UNAVAILABLE` i ne šalje notifikacije (`src/services/order.service.ts`, `src/app/api/orders/route.ts`).
- Greške su tipizovane i mapirane u stabilan envelope (`src/lib/server/errors.ts`, `src/lib/server/api-response.ts`).
- `Idempotency-Key` je podržan preko kolona `idempotency_key` i `idempotency_request_hash` (`prisma/schema.prisma`, `src/repositories/order.repository.ts`).
- Idempotency replay ne šalje ponovo notifikacije, a unique-conflict trka se mapira na postojeću porudžbinu ili `IDEMPOTENCY_CONFLICT` (`src/repositories/order.repository.ts`, `src/services/order.service.ts`).
- Access token porudžbine se generiše u aplikaciji, klijentu vraća samo pri prvom kreiranju, a u bazi se čuva `access_token_hash` (`prisma/schema.prisma`, `src/lib/server/order-access-token.ts`, `src/repositories/order.repository.ts`).
- Email/SMS statusi su odvojeni od uspeha čuvanja porudžbine i koriste stabilne vrednosti `not_requested`, `pending`, `sent`, `failed`, `skipped` (`src/services/order.service.ts`, `src/lib/server/notification-status.ts`, `src/repositories/order.repository.ts`).

## Podaci

Gradovi imaju `id`, `slug`, `name`, `isAvailable` (`src/lib/types/restaurant.ts`, `src/lib/server/sample-data.json`, `prisma/schema.prisma`).

Restorani imaju slug, numeričke cene (`minOrderRsd`, `deliveryFeeRsd`), aktivnost, lead time, timezone, proizvode i radno vreme (`src/lib/types/restaurant.ts`, `prisma/schema.prisma`, `src/repositories/restaurant.repository.ts`).

Proizvodi koriste `priceRsd: number`; formatiranje radi `formatRsd()` (`src/lib/types/restaurant.ts`, `src/lib/utils/money.ts`, `src/components/restaurant-cart-demo.tsx`).

## API

Novi API je dokumentovan u `docs/API.md` i `docs/openapi.yaml`.

Endpoint-i:

- `GET /api/v1/cities`
- `GET /api/v1/restaurants`
- `GET /api/v1/restaurants/:id`
- `GET /api/v1/restaurants/:id/products`
- `GET /api/v1/restaurants/:id/availability`
- `POST /api/v1/orders`
- `GET /api/v1/orders/:id` sa `X-Order-Access-Token` headerom

Legacy `/api/cities`, `/api/restaurants` i `/api/orders` postoje zbog web kompatibilnosti.

## Testovi

Postoje testovi za FAQ, header, loader, cart utility, formatiranje novca, radno vreme, order service, order API rutu, CORS, rate limit i access token helper (`src/components/faq/faq.test.tsx`, `src/components/layout/site-header.test.tsx`, `src/components/loading/initial-site-loader.test.tsx`, `src/lib/cart.test.ts`, `src/lib/order-time.test.ts`, `src/services/order.service.test.ts`, `src/app/api/orders/route.test.ts`, `src/lib/server/cors.test.ts`, `src/lib/server/rate-limit.test.ts`, `src/lib/server/order-access-token.test.ts`).

## Poznata ograničenja

- Nema admin UI-ja ni autentifikacije.
- Nema produkcionog queue sistema za notifikacije.
- Rate limiter je in-memory i pogodan samo za single-instance deployment; produkcija sa više instanci treba shared storage limiter.
- SMS/email provider-i su opcioni; bez env konfiguracije notifikacije se preskaču ili koriste fallback composer.
- Migracije su i dalje ručne `pg` skripte, iako Prisma schema opisuje model. Pre produkcije treba preći na jedan primarni migration sistem.
- Lokalna integraciona provera zavisi od dostupne PostgreSQL baze i opcionih provider ključeva.

## Najvažniji fajlovi za novog programera

1. `README.md`
2. `docs/API.md`
3. `docs/ANDROID_READINESS.md`
4. `prisma/schema.prisma`
5. `scripts/db-migrate.mjs`
6. `scripts/db-seed.mjs`
7. `src/app/api/orders/route.ts`
8. `src/app/api/v1/`
9. `src/services/order.service.ts`
10. `src/repositories/order.repository.ts`
11. `src/repositories/restaurant.repository.ts`
12. `src/components/restaurant-cart-demo.tsx`
13. `src/lib/order-time.ts`
14. `src/lib/server/errors.ts`
15. `src/lib/server/env.ts`
