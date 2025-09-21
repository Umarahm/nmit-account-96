DROP INDEX "products_hsn_idx";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "hsn_code";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "sac_code";--> statement-breakpoint
ALTER TABLE "tax_settings" DROP COLUMN "hsn_codes";