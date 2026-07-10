import { BadRequestError, RequestTooLargeError } from "@/lib/server/errors";

export async function readJsonWithLimit(request: Request, maxBytes: number): Promise<unknown> {
  const contentLength = request.headers.get("content-length");

  if (contentLength) {
    const parsedLength = Number(contentLength);

    if (!Number.isFinite(parsedLength) || parsedLength < 0) {
      throw new BadRequestError("Nevažeći Content-Length header.");
    }

    if (parsedLength > maxBytes) {
      throw new RequestTooLargeError();
    }
  }

  const bodyText = await request.text();

  if (Buffer.byteLength(bodyText, "utf8") > maxBytes) {
    throw new RequestTooLargeError();
  }

  try {
    return JSON.parse(bodyText);
  } catch {
    throw new BadRequestError("Nevažeći JSON payload.");
  }
}
