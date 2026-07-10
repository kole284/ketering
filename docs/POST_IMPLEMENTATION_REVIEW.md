# Post-implementation review

Datum: 2026-07-10

Pregledano je trenutno stanje radnog stabla, uključujući `git status`, `git diff --stat`, poslednje commitove, API rute, order service/repository sloj, Prisma šemu, migracionu skriptu, CORS, rate limit, env konfiguraciju, dokumentaciju i postojeće testove.

## Critical

- `Order.accessToken` se čuva kao plaintext u bazi (`prisma/schema.prisma`, `src/repositories/order.repository.ts`). Javni GET endpoint za porudžbinu proverava token direktnim poređenjem sa kolonom i token se šalje kao query parametar (`src/app/api/v1/orders/[id]/route.ts`). Ovo nije dovoljno bezbedno za budući javni web/Android klijent.

## High

- `Idempotency-Key` nije race-safe. `createOrderInTransaction()` prvo radi `findUnique` van transakcije, a zatim pokušava `create`; dva paralelna zahteva sa istim ključem mogu dovesti do unique constraint greške umesto stabilnog replay odgovora (`src/repositories/order.repository.ts`).
- Limit tela zahteva se proverava samo preko `Content-Length` headera. Zahtev bez tog headera se čita kroz `request.json()` bez stvarne provere veličine (`src/app/api/orders/route.ts`).
- Statusi notifikacija nisu konzistentni: kolone `email_status` i `sms_status` dobijaju nazive providera kao što su `emailjs`, `resend`, `twilio` i `composer`, umesto jasnih stanja poput `sent`, `failed`, `skipped`, `not_requested` (`src/services/order.service.ts`).

## Medium

- Rate limiter je in-memory `Map`, nema cleanup, nema ograničenje broja bucket-a i ne vraća `Retry-After` (`src/lib/server/rate-limit.ts`, `src/app/api/orders/route.ts`). Ovo je prihvatljivo samo za single-instance development/staging režim i mora biti dokumentovano.
- CORS za nepoznat Origin vraća prvi konfigurisani origin, umesto da ne postavi `Access-Control-Allow-Origin` (`src/lib/server/cors.ts`).
- Validacija termina ne koristi `restaurants.timezone`, već implicitno lokalnu vremensku zonu Node procesa (`src/lib/order-time.ts`, `src/repositories/order.repository.ts`).
- Dokumentacija opisuje `GET /api/v1/orders/:id?accessToken=...`, što podstiče slanje tokena kroz URL logove (`docs/API.md`, `docs/openapi.yaml`, `docs/ANDROID_READINESS.md`).

## Low

- Legacy `/api/orders` i nova `/api/v1/orders` ruta dele isti handler, što je dobro za poslovnu logiku, ali log poruka i dokumentacija treba jasno da razlikuju legacy i preporučeni API (`src/app/api/orders/route.ts`, `src/app/api/v1/orders/route.ts`).
- Env validacija je centralizovana i uglavnom dobra, ali produkcioni multi-instance rate limiting i storage za idempotency cleanup nisu rešeni u ovoj fazi (`src/lib/server/env.ts`, `src/lib/server/rate-limit.ts`).

## Confirmed correct

- Kreiranje porudžbine koristi server-side cene iz baze i ponovo računa subtotal, dostavu i total (`src/repositories/order.repository.ts`).
- Proizvodi se traže po `restaurantId` i `productId`, pa proizvod iz drugog restorana ne prolazi validaciju (`src/repositories/order.repository.ts`).
- Email/SMS se šalju tek posle uspešnog čuvanja porudžbine, a idempotentni replay ne šalje ponovo notifikacije (`src/services/order.service.ts`).
- V1 API koristi standardni response wrapper `{ success, data/error }` i tipizovane application greške (`src/lib/server/api-response.ts`, `src/lib/server/errors.ts`).
- Korpa koristi `productId` za identitet stavke, ne naziv proizvoda (`src/lib/cart.ts`, `src/components/restaurant-cart-demo.tsx`).

