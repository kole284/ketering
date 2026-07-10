# Admin Plan

U ovom koraku nije uveden admin sistem niti improvizovana autentifikacija. Minimalni admin scope potreban pre produkcije:

- Pregled porudžbina sa filterima po datumu, statusu, restoranu i gradu.
- Detalj porudžbine sa stavkama, kontaktom kupca, terminom, subtotalom, dostavom, totalom i notification statusima.
- Promena statusa porudžbine, najmanje `pending`, `accepted`, `rejected`, `in_preparation`, `delivered`, `cancelled`.
- CRUD gradova i dostupnosti usluge.
- CRUD restorana, uključujući aktivnost, minimalnu porudžbinu, cenu dostave, lead time i timezone.
- CRUD proizvoda sa numeričkom cenom `priceRsd`.
- CRUD ponuda/restoranskih badge-eva.
- Radno vreme po danu u nedelji.
- Audit log za promene statusa i poslovnih podataka.

Auth treba rešiti pre admin UI-ja. `.env.example` više ne sadrži neiskorišćene auth placeholder-e; kada se auth uvodi, treba odabrati jasan sistem i pokriti ga testovima.

