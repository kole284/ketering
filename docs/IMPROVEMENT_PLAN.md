# Improvement Plan

## Baseline

Pre izmena su provereni `PROJECT_SUMMARY.md`, `README.md`, `package.json`, `prisma/schema.prisma`, API rute, service/repository slojevi, checkout komponenta, validacija porudžbine, email/SMS integracije, ručne DB skripte, seed i env konfiguracija.

Početne komande prolaze:

- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`

Potvrđeni glavni problemi:

- `submitOrder` pravi fallback porudžbinu kada baza nije dostupna, bez trajnog čuvanja.
- API mapira greške analizom teksta poruke.
- Korpa koristi naziv proizvoda kao identitet.
- Frontend i fallback koriste formatirane string cene kao poslovne vrednosti.
- Radno vreme nije deo baze, seed-a, tipova ni server-side validacije.
- Gradovi/dostupnost nisu jedan izvor istine.
- Env varijable nisu centralizovano validirane; postoje hardkodovani kontakti i LAN IP adrese.
- API rute nisu verzionisane za budući Android klijent.
- Nema idempotency podrške za kreiranje porudžbine.

## Redosled implementacije

1. Uvesti osnovne domenske tipove, format odgovora i tipizovane application greške.
2. Ukloniti fallback order storage i obezbediti `503` kada baza nije dostupna za kreiranje porudžbine.
3. Prebaciti proizvode i restorane na numeričke cene (`priceRsd`, `minOrderRsd`, `deliveryFeeRsd`) uz UI formatiranje samo na ivici prikaza.
4. Prebaciti korpu sa `product.name` na `product.id` i dodati test za duplirana imena proizvoda.
5. Dodati radno vreme kroz Prisma schema, ručnu migraciju, seed, tipove, repository mapiranje, UI i server validaciju termina.
6. Uvesti centralizovanu env konfiguraciju, CORS konfiguraciju i ukloniti hardkodovane kontakte/IP vrednosti.
7. Odvojiti kreiranje porudžbine od notifikacionih rezultata i evidentirati email/SMS statuse.
8. Dodati idempotency tabelu/model i podršku za `Idempotency-Key`.
9. Dodati `/api/v1` REST endpoint-e i DTO sloj za web i budući Android klijent.
10. Proširiti unit/service/API testove za kritične tokove.
11. Ažurirati README, `PROJECT_SUMMARY.md`, API/OpenAPI/Android/admin dokumentaciju i changelog.
12. Pokrenuti migraciju/seed i završne komande.

## Očekivani fajlovi za izmene

- `prisma/schema.prisma`
- `scripts/db-migrate.mjs`
- `scripts/db-seed.mjs`
- `src/lib/server/sample-data.json`
- `src/lib/types/restaurant.ts`
- `src/lib/utils/money.ts`
- `src/lib/order-time.ts`
- `src/lib/validation/order.ts`
- `src/lib/server/env.ts`
- `src/lib/server/errors.ts`
- `src/lib/server/api-response.ts`
- `src/lib/server/cors.ts`
- `src/lib/server/notifications.ts`
- `src/repositories/restaurant.repository.ts`
- `src/repositories/order.repository.ts`
- `src/services/restaurant.service.ts`
- `src/services/order.service.ts`
- `src/app/api/*`
- `src/app/api/v1/*`
- `src/components/restaurant-cart-demo.tsx` ili naslednik te komponente
- `src/components/restaurant/restaurant-card.tsx`
- `src/app/page.tsx`
- `src/app/restorani/[id]/page.tsx`
- `.env.example`
- `next.config.ts`
- `README.md`
- `PROJECT_SUMMARY.md`
- `docs/API.md`
- `docs/openapi.yaml`
- `docs/ANDROID_READINESS.md`
- `docs/ADMIN_PLAN.md`
- `docs/CHANGELOG_IMPROVEMENTS.md`
- novi test fajlovi u `src/**/*.test.ts` i `src/**/*.test.tsx`

## Rizici

- Promena DTO modela zahteva istovremeno ažuriranje UI-ja, seed-a i testova.
- Radno vreme uvodi datum/vreme pravila; testovi moraju stabilizovati referentno vreme da ne budu flakey.
- Idempotency bez auth-a mora koristiti klijentski header, ali ne sme izlagati tuđe porudžbine.
- Notification statusi ne smeju poništiti uspešno sačuvanu porudžbinu.
- Ručna migraciona skripta i Prisma schema moraju ostati usklađene dok se ne pređe na jedan primarni migration sistem.
- Postojeći dizajn treba očuvati; refaktorisanje checkout-a mora biti ponašajno kompatibilno.