## Popravke urađene nakon review-a

- `accessToken` više nije Prisma polje u plaintext obliku. Dodato je `access_token_hash`, helper za generisanje/hash/verifikaciju tokena i constant-time poređenje (`prisma/schema.prisma`, `scripts/db-migrate.mjs`, `src/lib/server/order-access-token.ts`, `src/repositories/order.repository.ts`).
- `GET /api/v1/orders/:id` koristi `X-Order-Access-Token` header umesto query parametra (`src/app/api/v1/orders/[id]/route.ts`, `docs/API.md`, `docs/openapi.yaml`).
- Idempotency unique-conflict se hvata posle transakcione greške i ponovo mapira na postojeću porudžbinu ili `IDEMPOTENCY_CONFLICT` (`src/repositories/order.repository.ts`).
- JSON body limit proverava stvarno pročitanu veličinu tela, ne samo `Content-Length` (`src/lib/server/request.ts`, `src/app/api/orders/route.ts`).
- `Idempotency-Key` se validira po dužini i formatu pre ulaska u service (`src/app/api/orders/route.ts`).
- Rate limiter sada vraća `Retry-After`, čisti istekle bucket-e i ima memorijski cap; i dalje je dokumentovan kao single-instance limiter (`src/lib/server/rate-limit.ts`, `docs/API.md`, `docs/ANDROID_READINESS.md`).
- CORS ne vraća dozvoljen origin za nepoznat Origin i dozvoljava `X-Order-Access-Token` header (`src/lib/server/cors.ts`).
- Order time validacija koristi IANA vremensku zonu restorana za dan u nedelji, prošlo vreme i lead-time (`src/lib/order-time.ts`, `src/repositories/order.repository.ts`).
- Notification statusi su normalizovani na `not_requested`, `pending`, `sent`, `failed`, `skipped`; provider je odvojen u notification logu (`src/lib/server/notification-status.ts`, `src/services/order.service.ts`).
- Dodati su testovi za access token helper, CORS, rate limit, oversized body, idempotency conflict, nevalidan idempotency key i timezone scenarije (`src/lib/server/order-access-token.test.ts`, `src/lib/server/cors.test.ts`, `src/lib/server/rate-limit.test.ts`, `src/app/api/orders/route.test.ts`, `src/lib/order-time.test.ts`).

## Verifikacija

- `npm run lint` - prolazi.
- `npm run typecheck` - prolazi.
- `npm run test` - prolazi, 11 test fajlova / 45 testova.
- `npm run build` - prolazi.
- `npm run db:migrate` - prolazi.
- `npm run db:seed` - prolazi, 4 grada / 6 restorana.

Ručna lokalna provera preko `next dev`:

- `/`, `/restorani`, `/api/v1/cities`, `/api/v1/restaurants?city=Beograd&limit=2` vraćaju 200.
- `POST /api/v1/orders` sa `sendSms: false` i `sendEmail: false` vraća 201 i access token samo na prvom kreiranju.
- Isti `Idempotency-Key` i isti payload vraćaju 200, `idempotentReplay: true`, bez access tokena i bez ponovnih notifikacija.
- Isti `Idempotency-Key` i drugačiji payload vraćaju 409 `IDEMPOTENCY_CONFLICT`.
- `GET /api/v1/orders/:id` vraća 200 sa `X-Order-Access-Token`, a 400 bez tokena.
- Nevalidan termin vraća 422 `INVALID_ORDER_TIME`.
- Prevelik payload vraća 413 `REQUEST_TOO_LARGE`.
- Ručni shell loop za rate limit nije validno proverio endpoint zbog lokalnog `curl` connection `000` u sandboxu; rate limit ponašanje je pokriveno unit/API testovima, uključujući `Retry-After`.
