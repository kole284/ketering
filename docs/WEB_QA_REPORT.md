# Web QA Report

Datum: 2026-07-10

Opseg: web aplikacija KeteringGo, desktop i mobilna sirina, bez Android aplikacije. Backend hardening i `/api/v1` su tretirani kao zavrseni.

## Baseline

- `git status --short` - cisto radno stablo pre izmena.
- `npm run lint` - prolazi.
- `npm run typecheck` - prolazi.
- `npm run test` - prolazi, 11 fajlova / 45 testova.
- `npm run build` - prolazi.
- `npm run db:migrate` - prolazi.
- `npm run db:seed` - prolazi, 4 grada / 6 restorana.

Procitano: `PROJECT_SUMMARY.md`, `docs/POST_IMPLEMENTATION_REVIEW.md`, `docs/API.md`, `docs/openapi.yaml`, `docs/ANDROID_READINESS.md`, kao i relevantni Next 16 lokalni docs za App Router, Server/Client Components, error handling, metadata i route handlere.

## Critical

- Nema potvrdjenih critical problema u web sloju u trenutku izvestaja.

## High

- Web klijent koristi legacy rute `/api/cities`, `/api/restaurants` i `/api/orders` iako je `/api/v1` stabilna zajednicka povrsina za web i buduci Android (`src/app/page.tsx`, `src/components/restaurant-cart-demo.tsx`). Legacy rute ne treba ukloniti, ali web treba migrirati ako je promena mala.
- `Idempotency-Key` u checkout formi se generise direktno u `fetch` pozivu, pa isti korisnicki submit nema stabilan kljuc za retry posle privremenog network/server problema (`src/components/restaurant-cart-demo.tsx`). Novi kljuc se trenutno dobija za svaki pokusaj slanja.

## Medium

- Not-found stanje koristi Next built-in engleski 404 umesto lokalizovanog KeteringGo UI-ja. Ruta vraca 404, ali stanje nije konzistentno sa aplikacijom.
- Checkout forma se uglavnom oslanja na disabled submit dugme za lokalnu validaciju. Korisnik ne dobija jasnu lokalnu poruku za prazno ime, nevalidan email, nevalidan srpski telefon, praznu adresu ili termin dok ne ispuni uslove za enable dugmeta.
- Poruka za datum u proslosti iz schema validacije koristi tekst "najvise 7 dana unapred", iako isti refine proverava i donju granicu. Server status je 422, ali korisnicka poruka nije dovoljno precizna za prosli datum.
- `DatePicker` i `TimePicker` dialog zatvaraju se na Escape i zakljucavaju scroll, ali ne vracaju fokus eksplicitno na trigger dugme nakon zatvaranja. To je ocigledan keyboard/accessibility propust.
- `TimePicker` nema focus trap unutar dialoga. Na duzim tastaturnim navigacijama fokus moze izaci iz modala.
- Globalna metadata nema Open Graph osnovu i canonical/title template. FAQ ima JSON-LD i manifest/favicon postoje.

## Low

- Firefox headless screenshot bez cekanja hvata samo initial burger loader. Loader se stvarno renderuje i ima `role=status`, ali alat nije pogodan za content screenshot posle animacije bez dodatnog remote debugging sloja.
- Pocetna strana je client component zbog izbora grada i fetch-a; to je prihvatljivo za trenutni interaktivni ekran, ali bi se deo statickog sadrzaja mogao server-renderovati u buducem performance refaktoru.
- `console.warn` fallback logovi u servisima postoje za development/server diagnostiku. Nisu primeceni tokeni u URL-u ili browser storage-u.

## Confirmed correct

- `/`, `/restorani`, `/faq` vracaju 200; nepostojeca ruta vraca 404.
- `/api/v1/restaurants`, `/api/v1/restaurants/:id`, `/products` i `/availability` vracaju stabilan `{ success, data }` envelope.
- Server ne prihvata browser cenu kao autoritativnu: test payload sa `priceRsd: 1` i `totalRsd: 1` vratio je server racunat `subtotalRsd: 1440`, `deliveryFeeRsd: 170`, `totalRsd: 1610`.
- Idempotentni replay preko `/api/v1/orders` vraca 200, `idempotentReplay: true` i ne vraca ponovo plaintext `accessToken`.
- Minimalna porudzbina vraca 422 `MINIMUM_ORDER_NOT_MET` sa korisnickom porukom.
- Nevalidan srpski telefon vraca 422 `VALIDATION_ERROR` sa korisnickom porukom.
- Korpa u utility sloju koristi `productId` kao identitet, ukljucujuci dva proizvoda istog naziva.
- `lang="sr"`, favicon i manifest postoje.
- FAQ stranica generise FAQ JSON-LD.

## Fix status

- High: web klijent je migriran na `/api/v1/cities`, `/api/v1/restaurants` i `/api/v1/orders`; legacy rute su ostavljene.
- High: checkout sada cuva isti `Idempotency-Key` kroz retry posle neuspelog slanja i resetuje ga tek posle uspeha ili ciscenja korpe.
- Medium: dodat je lokalizovan `not-found` ekran.
- Medium: checkout forma sada koristi aplikacione validacione poruke i ne oslanja se na browser native blokiranje submit-a.
- Medium: poruka za datum u proslosti sada jasno navodi opseg od danas do 7 dana unapred.
- Medium: date/time picker modali sada vracaju fokus na trigger i drze Tab fokus unutar dialoga.
- Medium: dodata je osnovna Open Graph metadata i dinamicki title/description za restoran.
