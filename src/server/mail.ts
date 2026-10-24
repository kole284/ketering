import "server-only";

export type Mail = { to: string; subject: string; text: string };

export type MailStatus = { status: "sent" | "logged" | "failed"; error?: string };

const escapeHtml = (text: string) =>
  text.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** Plain paragraphs; links stay clickable as text in every mail client. */
const toHtml = (text: string) =>
  `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.5;color:#111">${text
    .split("\n\n")
    .map((block) => `<p>${escapeHtml(block).replace(/\n/g, "<br>")}</p>`)
    .join("")}</div>`;

/**
 * Sends through Resend when RESEND_API_KEY is set. Without it the email is only logged,
 * so development and previews never mail real people.
 */
export async function sendMail(mail: Mail): Promise<MailStatus> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    // Full text only in development; deployed logs should not hold customer details.
    console.info(
      process.env.NODE_ENV === "development"
        ? `[mail] to ${mail.to}: ${mail.subject}\n${mail.text}`
        : `[mail] not sent (no RESEND_API_KEY): ${mail.subject}`,
    );
    return { status: "logged" };
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.MAIL_FROM ?? "Servingo <porudzbine@servingo.rs>",
        to: [mail.to],
        subject: mail.subject,
        text: mail.text,
        html: toHtml(mail.text),
      }),
    });
    if (res.ok) return { status: "sent" };
    return { status: "failed", error: `${res.status} ${(await res.text()).slice(0, 500)}` };
  } catch (error) {
    return { status: "failed", error: String(error).slice(0, 500) };
  }
}
