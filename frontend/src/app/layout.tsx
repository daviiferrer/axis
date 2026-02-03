import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ScrollToTop } from "@/components/scroll-to-top";
import { AuthProvider } from "@/context/AuthContext";
import { SocketProvider } from "@/context/SocketContext";
import { GlobalAlerts } from "@/components/GlobalAlerts";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const jetbrainsMono = JetBrains_Mono({
    subsets: ["latin"],
    variable: "--font-jetbrains-mono",
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
            <body className={`${inter.className} ${jetbrainsMono.variable} bg-white text-gray-900 antialiased`}>
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
