import { SidebarNav } from "@/components/dashboard/sidebar-nav";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <SidebarProvider
            style={{
                "--sidebar-width": "280px",
            } as React.CSSProperties}
        >
            <SidebarNav />
            <main className="flex-1">
                <header className="flex h-14 items-center justify-between border-b px-4">
                    <div className="flex items-center gap-2">
                        <SidebarTrigger />
                        <Separator orientation="vertical" className="h-4" />
                    </div>
                    <Link href="/handler/signout">
                        <Button variant="outline" size="sm">
                            Sign Out
                        </Button>
                    </Link>
                </header>
                <div className="p-2">
                    {children}
                </div>
            </main>
        </SidebarProvider>
    );
} 