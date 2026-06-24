# KeteringGo

Next.js 16 aplikacija za poručivanje keteringa, sada sa PostgreSQL backend-om.

## Tehnologije

- Next.js 16 (App Router)
- React 19
- PostgreSQL
- `pg` (node postgres klijent)

## Pokretanje projekta

1. Instaliraj zavisnosti:

```bash
npm install
```

2. Napravi lokalni env fajl:

```bash
cp .env.example .env.local
```

3. Podigni PostgreSQL lokalno:

```bash
docker compose up -d postgres
```

Proveri da `DATABASE_URL` pokazuje na aktivnu bazu:

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/keteringgo
```

4. Pokreni migracije i seed:

```bash
npm run db:setup
```

5. Startuj aplikaciju:

```bash
npm run dev
```

## PostgreSQL skripte

- `npm run db:migrate` - kreira tabele i indekse
- `npm run db:seed` - popunjava početne gradove i restorane
- `npm run db:setup` - migracija + seed u jednom koraku

Seed podaci se čitaju iz `src/lib/server/sample-data.json`, koji koristi i fallback režim aplikacije. Trenutno se u bazu upisuju Beograd, Novi Sad, Niš i 7 test restorana sa ponudama i proizvodima.

## Email potvrde

Porudžbina se čuva u PostgreSQL tabelama `orders` i `order_items`, a zatim `POST /api/orders` poziva EmailJS servis da kupcu pošalje potvrdu na email koji je uneo u formi.

U `.env.local` podesi:

```bash
EMAILJS_SERVICE_ID=your_emailjs_service_id
EMAILJS_TEMPLATE_ID=your_emailjs_template_id
EMAILJS_PUBLIC_KEY=your_emailjs_public_key
EMAILJS_PRIVATE_KEY=your_emailjs_private_key
```

EmailJS template može da koristi ove promenljive:

- `to_email` - email kupca
- `to_name` - ime kupca
- `subject` ili `order_subject` - naslov poruke
- `message` ili `text_message` - kompletna tekstualna potvrda
- `html_message` - kompletna HTML potvrda
- `item_details`, `item_details_html`, `total`, `event_address`, `event_date`, `event_time`

Ako EmailJS nije konfigurisan, porudžbina se i dalje čuva, a API vraća da je email preskočen.

## API endpoint-i

- `GET /api/cities` - lista gradova i dostupnosti usluge
- `GET /api/restaurants?city=Beograd` - lista restorana za grad
- `GET /api/restaurants/:id` - detalji jednog restorana
- `POST /api/orders` - kreiranje porudžbine

## Napomena o dostupnosti

Seed podaci su podešeni tako da je usluga trenutno dostupna samo u Beogradu. Za ostale gradove frontend prikazuje poruku o nedostupnosti.
