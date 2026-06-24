import process from "node:process";

export type SmsDeliveryMethod = "twilio" | "composer";

export type BuildOrderSmsInput = {
  orderId: number;
  restaurantName: string;
  customerName: string;
  total: string;
  eventAddress: string;
  eventDate: string;
  eventTime: string;
  items: Array<{
    name: string;
    quantity: number;
  }>;
  note?: string;
};

export function normalizeSerbianPhoneNumber(phone: string): string | null {
  const trimmed = phone.trim();
  const digits = trimmed.replace(/\D/g, "");

  if (trimmed.startsWith("+381") && digits.startsWith("381")) {
    return `+${digits}`;
  }

  if (digits.startsWith("381") && digits.length >= 11) {
    return `+${digits}`;
  }

  if (digits.startsWith("0") && digits.length >= 8 && digits.length <= 10) {
    return `+381${digits.slice(1)}`;
  }

  return null;
}

export function buildOrderSmsMessage(input: BuildOrderSmsInput): string {
  const itemSummary = input.items
    .slice(0, 4)
    .map((item) => `${item.name} x${item.quantity}`)
    .join(", ");
  const extraCount = Math.max(0, input.items.length - 4);
  const extraText = extraCount > 0 ? ` + jos ${extraCount} stavki` : "";

  const segments = [
    `KeteringGo porudzbina #${input.orderId}`,
    `Kupac: ${input.customerName}`,
    `Restoran: ${input.restaurantName}`,
    `Termin: ${input.eventDate} u ${input.eventTime}`,
    `Adresa: ${input.eventAddress}`,
    `Stavke: ${itemSummary}${extraText}`,
    `Ukupno: ${input.total}`,
  ];

  if (input.note) {
    segments.push(`Napomena: ${input.note}`);
  }

  segments.push("Hvala na porudzbini!");

  return segments.join(" | ");
}

function buildSmsComposerLink(recipient: string, body: string): string {
  return `sms:${recipient}?body=${encodeURIComponent(body)}`;
}

async function sendViaTwilio(recipient: string, body: string): Promise<void> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_FROM_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    throw new Error("Twilio credentials are missing.");
  }

  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      To: recipient,
      From: fromNumber,
      Body: body,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Twilio request failed: ${errorText}`);
  }
}

export async function deliverOrderSms(recipient: string, body: string): Promise<{
  method: SmsDeliveryMethod;
  smsLink?: string;
}> {
  try {
    await sendViaTwilio(recipient, body);
    return { method: "twilio" };
  } catch (error) {
    console.warn("SMS delivery fallback active", error);

    return {
      method: "composer",
      smsLink: buildSmsComposerLink(recipient, body),
    };
  }
}