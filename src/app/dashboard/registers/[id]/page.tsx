import { RegisterPageClient } from "@/app/dashboard/registers/[id]/client";

export default async function RegisterPage({ params }: { params: { id: string } }) {
    const { id } = await params;
    return <RegisterPageClient id={id} />;
} 