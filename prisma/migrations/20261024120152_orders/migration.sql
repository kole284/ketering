-- CreateEnum
CREATE TYPE "method" AS ENUM ('dostava', 'preuzimanje');

-- CreateEnum
CREATE TYPE "buyer_type" AS ENUM ('fizicko', 'pravno');

-- CreateEnum
CREATE TYPE "order_status" AS ENUM ('pending_payment', 'paid', 'payment_failed', 'cancelled', 'refunded');

-- CreateEnum
CREATE TYPE "fulfilment" AS ENUM ('delivery', 'pickup');

-- CreateEnum
CREATE TYPE "pickup_reason" AS ENUM ('chosen', 'city', 'minimum');

-- CreateEnum
CREATE TYPE "bill_status" AS ENUM ('new', 'confirmed', 'ready', 'delivered', 'picked_up', 'cancelled');

-- CreateEnum
CREATE TYPE "payment_status" AS ENUM ('succeeded', 'failed');

-- CreateEnum
CREATE TYPE "recipient" AS ENUM ('customer', 'restaurant', 'servingo');

-- CreateEnum
CREATE TYPE "notification_status" AS ENUM ('sent', 'failed', 'logged');

-- AlterTable
ALTER TABLE "settings" ADD COLUMN     "pending_payment_minutes" INTEGER NOT NULL DEFAULT 30,
ADD COLUMN     "servingo_orders_email" TEXT NOT NULL DEFAULT 'porudzbine@servingo.rs';

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "public_code" TEXT NOT NULL,
    "access_token" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "delivery_date" DATE NOT NULL,
    "slot_hour" INTEGER NOT NULL,
    "method" "method" NOT NULL,
    "city" TEXT,
    "address" TEXT,
    "customer_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "buyer_type" "buyer_type" NOT NULL,
    "company_name" TEXT,
    "pib" TEXT,
    "mb" TEXT,
    "total_rsd" INTEGER NOT NULL,
    "status" "order_status" NOT NULL DEFAULT 'pending_payment',
    "idempotency_key" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "paid_at" TIMESTAMPTZ(6),

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bills" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "restaurant_id" TEXT,
    "seller_name" TEXT NOT NULL,
    "fulfilment" "fulfilment" NOT NULL,
    "pickup_reason" "pickup_reason",
    "subtotal_rsd" INTEGER NOT NULL,
    "delivery_fee_rsd" INTEGER NOT NULL,
    "platform_fee_rsd" INTEGER NOT NULL,
    "total_rsd" INTEGER NOT NULL,
    "has_drinks" BOOLEAN NOT NULL,
    "status" "bill_status" NOT NULL DEFAULT 'new',
    "invoice_number" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "bills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bill_items" (
    "id" TEXT NOT NULL,
    "bill_id" TEXT NOT NULL,
    "menu_item_id" TEXT,
    "name" TEXT NOT NULL,
    "unit" "unit" NOT NULL,
    "unit_note" TEXT,
    "unit_price_rsd" INTEGER NOT NULL,
    "quantity_tenths" INTEGER NOT NULL,
    "line_total_rsd" INTEGER NOT NULL,
    "is_drink" BOOLEAN NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "bill_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_ref" TEXT NOT NULL,
    "amount_rsd" INTEGER NOT NULL,
    "status" "payment_status" NOT NULL,
    "raw_payload" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "bill_id" TEXT,
    "recipient" "recipient" NOT NULL,
    "to_email" TEXT NOT NULL,
    "template" TEXT NOT NULL,
    "status" "notification_status" NOT NULL,
    "error" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "orders_public_code_key" ON "orders"("public_code");

-- CreateIndex
CREATE UNIQUE INDEX "orders_idempotency_key_key" ON "orders"("idempotency_key");

-- CreateIndex
CREATE INDEX "orders_status_expires_at_idx" ON "orders"("status", "expires_at");

-- CreateIndex
CREATE INDEX "bills_order_id_idx" ON "bills"("order_id");

-- CreateIndex
CREATE INDEX "bills_restaurant_id_status_idx" ON "bills"("restaurant_id", "status");

-- CreateIndex
CREATE INDEX "bill_items_bill_id_idx" ON "bill_items"("bill_id");

-- CreateIndex
CREATE INDEX "payments_order_id_idx" ON "payments"("order_id");

-- CreateIndex
CREATE UNIQUE INDEX "payments_provider_provider_ref_key" ON "payments"("provider", "provider_ref");

-- CreateIndex
CREATE INDEX "notifications_order_id_idx" ON "notifications"("order_id");

-- AddForeignKey
ALTER TABLE "bills" ADD CONSTRAINT "bills_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bills" ADD CONSTRAINT "bills_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bill_items" ADD CONSTRAINT "bill_items_bill_id_fkey" FOREIGN KEY ("bill_id") REFERENCES "bills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bill_items" ADD CONSTRAINT "bill_items_menu_item_id_fkey" FOREIGN KEY ("menu_item_id") REFERENCES "menu_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_bill_id_fkey" FOREIGN KEY ("bill_id") REFERENCES "bills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Rules Prisma cannot express in the schema.
ALTER TABLE "orders" ADD CONSTRAINT "orders_slot_hour" CHECK ("slot_hour" BETWEEN 0 AND 23);
ALTER TABLE "orders" ADD CONSTRAINT "orders_total_positive" CHECK ("total_rsd" > 0);
ALTER TABLE "bills" ADD CONSTRAINT "bills_total_adds_up"
  CHECK ("total_rsd" = "subtotal_rsd" + "delivery_fee_rsd" + "platform_fee_rsd");
ALTER TABLE "bill_items" ADD CONSTRAINT "bill_items_quantity_positive" CHECK ("quantity_tenths" > 0);
