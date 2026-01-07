import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ScrollToTop } from "@/components/scroll-to-top";

const inter = Inter({ subsets: ["latin"] });

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
            <body className={`${inter.className} bg-[#080A10] text-white`}>
                <ScrollToTop />
                {children}
            </body>
        </html>
    );
}
