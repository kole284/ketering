import process from "node:process";

type EmailOrderItem = {
  name: string;
  quantity: number;
  unitPrice: string;
  lineTotal: string;
};

export type OrderEmailContext = {
  orderId: number;
  restaurantName: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  total: string;
  eventAddress: string;
  eventDate: string;
  eventTime: string;
  items: EmailOrderItem[];
  note?: string;
};

export type EmailDeliveryResult = {
  method: "emailjs" | "skipped";
  message: string;
};

function formatItemSummary(items: EmailOrderItem[]): string {
  return items.map((item) => `${item.name} x${item.quantity}`).join(" | ");
}

function formatItemDetails(items: EmailOrderItem[]): string {
  return items
    .map((item) => `${item.name} x${item.quantity} | Jedinična cena: ${item.unitPrice} | Stavka: ${item.lineTotal}`)
    .join("\n");
}

function formatItemDetailsHtml(items: EmailOrderItem[]): string {
  return items
    .map(
      (item) =>
        `<li><strong>${escapeHtml(item.name)}</strong> x${item.quantity} - Jedinična cena: ${escapeHtml(item.unitPrice)} - Stavka: ${escapeHtml(item.lineTotal)}</li>`,
    )
    .join("");
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function buildOrderSubject(input: OrderEmailContext): string {
  return `Potvrda porudžbine #${input.orderId} - ${input.restaurantName}`;
}

function buildOrderMessage(input: OrderEmailContext): string {
  const note = input.note ? `\nNapomena: ${input.note}` : "";

  return [
    `Zdravo ${input.customerName},`,
    "",
    `Primili smo tvoju porudžbinu #${input.orderId} iz restorana ${input.restaurantName}.`,
    "",
    "Detalji isporuke:",
    `Adresa: ${input.eventAddress}`,
    `Datum: ${input.eventDate}`,
    `Vreme: ${input.eventTime}`,
    "",
    "Stavke:",
    formatItemDetails(input.items),
    note,
    "",
    `Ukupno: ${input.total}`,
    "",
    "Hvala na porudžbini.",
  ].join("\n");
}

function buildOrderMessageHtml(input: OrderEmailContext): string {
  const note = input.note ? `<p><strong>Napomena:</strong> ${escapeHtml(input.note)}</p>` : "";

  return [
    `<p>Zdravo ${escapeHtml(input.customerName)},</p>`,
    `<p>Primili smo tvoju porudžbinu <strong>#${input.orderId}</strong> iz restorana <strong>${escapeHtml(input.restaurantName)}</strong>.</p>`,
    "<p><strong>Detalji isporuke:</strong></p>",
    "<ul>",
    `<li>Adresa: ${escapeHtml(input.eventAddress)}</li>`,
    `<li>Datum: ${escapeHtml(input.eventDate)}</li>`,
    `<li>Vreme: ${escapeHtml(input.eventTime)}</li>`,
    "</ul>",
    "<p><strong>Stavke:</strong></p>",
    `<ul>${formatItemDetailsHtml(input.items)}</ul>`,
    note,
    `<p><strong>Ukupno: ${escapeHtml(input.total)}</strong></p>`,
    "<p>Hvala na porudžbini.</p>",
  ].join("");
}

function getEmailJsConfig() {
  const serviceId = process.env.EMAILJS_SERVICE_ID;
  const templateId = process.env.EMAILJS_TEMPLATE_ID;
  const publicKey = process.env.EMAILJS_PUBLIC_KEY;
  const privateKey = process.env.EMAILJS_PRIVATE_KEY;

  if (!serviceId || !templateId || !publicKey) {
    return null;
  }

  return { serviceId, templateId, publicKey, privateKey };
}

export function buildOrderEmailPayload(input: OrderEmailContext) {
  const recipientEmail = input.customerEmail.trim();
  const itemCount = input.items.reduce((sum, item) => sum + item.quantity, 0);
  const subject = buildOrderSubject(input);
  const message = buildOrderMessage(input);
  const htmlMessage = buildOrderMessageHtml(input);

  return {
    subject,
    order_subject: subject,
    message,
    text_message: message,
    html_message: htmlMessage,
    to_name: input.customerName,
    to_email: recipientEmail,
    email: recipientEmail,
    recipient_email: recipientEmail,
    recipient: recipientEmail,
    reply_to: input.customerEmail,
    order_id: input.orderId,
    restaurant_name: input.restaurantName,
    customer_name: input.customerName,
    customer_phone: input.customerPhone,
    total: input.total,
    total_amount: input.total,
    order_total: input.total,
    item_count: itemCount,
    event_address: input.eventAddress,
    event_date: input.eventDate,
    event_time: input.eventTime,
    note: input.note ?? "",
    item_summary: formatItemSummary(input.items),
    item_details: formatItemDetails(input.items),
    item_details_html: `<ul>${formatItemDetailsHtml(input.items)}</ul>`,
    items_json: JSON.stringify(input.items),
  };
}

export async function deliverOrderEmail(input: OrderEmailContext): Promise<EmailDeliveryResult> {
  const config = getEmailJsConfig();

  if (!config) {
    return {
      method: "skipped",
      message: "EmailJS nije konfigurisan u okruženju.",
    };
  }

  const response = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      service_id: config.serviceId,
      template_id: config.templateId,
      user_id: config.publicKey,
      ...(config.privateKey ? { accessToken: config.privateKey } : {}),
      template_params: buildOrderEmailPayload(input),
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`EmailJS request failed: ${errorText}`);
  }

  return {
    method: "emailjs",
    message: `Email je poslat na ${input.customerEmail}.`,
  };
}
