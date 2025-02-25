import { RegisterPageClient } from "@/app/dashboard/registers/[id]/client";
import { RegisterProvider } from "@/app/contexts/RegisterContext";

export default async function RegisterPage({ params }: { params: { id: string } }) {
    const { id } = params;
    return (
        <RegisterProvider registerId={id}>
            <RegisterPageClient id={id} />
        </RegisterProvider>
    );
} 