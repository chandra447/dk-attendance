import { differenceInHours, differenceInMinutes } from "date-fns";

export function formatDuration(clockIn: Date | null, clockOut: Date | null): string {
    if (!clockIn || !clockOut) return "00:00";

    const clockInTime = new Date(clockIn);
    const clockOutTime = new Date(clockOut);

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