CREATE TABLE IF NOT EXISTS "employee_present" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_id" integer NOT NULL,
	"date" date NOT NULL,
	"status" varchar(50) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "attendance_logger" ADD COLUMN "employee_present_id" integer NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "attendance_logger" ADD CONSTRAINT "attendance_logger_employee_present_id_employee_present_id_fk" FOREIGN KEY ("employee_present_id") REFERENCES "employee_present"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "employee_present" ADD CONSTRAINT "employee_present_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
