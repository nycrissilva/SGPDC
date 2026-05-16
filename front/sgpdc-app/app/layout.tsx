import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

// fonte sans-serif
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

// fonte monoespacada
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// titulo da pagina antigo head
export const metadata: Metadata = {
  title: "Projeto Dança Comunidade | SGPDC",
  description: "Painel administrativo da escola de dança Projeto Dança Comunidade",
};

// obrigatorio para o nextjs, define o layout da aplicacao
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
