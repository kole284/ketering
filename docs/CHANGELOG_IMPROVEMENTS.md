# Changelog Improvements

## Stabilizacija porudžbina

- Uklonjen fallback order storage koji je mogao prikazati uspeh bez trajnog čuvanja.
- Kreiranje porudžbine sada vraća `DATABASE_UNAVAILABLE` / 503 ako baza nije dostupna.
- Notifikacije se šalju tek nakon uspešnog čuvanja porudžbine.
- Uvedene tipizovane application greške i stabilan API error envelope.
- Uveden `Idempotency-Key` za `POST /api/v1/orders` i `POST /api/orders`.
- Idempotency sada hvata unique-conflict trku i vraća replay/409 umesto interne greške.
- Access token porudžbine se generiše kriptografski bezbedno, vraća samo pri prvom kreiranju i u bazi se čuva kao hash.
- Statusi notifikacija su normalizovani na `not_requested`, `pending`, `sent`, `failed`, `skipped`; provider se čuva samo u logu.

## Podaci i modeli

- Proizvodi, minimalna porudžbina, dostava, subtotal i total koriste numeričke RSD vrednosti.
- UI formatira cene preko `formatRsd`.
- Korpa koristi `product.id` kao identitet.
- Dodato radno vreme restorana, lead time i server-side validacija termina.
- Usklađen fallback/seed izvor gradova i dostupnosti.

## API

- Dodat `/api/v1` sloj za gradove, restorane, proizvode, dostupnost i porudžbine.
- Dodata CORS konfiguracija preko env varijable.
- Uklonjen hardkodovani `Access-Control-Allow-Origin: *` iz legacy GET ruta.
- CORS više ne vraća prvi konfigurisani origin za nepoznat Origin.
- Dodata stvarna provera veličine JSON tela zahteva i `Retry-After` za rate limit.
- Dodata dokumentacija `docs/API.md` i ručna OpenAPI specifikacija.

## Konfiguracija

- `.env.example` ažuriran stvarno korišćenim varijablama.
- Uklonjeni hardkodovani fallback telefoni iz poslovnog toka.
- `next.config.ts` koristi `NEXT_ALLOWED_DEV_ORIGINS` umesto hardkodovanih LAN IP adresa.

## Testovi

- Dodati testovi za cart by product ID, formatiranje novca, radno vreme, order service, API order rutu, CORS, rate limit i access token helper.
