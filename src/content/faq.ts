export type FaqItem = {
  id: string;
  question: string;
  answer: string;
  featured?: boolean;
};

export type FaqCategory = {
  id: string;
  title: string;
  questions: FaqItem[];
};

export const faqCategories: FaqCategory[] = [
  {
    id: "porucivanje",
    title: "Poručivanje",
    questions: [
      {
        id: "kako-mogu-da-porucim-hranu",
        question: "Kako mogu da poručim hranu?",
        answer:
          "Izaberite restoran, dodajte željene proizvode u korpu, unesite podatke za dostavu i potvrdite porudžbinu. Nakon uspešnog slanja, prikazaće vam se broj porudžbine.",
        featured: true,
      },
      {
        id: "da-li-moram-da-napravim-nalog",
        question: "Da li moram da napravim nalog?",
        answer:
          "Ne. Porudžbinu možete napraviti kao gost unosom imena, broja telefona, email adrese i adrese za dostavu.",
        featured: true,
      },
      {
        id: "proizvodi-iz-vise-restorana",
        question: "Da li mogu da poručim proizvode iz više restorana?",
        answer:
          "Jedna porudžbina može sadržati proizvode samo iz jednog restorana. Za proizvode iz drugog restorana potrebno je napraviti novu porudžbinu.",
      },
      {
        id: "kako-znam-da-je-porudzbina-poslata",
        question: "Kako znam da je porudžbina uspešno poslata?",
        answer:
          "Nakon potvrde porudžbine prikazaće vam se broj porudžbine. Ako je email servis konfigurisan i poruka uspešno poslata, potvrdu sa detaljima dobićete i na email adresu koju ste uneli.",
      },
      {
        id: "da-li-restoran-dobija-porudzbinu",
        question: "Da li restoran odmah dobija moju porudžbinu?",
        answer:
          "Nakon uspešnog kreiranja porudžbine, restoran dobija podatke o stavkama, adresi, terminu dostave i kontakt podacima kupca kroz postojeći tok obaveštavanja.",
      },
    ],
  },
  {
    id: "dostava",
    title: "Dostava",
    questions: [
      {
        id: "koliko-traje-dostava",
        question: "Koliko traje dostava?",
        answer:
          "Procenjeno vreme dostave zavisi od restorana, udaljenosti, veličine porudžbine i izabranog termina. Dostupne informacije prikazane su na stranici svakog restorana.",
      },
      {
        id: "unapred-zakazana-dostava",
        question: "Da li mogu unapred da zakažem dostavu?",
        answer:
          "Da. Prilikom poručivanja možete izabrati dostupan datum i vreme dostave u okviru trenutno podržanog perioda za zakazivanje.",
        featured: true,
      },
      {
        id: "koliko-unapred-poruciti",
        question: "Koliko unapred treba da poručim ketering?",
        answer:
          "Za manje porudžbine dovoljno je poručiti u skladu sa raspoloživim terminima restorana. Za veće porudžbine, poslovne događaje i proslave preporučuje se poručivanje nekoliko dana unapred.",
      },
      {
        id: "minimalna-vrednost-porudzbine",
        question: "Da li postoji minimalna vrednost porudžbine?",
        answer:
          "Minimalna vrednost zavisi od restorana. Biće jasno prikazana na stranici restorana i proverava se pre čuvanja porudžbine.",
        featured: true,
      },
      {
        id: "koliko-kosta-dostava",
        question: "Koliko košta dostava?",
        answer:
          "Cena dostave zavisi od restorana i prikazuje se u korpi pre potvrde porudžbine. Konačan iznos se ponovo obračunava na serveru.",
        featured: true,
      },
    ],
  },
  {
    id: "placanje",
    title: "Plaćanje",
    questions: [
      {
        id: "da-li-su-cene-konacne",
        question: "Da li su cene na sajtu konačne?",
        answer:
          "Pre potvrde ćete videti cenu proizvoda, cenu dostave i ukupan iznos porudžbine. Finalni iznos se ponovo računa na serveru pre čuvanja porudžbine.",
      },
      {
        id: "koji-nacini-placanja-su-dostupni",
        question: "Koji načini plaćanja su dostupni?",
        answer:
          "Online plaćanje trenutno nije prikazano kao deo toka poručivanja. Ako restoran podržava plaćanje pouzećem, karticom ili po predračunu, te informacije treba potvrditi direktno sa restoranom.",
        featured: true,
      },
    ],
  },
  {
    id: "izmene-i-otkazivanje",
    title: "Izmene i otkazivanje",
    questions: [
      {
        id: "izmena-porudzbine-nakon-slanja",
        question: "Da li mogu da izmenim porudžbinu nakon slanja?",
        answer:
          "Nakon slanja izmene nisu uvek moguće jer restoran može odmah početi pripremu. Kontaktirajte restoran što je pre moguće i navedite broj porudžbine.",
      },
      {
        id: "otkazivanje-porudzbine",
        question: "Da li mogu da otkažem porudžbinu?",
        answer:
          "Otkazivanje preko sajta trenutno nije dostupno. Otkazivanje zavisi od trenutnog statusa porudžbine i pravila restorana, pa je potrebno što pre kontaktirati restoran sa brojem porudžbine.",
        featured: true,
      },
    ],
  },
  {
    id: "alergije-i-posebni-zahtevi",
    title: "Alergije i posebni zahtevi",
    questions: [
      {
        id: "alergije-i-posebni-zahtevi",
        question: "Da li mogu da navedem alergije?",
        answer:
          "Da. U polju za napomenu možete navesti alergije, intolerancije i druge posebne zahteve. Za ozbiljne alergije preporučuje se da dodatno kontaktirate restoran pre poručivanja.",
        featured: true,
      },
      {
        id: "izmena-sastojaka",
        question: "Da li mogu da tražim izmenu sastojaka?",
        answer:
          "Poseban zahtev možete navesti u napomeni. Restoran će ga ispuniti samo ako je to moguće, a po potrebi će vas kontaktirati.",
      },
    ],
  },
  {
    id: "poslovne-i-velike-porudzbine",
    title: "Poslovne i velike porudžbine",
    questions: [
      {
        id: "porudzbina-za-firmu-ili-dogadjaj",
        question: "Da li mogu da poručim za firmu ili veći događaj?",
        answer:
          "Da. Možete poručiti za sastanke, kancelarije, rođendane, proslave i druge događaje. Za veći broj osoba preporučuje se da porudžbinu napravite unapred.",
      },
      {
        id: "racun-za-firmu",
        question: "Da li mogu da dobijem račun za firmu?",
        answer:
          "Aplikacija trenutno ne prikuplja posebne podatke za pravna lica u posebnom koraku. Ako vam je potreban račun, navedite podatke firme u napomeni ili ih potvrdite direktno sa restoranom.",
      },
    ],
  },
  {
    id: "email-potvrde-i-tehnicki-problemi",
    title: "Email potvrde i tehnički problemi",
    questions: [
      {
        id: "nisam-dobio-email-potvrdu",
        question: "Šta ako nisam dobio email potvrdu?",
        answer:
          "Proverite Spam, Junk ili Promotions folder. Ako potvrda nije stigla, proverite da li je email adresa ispravno uneta i kontaktirajte restoran ili korisničku podršku.",
      },
      {
        id: "restoran-ne-moze-da-prihvati",
        question: "Šta ako restoran ne može da prihvati porudžbinu?",
        answer:
          "Restoran će vas kontaktirati putem telefona ili emaila ako neki proizvod nije dostupan ili porudžbinu nije moguće pripremiti u izabranom terminu.",
      },
      {
        id: "tehnicka-greska",
        question: "Šta da uradim ako je došlo do tehničke greške?",
        answer:
          "Nemojte ponavljati porudžbinu dok ne proverite da li ste dobili broj porudžbine ili email potvrdu. Ako niste sigurni, kontaktirajte korisničku podršku.",
      },
    ],
  },
  {
    id: "privatnost-i-podrska",
    title: "Privatnost i podrška",
    questions: [
      {
        id: "cuvanje-licnih-podataka",
        question: "Kako se čuvaju moji lični podaci?",
        answer:
          "Podaci se koriste za obradu i dostavu porudžbine, komunikaciju u vezi sa porudžbinom i ispunjavanje zakonskih obaveza. Detaljnije informacije treba da budu dostupne u Politici privatnosti.",
      },
      {
        id: "problem-sa-porudzbinom",
        question: "Kome da se obratim ako imam problem sa porudžbinom?",
        answer:
          "Za probleme u vezi sa pripremom, dostavom ili sadržajem porudžbine kontaktirajte restoran i pripremite broj porudžbine. Za tehničke probleme sa sajtom obratite se korisničkoj podršci.",
      },
    ],
  },
];

export function getAllFaqItems(categories: FaqCategory[] = faqCategories): FaqItem[] {
  return categories.flatMap((category) => category.questions);
}

export function getFeaturedFaqItems(categories: FaqCategory[] = faqCategories): FaqItem[] {
  return getAllFaqItems(categories).filter((item) => item.featured);
}

export function getDuplicateFaqIds(categories: FaqCategory[] = faqCategories): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  for (const item of getAllFaqItems(categories)) {
    if (seen.has(item.id)) {
      duplicates.add(item.id);
    }

    seen.add(item.id);
  }

  return Array.from(duplicates);
}

export function buildFaqJsonLd(items: FaqItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}
