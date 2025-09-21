CREATE TABLE "tax_configuration" (
	"id" varchar(10) PRIMARY KEY NOT NULL,
	"enable_tax" boolean DEFAULT true,
	"default_tax_rate" numeric(5, 2) DEFAULT '18.00',
	"tax_display_format" varchar(20) DEFAULT 'percentage',
	"rounding_method" varchar(10) DEFAULT 'round',
	"compound_tax" boolean DEFAULT false,
	"tax_on_shipping" boolean DEFAULT false,
	"prices_include_tax" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tax_settings" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"rate" numeric(5, 2) NOT NULL,
	"type" varchar(20) DEFAULT 'exclusive' NOT NULL,
	"is_default" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"category" varchar(20) DEFAULT 'both' NOT NULL,
	"hsn_codes" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'CONTACT';--> statement-breakpoint
CREATE INDEX "tax_settings_name_idx" ON "tax_settings" USING btree ("name");--> statement-breakpoint
CREATE INDEX "tax_settings_default_idx" ON "tax_settings" USING btree ("is_default");--> statement-breakpoint
CREATE INDEX "tax_settings_category_idx" ON "tax_settings" USING btree ("category");