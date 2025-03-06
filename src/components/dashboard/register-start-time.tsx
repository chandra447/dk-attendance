import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { setRegisterStartTime, getRegisterStartTime } from "@/app/actions/register";
import { Clock } from "lucide-react";

interface RegisterStartTimeProps {
    registerId: string;
    date: Date;
    onStartTimeSet: () => void;
}

export function RegisterStartTime({ registerId, date, onStartTimeSet }: RegisterStartTimeProps) {
    const [startTime, setStartTime] = useState<string>("");
    const [isLoading, setIsLoading] = useState(false);
    const [hasStartTime, setHasStartTime] = useState(false);
    const [displayTime, setDisplayTime] = useState<string>("");

    useEffect(() => {
        async function checkStartTime() {
            const result = await getRegisterStartTime(parseInt(registerId), date);
            if ('data' in result && result.data) {
                setHasStartTime(true);
                const time = new Date(result.data.startTime);
                setDisplayTime(format(time, "h:mm a"));
            } else {
                setHasStartTime(false);
                setDisplayTime("");
            }
        }
        checkStartTime();
    }, [registerId, date]);

    const handleSetStartTime = async () => {
        if (!startTime) return;

        setIsLoading(true);
        try {
            const [hours, minutes] = startTime.split(':').map(Number);
            const startDateTime = new Date(date);
            startDateTime.setHours(hours, minutes, 0, 0);

            const result = await setRegisterStartTime(parseInt(registerId), startDateTime);
            if ('data' in result) {
                setHasStartTime(true);
                setDisplayTime(format(startDateTime, "h:mm a"));
                onStartTimeSet();
            }
        } catch (error) {
            console.error('Error setting start time:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex items-center gap-2 w-full">
            <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            {hasStartTime ? (
                <div className="text-sm">
                    Started at <span className="font-medium">{displayTime}</span>
                </div>
            ) : (
                <>
                    <Input
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="flex-1"
                    />
                    <Button
                        size="sm"
                        onClick={handleSetStartTime}
                        disabled={!startTime || isLoading}
                    >
                        {isLoading ? "..." : "Set"}
                    </Button>
                </>
            )}
        </div>
    );
} 