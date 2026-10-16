import type { Metadata } from "next";
import { PageShell } from "@/components/page-shell";

export const metadata: Metadata = { title: "Postani deo nas | Servingo" };

export default function PartnershipPage() {
  return (
    <PageShell
      title="Postani deo nas"
      intro="Imaš restoran, poslastičarnicu ili vinoteku? Primaj porudžbine za događaje preko Servinga, a dostavu prepusti nama."
    />
  );
}
