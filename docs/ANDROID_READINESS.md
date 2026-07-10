# Android Readiness

Android aplikacija se još ne pravi. Backend je pripremljen da Android kasnije koristi HTTP API pod `/api/v1`.

## Endpoint-i

Android treba da koristi:

- `GET /api/v1/cities`
- `GET /api/v1/restaurants`
- `GET /api/v1/restaurants/:id`
- `GET /api/v1/restaurants/:id/products`
- `GET /api/v1/restaurants/:id/availability`
- `POST /api/v1/orders`
- `GET /api/v1/orders/:id` sa `X-Order-Access-Token` headerom

## Kotlin DTO modeli

Predloženi DTO-i:

- `ApiResponse<T>`
- `ApiError`
- `CityDto`
- `RestaurantSummaryDto`
- `RestaurantDetailsDto`
- `ProductDto`
- `WorkingHourDto`
- `CreateOrderRequest`
- `OrderItemRequest`
- `CreateOrderResponse`
- `OrderDetailsDto`

Cene prikazivati iz numeričkih `priceRsd`, `totalRsd`, `deliveryFeeRsd`. `*Display` može da se koristi privremeno, ali Android treba da ima sopstveni formatter za RSD.

## Slanje porudžbine

Android šalje `POST /api/v1/orders` sa proizvodima po `productId` i količini. Ne šalje subtotal ili total. Porudžbina se nikada ne sme prikazati kao uspešna dok server ne vrati `success: true` i trajno sačuvan ID. `accessToken` iz create odgovora treba čuvati lokalno samo ako je korisniku potreban kasniji prikaz detalja porudžbine; backend u bazi čuva samo hash tokena.

## Idempotency-Key

Za svako slanje porudžbine Android treba da generiše stabilan `Idempotency-Key`, na primer UUID, i da ga sačuva dok zahtev ne dobije odgovor. Ključ mora imati 8-200 karaktera i sme sadržati slova, brojeve, `.`, `_`, `:` i `-`. Ako mreža pukne i zahtev se ponovi istim ključem, backend vraća postojeću porudžbinu umesto kreiranja duplikata. Ako isti ključ dođe sa drugačijim payload-om, backend vraća `IDEMPOTENCY_CONFLICT`. Idempotentni replay ne šalje ponovo notifikacije i ne vraća ponovo plaintext `accessToken`.

## Greške

Sve greške dolaze kao:

```json
{ "success": false, "error": { "code": "INVALID_ORDER_TIME", "message": "..." } }
```

Android UI treba da mapira `error.code`, ne tekst poruke.

`RATE_LIMITED` odgovor ima `Retry-After` header. Trenutni limiter je in-memory i važi samo za single-instance backend; produkcija sa više instanci treba shared storage limiter.

## Datum i vreme

`eventDate` je `YYYY-MM-DD`. `eventTime` je `HH:MM`. Radno vreme i lead-time validacija koriste IANA vremensku zonu restorana, trenutno najčešće `Europe/Belgrade`.

## Base URL konfiguracija

- Emulator: `http://10.0.2.2:3000`
- Fizički uređaj lokalno: `http://<LAN-IP>:3000`. Native Android ne koristi browser CORS, ali web test klijenti i browser zahtevaju podešen `CORS_ALLOWED_ORIGINS`.
- Staging: staging domen iz build config-a
- Production: production domen iz build config-a

## Preporučeni Android stack

- Kotlin
- Jetpack Compose
- Retrofit ili Ktor Client
- Kotlin Serialization ili Moshi
- Hilt
- ViewModel
- Coroutines i Flow
- Navigation Compose
- Room samo ako bude potreban lokalni cache

## Predlog arhitekture

- `data.remote` za API service i DTO
- `data.repository` za mapiranje DTO -> domain
- `domain.model` za stabilne modele
- `domain.usecase` za tokove kao `CreateOrderUseCase`
- `ui` Compose screen-ovi sa ViewModel-ima

## Offline ponašanje

Offline se može keširati katalog gradova/restorana/proizvoda. Kreiranje porudžbine ne sme raditi offline kao uspešno; može se sačuvati lokalni draft, ali status ostaje "nije poslato" dok server ne potvrdi.

## Backend nedostaci pre Android razvoja

- Produkcioni auth nije definisan.
- Nema admin sistema za statuse porudžbina.
- Nema push notifikacija.
- Nema javne staging konfiguracije.
- Nema kompletnih integracionih testova sa test bazom.
