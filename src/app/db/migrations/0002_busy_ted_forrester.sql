ALTER TABLE "attendance_logger" ALTER COLUMN "clock_in" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "attendance_logger" ALTER COLUMN "clock_out" SET NOT NULL;