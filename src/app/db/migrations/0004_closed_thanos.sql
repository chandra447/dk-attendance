ALTER TABLE "employees" ALTER COLUMN "department" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "start_time" time NOT NULL;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "end_time" time NOT NULL;