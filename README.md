# KeteringGo

Next.js 16 aplikacija za pregled restorana i poručivanje keteringa, sa PostgreSQL/Prisma backend-om i stabilnim REST API slojem pripremljenim za buduću Android aplikaciju.

## Tehnologije

- Next.js 16 App Router
- React 19
- TypeScript
- PostgreSQL
- Prisma Client
- Zod validacija
- Vitest i Testing Library

## Pokretanje

```bash
npm install
cp .env.example .env.local
docker compose up -d postgres
npm run db:setup
npm run dev
```

Default lokalna baza:

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/keteringgo
```

## Komande

- `npm run dev` - lokalni dev server
- `npm run build` - production build
- `npm run start` - start production build-a
- `npm run lint` - ESLint
- `npm run typecheck` - TypeScript provera
- `npm run test` - Vitest
- `npm run db:migrate` - ručna PostgreSQL migracija
- `npm run db:seed` - seed iz `src/lib/server/sample-data.json`
- `npm run db:setup` - migracija + seed

## Poslovna pravila

- Server je autoritet za validaciju, proizvode, cene, minimalnu porudžbinu, dostavu i total.
- Klijent šalje samo `productId` i `quantity`; ne šalje subtotal ili total.
- Cene su numeričke vrednosti u dinarima (`priceRsd`, `totalRsd`), a formatiranje u `RSD` se radi samo u UI/API display poljima.
- Porudžbina se ne prikazuje kao uspešna ako nije trajno sačuvana u bazi.
- Ako baza nije dostupna za kreiranje porudžbine, API vraća `503 DATABASE_UNAVAILABLE`.
- Email/SMS notifikacije se pokušavaju tek nakon uspešnog čuvanja porudžbine.
- `Idempotency-Key` sprečava duplo kreiranje porudžbine pri ponovljenom requestu.

## API

Stabilni API za web i budući Android je pod `/api/v1`.

Glavni endpoint-i:

- `GET /api/v1/cities`
- `GET /api/v1/restaurants`
- `GET /api/v1/restaurants/:id`
- `GET /api/v1/restaurants/:id/products`
- `GET /api/v1/restaurants/:id/availability`
- `POST /api/v1/orders`
- `GET /api/v1/orders/:id?accessToken=...`

Detalji su u `docs/API.md`, a ručna OpenAPI specifikacija je u `docs/openapi.yaml`.

## Konfiguracija

Pogledaj `.env.example`. Obavezna je baza (`DATABASE_URL`). Email, SMS i CORS su opcioni i konfigurišu se preko env varijabli.

Twilio/Resend/EmailJS nisu potrebni za lokalni katalog i checkout testove. Ako nisu podešeni, notifikacije se evidentiraju kao preskočene ili fallback.

## Seed podaci

Seed je ponovljiv i čita jedan zajednički izvor: `src/lib/server/sample-data.json`. Isti izvor se koristi i za read-only fallback prikaz restorana/gradova ako baza nije dostupna za katalog.

Kreiranje porudžbine ne koristi fallback storage.

