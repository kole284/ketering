export type ErrorCode =
  | "BAD_REQUEST"
  | "VALIDATION_ERROR"
  | "RESTAURANT_NOT_FOUND"
  | "ORDER_NOT_FOUND"
  | "PRODUCT_NOT_FOUND"
  | "RESTAURANT_UNAVAILABLE"
  | "MINIMUM_ORDER_NOT_MET"
  | "INVALID_ORDER_TIME"
  | "DATABASE_UNAVAILABLE"
  | "NOTIFICATION_ERROR"
  | "IDEMPOTENCY_CONFLICT"
  | "RATE_LIMITED"
  | "REQUEST_TOO_LARGE"
  | "INTERNAL_ERROR";

export class ApplicationError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly expose: boolean;

  constructor(code: ErrorCode, message: string, status: number, expose = true) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.status = status;
    this.expose = expose;
  }
}

export class BadRequestError extends ApplicationError {
  constructor(message = "Neispravan zahtev.", code: ErrorCode = "BAD_REQUEST") {
    super(code, message, 400);
  }
}

export class ValidationError extends ApplicationError {
  constructor(message = "Podaci nisu validni.") {
    super("VALIDATION_ERROR", message, 422);
  }
}

export class RestaurantNotFoundError extends ApplicationError {
  constructor(message = "Restoran nije pronađen.") {
    super("RESTAURANT_NOT_FOUND", message, 404);
  }
}

export class OrderNotFoundError extends ApplicationError {
  constructor(message = "Porudžbina nije pronađena.") {
    super("ORDER_NOT_FOUND", message, 404);
  }
}

export class ProductNotFoundError extends ApplicationError {
  constructor(message = "Neki proizvodi nisu važeći za izabrani restoran.") {
    super("PRODUCT_NOT_FOUND", message, 404);
  }
}

export class RestaurantUnavailableError extends ApplicationError {
  constructor(message = "Restoran trenutno nije dostupan za poručivanje.") {
    super("RESTAURANT_UNAVAILABLE", message, 422);
  }
}

export class MinimumOrderNotMetError extends ApplicationError {
  constructor(message: string) {
    super("MINIMUM_ORDER_NOT_MET", message, 422);
  }
}

export class InvalidOrderTimeError extends ApplicationError {
  constructor(message = "Izabrani termin nije dostupan za ovaj restoran.") {
    super("INVALID_ORDER_TIME", message, 422);
  }
}

export class DatabaseUnavailableError extends ApplicationError {
  constructor(message = "Poručivanje trenutno nije dostupno. Pokušajte ponovo kasnije.") {
    super("DATABASE_UNAVAILABLE", message, 503);
  }
}

export class NotificationError extends ApplicationError {
  constructor(message = "Notifikacija nije poslata.") {
    super("NOTIFICATION_ERROR", message, 502, false);
  }
}

export class IdempotencyConflictError extends ApplicationError {
  constructor(message = "Idempotency-Key je već upotrebljen za drugačiji zahtev.") {
    super("IDEMPOTENCY_CONFLICT", message, 409);
  }
}

export class RateLimitedError extends ApplicationError {
  constructor(message = "Previše zahteva. Pokušajte ponovo kasnije.") {
    super("RATE_LIMITED", message, 429);
  }
}

export class RequestTooLargeError extends ApplicationError {
  constructor(message = "Zahtev je prevelik.") {
    super("REQUEST_TOO_LARGE", message, 413);
  }
}

export function isDatabaseUnavailableError(error: unknown): boolean {
  if (error instanceof DatabaseUnavailableError) {
    return true;
  }

  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();

  return (
    message.includes("econnrefused") ||
    message.includes("connection refused") ||
    message.includes("could not connect") ||
    message.includes("the database system is starting up") ||
    message.includes("server closed the connection unexpectedly") ||
    message.includes("terminating connection") ||
    message.includes("relation ") ||
    message.includes("database")
  );
}

export function toApplicationError(error: unknown): ApplicationError {
  if (error instanceof ApplicationError) {
    return error;
  }

  if (isDatabaseUnavailableError(error)) {
    return new DatabaseUnavailableError();
  }

  return new ApplicationError("INTERNAL_ERROR", "Došlo je do neočekivane greške.", 500, false);
}
