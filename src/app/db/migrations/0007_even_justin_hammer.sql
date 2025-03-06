ALTER TABLE "register_logs" DROP CONSTRAINT "register_logs_register_employee_id_register_employees_id_fk";
--> statement-breakpoint
ALTER TABLE "register_logs" ALTER COLUMN "status" SET DEFAULT 'active';--> statement-breakpoint
ALTER TABLE "register_logs" ADD COLUMN "register_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "register_logs" ADD COLUMN "date" date NOT NULL;--> statement-breakpoint
ALTER TABLE "register_logs" ADD COLUMN "start_time" timestamp NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "register_logs" ADD CONSTRAINT "register_logs_register_id_registers_id_fk" FOREIGN KEY ("register_id") REFERENCES "registers"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "register_logs" DROP COLUMN IF EXISTS "register_employee_id";--> statement-breakpoint
ALTER TABLE "register_logs" DROP COLUMN IF EXISTS "log_time";