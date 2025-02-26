import { RegisterPageClient } from "@/app/dashboard/registers/[id]/client";
import { RegisterProvider } from "@/app/contexts/RegisterContext";

export default async function RegisterPage({ params }: { params: { id: string } }) {
    // Await the params object before destructuring
    const resolvedParams = await Promise.resolve(params);
    const { id } = resolvedParams;

    return (
        <RegisterProvider registerId={id}>
            <RegisterPageClient id={id} />
        </RegisterProvider>
    );
} 