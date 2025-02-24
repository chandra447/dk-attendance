import { differenceInHours, differenceInMinutes } from "date-fns";

export function formatDuration(clockIn: Date | null, clockOut: Date | null): string {
    if (!clockOut) return "00:00";

    const clockOutTime = new Date(clockOut);

    // If there's no clock-in, calculate duration from clock-out to current time
    if (!clockIn) {
        const now = new Date();
        const diffInMinutes = Math.floor((now.getTime() - clockOutTime.getTime()) / (1000 * 60));
        const hours = Math.floor(Math.abs(diffInMinutes) / 60);
        const minutes = Math.abs(diffInMinutes) % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }

    // If both times exist, calculate normal duration
    const clockInTime = new Date(clockIn);
    const diffInMinutes = Math.floor((clockOutTime.getTime() - clockInTime.getTime()) / (1000 * 60));
    const hours = Math.floor(Math.abs(diffInMinutes) / 60);
    const minutes = Math.abs(diffInMinutes) % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

// Helper function to format hours and minutes consistently
export function formatTime(hours: number, minutes: number): string {
    if (hours === 0) {
        return `${minutes}m`;
    }
    return minutes === 0 ? `${hours}h` : `${hours}h ${minutes}m`;
}

export function formatMinutes(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return formatTime(hours, remainingMinutes);
} 