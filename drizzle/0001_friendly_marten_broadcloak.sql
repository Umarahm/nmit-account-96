CREATE TABLE "company_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_name" varchar(255) NOT NULL,
	"address" jsonb,
	"tax_info" jsonb,
	"logo" text,
	"email" varchar(255),
	"phone" varchar(20),
	"website" varchar(255),
	"fiscal_year_start" varchar(5) DEFAULT '04-01',
	"base_currency" varchar(3) DEFAULT 'INR',
	"timezone" varchar(50) DEFAULT 'Asia/Kolkata',
	"date_format" varchar(20) DEFAULT 'DD/MM/YYYY',
	"settings" jsonb,
	"updated_by" integer,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "currencies" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(3) NOT NULL,
	"name" varchar(100) NOT NULL,
	"symbol" varchar(10) NOT NULL,
	"exchange_rate" numeric(10, 4) DEFAULT '1.0000',
	"is_base_currency" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "currencies_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "payment_methods" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"type" varchar(20) NOT NULL,
	"account_id" integer,
	"description" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "product_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"parent_id" integer,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "chart_of_accounts" DROP CONSTRAINT "chart_of_accounts_parent_id_chart_of_accounts_id_fk";
--> statement-breakpoint
ALTER TABLE "chart_of_accounts" ADD COLUMN "level" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "chart_of_accounts" ADD COLUMN "is_group" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "chart_of_accounts" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "chart_of_accounts" ADD COLUMN "updated_at" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "contacts" ADD COLUMN "display_name" varchar(255);--> statement-breakpoint
ALTER TABLE "contacts" ADD COLUMN "phone" varchar(20);--> statement-breakpoint
ALTER TABLE "contacts" ADD COLUMN "website" varchar(255);--> statement-breakpoint
ALTER TABLE "contacts" ADD COLUMN "billing_address" jsonb;--> statement-breakpoint
ALTER TABLE "contacts" ADD COLUMN "shipping_address" jsonb;--> statement-breakpoint
ALTER TABLE "contacts" ADD COLUMN "tax_info" jsonb;--> statement-breakpoint
ALTER TABLE "contacts" ADD COLUMN "credit_limit" numeric(12, 2);--> statement-breakpoint
ALTER TABLE "contacts" ADD COLUMN "payment_terms" integer;--> statement-breakpoint
ALTER TABLE "contacts" ADD COLUMN "currency" varchar(3) DEFAULT 'INR';--> statement-breakpoint
ALTER TABLE "contacts" ADD COLUMN "notes" text;--> statement-breakpoint
ALTER TABLE "contacts" ADD COLUMN "created_by" integer;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "sub_total" numeric(12, 2);--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "paid_amount" numeric(12, 2) DEFAULT '0';--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "balance_amount" numeric(12, 2);--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "currency" varchar(3) DEFAULT 'INR';--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "exchange_rate" numeric(10, 4) DEFAULT '1.0000';--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "terms" text;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "attachments" jsonb;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "created_by" integer;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "payment_number" varchar(50);--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "payment_method_id" integer;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "bank_account" varchar(100);--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "cheque_date" timestamp;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "clearance_date" timestamp;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "status" varchar(20) DEFAULT 'COMPLETED' NOT NULL;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "currency" varchar(3) DEFAULT 'INR';--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "exchange_rate" numeric(10, 4) DEFAULT '1.0000';--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "attachments" jsonb;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "created_by" integer;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "updated_at" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "sku" varchar(100);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "cost_price" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "sac_code" varchar(20);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "brand" varchar(100);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "unit" varchar(20) DEFAULT 'PCS';--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "min_stock_level" integer;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "max_stock_level" integer;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "current_stock" numeric(10, 2) DEFAULT '0';--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "stock_value" numeric(12, 2) DEFAULT '0';--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "images" jsonb;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "specifications" jsonb;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "is_stock_tracked" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "created_by" integer;--> statement-breakpoint
ALTER TABLE "taxes" ADD COLUMN "short_name" varchar(20);--> statement-breakpoint
ALTER TABLE "taxes" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "taxes" ADD COLUMN "account_id" integer;--> statement-breakpoint
ALTER TABLE "taxes" ADD COLUMN "updated_at" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "profile_image" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "last_login_at" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "email_verified_at" timestamp;--> statement-breakpoint
ALTER TABLE "company_settings" ADD CONSTRAINT "company_settings_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_methods" ADD CONSTRAINT "payment_methods_account_id_chart_of_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."chart_of_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "product_categories_name_idx" ON "product_categories" USING btree ("name");--> statement-breakpoint
CREATE INDEX "product_categories_parent_idx" ON "product_categories" USING btree ("parent_id");--> statement-breakpoint
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_payment_method_id_payment_methods_id_fk" FOREIGN KEY ("payment_method_id") REFERENCES "public"."payment_methods"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "taxes" ADD CONSTRAINT "taxes_account_id_chart_of_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."chart_of_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "coa_code_idx" ON "chart_of_accounts" USING btree ("code");--> statement-breakpoint
CREATE INDEX "coa_type_idx" ON "chart_of_accounts" USING btree ("type");--> statement-breakpoint
CREATE INDEX "coa_parent_idx" ON "chart_of_accounts" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "contacts_type_idx" ON "contacts" USING btree ("type");--> statement-breakpoint
CREATE INDEX "contacts_name_idx" ON "contacts" USING btree ("name");--> statement-breakpoint
CREATE INDEX "contacts_email_idx" ON "contacts" USING btree ("email");--> statement-breakpoint
CREATE INDEX "contacts_mobile_idx" ON "contacts" USING btree ("mobile");--> statement-breakpoint
CREATE INDEX "invoices_number_idx" ON "invoices" USING btree ("invoice_number");--> statement-breakpoint
CREATE INDEX "invoices_type_idx" ON "invoices" USING btree ("type");--> statement-breakpoint
CREATE INDEX "invoices_contact_idx" ON "invoices" USING btree ("contact_id");--> statement-breakpoint
CREATE INDEX "invoices_status_idx" ON "invoices" USING btree ("status");--> statement-breakpoint
CREATE INDEX "invoices_date_idx" ON "invoices" USING btree ("invoice_date");--> statement-breakpoint
CREATE INDEX "invoices_due_date_idx" ON "invoices" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX "payments_number_idx" ON "payments" USING btree ("payment_number");--> statement-breakpoint
CREATE INDEX "payments_invoice_idx" ON "payments" USING btree ("invoice_id");--> statement-breakpoint
CREATE INDEX "payments_date_idx" ON "payments" USING btree ("payment_date");--> statement-breakpoint
CREATE INDEX "payments_method_idx" ON "payments" USING btree ("payment_method");--> statement-breakpoint
CREATE INDEX "payments_status_idx" ON "payments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "products_sku_idx" ON "products" USING btree ("sku");--> statement-breakpoint
CREATE INDEX "products_name_idx" ON "products" USING btree ("name");--> statement-breakpoint
CREATE INDEX "products_hsn_idx" ON "products" USING btree ("hsn_code");--> statement-breakpoint
CREATE INDEX "products_category_idx" ON "products" USING btree ("category");--> statement-breakpoint
CREATE INDEX "products_type_idx" ON "products" USING btree ("type");--> statement-breakpoint
CREATE INDEX "taxes_name_idx" ON "taxes" USING btree ("name");--> statement-breakpoint
CREATE INDEX "taxes_applicable_on_idx" ON "taxes" USING btree ("applicable_on");--> statement-breakpoint
CREATE INDEX "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "users_role_idx" ON "users" USING btree ("role");--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_payment_number_unique" UNIQUE("payment_number");