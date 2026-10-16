import { SERVICES } from "@/lib/booking";
import type { Dictionary } from "@/i18n/dictionaries/sr";

export const categoryLinks = (t: Dictionary) =>
  SERVICES.map((service) => ({
    path: `/restorani?usluge=${service.id}`,
    label: t.services[service.id],
  }));

export const footerLinks = (t: Dictionary) => [
  { path: "/kontakt", label: t.footer.contact },
  { path: "/o-nama", label: t.footer.about },
  { path: "/privatnost-i-uslovi", label: t.footer.legal },
  { path: "/postani-deo-nas", label: t.footer.partner },
];
