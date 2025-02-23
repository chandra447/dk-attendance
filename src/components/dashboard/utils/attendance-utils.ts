import { differenceInHours, differenceInMinutes } from "date-fns";

export function formatDuration(clockIn: Date | null, clockOut: Date | null): string {
    // If there's no clock-out time, calculate duration from clock-in to current time
    if (clockIn && !clockOut) {
        const now = new Date();
        const hours = differenceInHours(now, clockIn);
        const minutes = differenceInMinutes(now, clockIn) % 60;
        return formatTime(hours, minutes);
    }

    // If there's only clock-out time (employee is out), calculate duration from clock-out to current time
    if (!clockIn && clockOut) {
        const now = new Date();
        const hours = differenceInHours(now, clockOut);
        const minutes = differenceInMinutes(now, clockOut) % 60;
        return `Out for ${formatTime(hours, minutes)}`;
    }

    // If both times exist, calculate duration between them
    if (clockIn && clockOut) {
        // Calculate from clockIn to clockOut (not the other way around)
        const hours = differenceInHours(clockOut, clockIn);
        const minutes = differenceInMinutes(clockOut, clockIn) % 60;
        if (hours < 0 || minutes < 0) {
            // If we still get negative values, swap the order
            const positiveHours = Math.abs(hours);
            const positiveMinutes = Math.abs(minutes);
            return formatTime(positiveHours, positiveMinutes);
        }
        return formatTime(hours, minutes);
    }

    // If no times exist
    return "No duration";
}

// Helper function to format hours and minutes consistently
export function formatTime(hours: number, minutes: number): string {
    if (hours === 0) {
        return `${minutes}m`;
    }
    return minutes === 0 ? `${hours}h` : `${hours}h ${minutes}m`;
} 