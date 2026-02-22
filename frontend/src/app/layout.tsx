import type { Metadata } from "next";
import { Space_Grotesk, DM_Sans } from "next/font/google";
import "./globals.css";
import { ScrollToTop } from "@/components/scroll-to-top";
import { AuthProvider } from "@/context/AuthContext";
import { SocketProvider } from "@/context/SocketContext";
import { GlobalAlerts } from "@/components/GlobalAlerts";
import { Toaster } from "sonner";

const spaceGrotesk = Space_Grotesk({
    subsets: ["latin"],
    variable: "--font-space-grotesk",
    weight: ["500", "700"],
    preload: false,
    display: 'swap',
});
const dmSans = DM_Sans({
    subsets: ["latin"],
    variable: "--font-dm-sans",
    weight: ["300", "400", "500", "700"],
    preload: false,
    display: 'swap',
});

export const metadata: Metadata = {
    title: "AXIS",
    description: "Qualifique leads e feche vendas no WhatsApp 24/7",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="pt-BR">
            <body className={`${spaceGrotesk.variable} ${dmSans.variable} bg-white text-gray-900 antialiased`}>
                <AuthProvider>
                    <SocketProvider>
                        <ScrollToTop />
                        <GlobalAlerts />
                        <Toaster position="top-right" theme="dark" richColors />
                        {children}
                    </SocketProvider>
                </AuthProvider>
            </body>
        </html>
    );
}
