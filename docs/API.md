# KeteringGo REST API

Base path za stabilni API je `/api/v1`. Svi novi endpoint-i vraćaju envelope:

```json
{ "success": true, "data": {} }
```

Greške imaju stabilan format:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Podaci nisu validni."
  }
}
```

Cene su poslovno uvek numeričke vrednosti u dinarima (`priceRsd`, `totalRsd`). `*Display` polja su samo za prikaz.

## GET /api/v1/cities

Klijenti: web, budući Android.

Vraća gradove i dostupnost usluge.

Response primer:

```json
{
  "success": true,
  "data": [
    { "id": 1, "slug": "beograd", "name": "Beograd", "isAvailable": true }
  ]
}
```

Greške: `INTERNAL_ERROR`.

## GET /api/v1/restaurants

Klijenti: web, budući Android.

Query parametri:

- `city` opciono, ime grada.
- `sort` opciono: `rating_desc` ili `name_asc`.
- `limit` opciono, 1-100, default 50.
- `offset` opciono, default 0.

Response primer:

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 7,
        "slug": "savski-venac-mezze",
        "name": "Savski Venac Mezze",
        "city": { "id": 1, "slug": "beograd", "name": "Beograd", "isAvailable": true },
        "cuisine": "Mediteranska",
        "rating": "4.9",
        "eta": "30-40 min",
        "cover": "/placeholders/cover.svg",
        "description": "Mediteranski mezze...",
        "address": "Sarajevska 27, Beograd",
        "minOrderRsd": 1100,
        "minOrderDisplay": "1.100 RSD",
        "deliveryFeeRsd": 170,
        "deliveryFeeDisplay": "170 RSD",
        "leadTimeMinutes": 60,
        "timezone": "Europe/Belgrade",
        "offers": ["Mezze paket za 8 osoba"]
      }
    ],
    "pagination": { "limit": 50, "offset": 0, "total": 1 }
  }
}
```

Greške: `VALIDATION_ERROR`, `INTERNAL_ERROR`.

## GET /api/v1/restaurants/:id

Klijenti: web, budući Android.

Vraća detalje restorana, proizvode i radno vreme.

Greške: `BAD_REQUEST`, `RESTAURANT_NOT_FOUND`, `INTERNAL_ERROR`.

## GET /api/v1/restaurants/:id/products

Klijenti: budući Android.

Vraća proizvode restorana.

Response primer:

```json
{
  "success": true,
  "data": [
    { "id": 501, "name": "Humus trio", "image": "/placeholders/food.svg", "priceRsd": 480, "priceDisplay": "480 RSD" }
  ]
}
```

Greške: `BAD_REQUEST`, `RESTAURANT_NOT_FOUND`.

## GET /api/v1/restaurants/:id/availability

Klijenti: budući Android.

Vraća `timezone`, `leadTimeMinutes` i `workingHours`.

Radno vreme koristi `dayOfWeek` gde je `0` nedelja, `1` ponedeljak. Vreme je `HH:MM` u vremenskoj zoni restorana.

## POST /api/v1/orders

Klijenti: web, budući Android.

Header-i:

- `Content-Type: application/json`
- `Idempotency-Key: <stabilan ključ>` preporučeno i za Android obavezno u praksi. Ključ mora imati 8-200 karaktera i sme sadržati slova, brojeve, `.`, `_`, `:` i `-`.

Request body:

```json
{
  "restaurantId": 7,
  "customerName": "Marko Marković",
  "customerEmail": "marko@example.com",
  "customerPhone": "+381641234567",
  "eventAddress": "Bulevar 1, Beograd",
  "eventDate": "2026-07-13",
  "eventTime": "12:00",
  "note": "Dostava na recepciju",
  "sendSms": true,
  "sendEmail": true,
  "items": [
    { "productId": 501, "quantity": 2 }
  ]
}
```

Server je autoritet za proizvode, cene, subtotal, dostavu, total, minimalnu porudžbinu i termin. Klijent nikada ne šalje total.

Response `201`:

```json
{
  "success": true,
  "data": {
    "id": 123,
    "accessToken": "server-generated-token",
    "status": "pending",
    "totalRsd": 1130,
    "total": "1.130 RSD",
    "subtotalRsd": 960,
    "deliveryFeeRsd": 170,
    "orderSource": "db",
    "idempotentReplay": false,
    "smsDelivery": "skipped",
    "emailDelivery": "skipped",
    "customerPhone": "+381641234567",
    "customerEmail": "marko@example.com"
  }
}
```

`accessToken` se vraća samo kada je porudžbina prvi put kreirana. U bazi se čuva samo hash tokena.

Response `200` za idempotentni replay vraća isti oblik sa `idempotentReplay: true`, ali ne vraća `accessToken` i ne šalje ponovo SMS/email.

`smsDelivery` i `emailDelivery` su statusi: `not_requested`, `pending`, `sent`, `failed` ili `skipped`. Naziv providera se čuva samo u internom notification logu.

Greške: `BAD_REQUEST`, `VALIDATION_ERROR`, `RESTAURANT_NOT_FOUND`, `PRODUCT_NOT_FOUND`, `RESTAURANT_UNAVAILABLE`, `MINIMUM_ORDER_NOT_MET`, `INVALID_ORDER_TIME`, `IDEMPOTENCY_CONFLICT`, `RATE_LIMITED`, `REQUEST_TOO_LARGE`, `DATABASE_UNAVAILABLE`.

## GET /api/v1/orders/:id

Klijenti: budući Android, samo za prikaz potvrde porudžbine.

Header:

- `X-Order-Access-Token` obavezan.

Bez `X-Order-Access-Token` ID porudžbine nije dovoljan za pristup. Token se ne šalje kroz query string da ne bi završio u URL logovima.

Greške: `BAD_REQUEST`, `ORDER_NOT_FOUND`.

## Rate limiting i CORS

`POST /api/v1/orders` vraća `429 RATE_LIMITED` i `Retry-After` kada lokalni limiter odbije zahtev. Trenutna implementacija je in-memory i prikladna samo za single-instance deployment; produkcioni multi-instance deployment treba shared storage limiter.

CORS je bitan za browser web klijent. Native Android HTTP klijent ne koristi browser CORS, ali treba da koristi iste API URL-ove i headere.
