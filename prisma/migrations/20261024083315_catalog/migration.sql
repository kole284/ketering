-- CreateEnum
CREATE TYPE "service" AS ENUM ('ketering', 'torte-i-kolaci', 'kuvana-jela', 'pica');

-- CreateEnum
CREATE TYPE "unit" AS ENUM ('kg', 'kom', 'porcija', 'paket');

-- CreateTable
CREATE TABLE "restaurants" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "area" TEXT NOT NULL,
    "pickup_address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "order_email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "lead_time_hours" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "image_url" TEXT,
    "rating_avg" DOUBLE PRECISION,
    "rating_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "restaurants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "restaurant_services" (
    "restaurant_id" TEXT NOT NULL,
    "service" "service" NOT NULL,

    CONSTRAINT "restaurant_services_pkey" PRIMARY KEY ("restaurant_id","service")
);

-- CreateTable
CREATE TABLE "menu_items" (
    "id" TEXT NOT NULL,
    "restaurant_id" TEXT,
    "service" "service" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price_rsd" INTEGER NOT NULL,
    "unit" "unit" NOT NULL,
    "unit_note" TEXT,
    "min_qty_tenths" INTEGER NOT NULL DEFAULT 10,
    "step_tenths" INTEGER NOT NULL DEFAULT 10,
    "is_popular" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "image_url" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "menu_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delivery_cities" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "delivery_cities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "delivery_fee_rsd" INTEGER NOT NULL,
    "platform_fee_rsd" INTEGER NOT NULL,
    "delivery_minimum_rsd" INTEGER NOT NULL,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "menu_items_restaurant_id_sort_order_idx" ON "menu_items"("restaurant_id", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "delivery_cities_name_key" ON "delivery_cities"("name");

-- AddForeignKey
ALTER TABLE "restaurant_services" ADD CONSTRAINT "restaurant_services_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Rules Prisma cannot express in the schema.
-- A menu item without a restaurant is a Servingo drink, and drinks belong to no restaurant.
ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_drink_has_no_restaurant"
  CHECK (("restaurant_id" IS NULL) = ("service" = 'pica'));
ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_quantities_positive"
  CHECK ("min_qty_tenths" > 0 AND "step_tenths" > 0 AND "price_rsd" >= 0);
-- Settings is a single row.
ALTER TABLE "settings" ADD CONSTRAINT "settings_single_row" CHECK ("id" = 1);
