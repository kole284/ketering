import type { Metadata } from "next";
import { PageShell } from "@/components/page-shell";

export const metadata: Metadata = { title: "O nama | Servingo" };

export default function AboutPage() {
  return (
    <PageShell
      title="O nama"
      intro="Servingo povezuje ljude sa restoranima, poslastičarnicama i vinotekama koji pripremaju ketering, torte, kuvana jela i pića, i dostavlja ih na vreme."
    />
  );
}
