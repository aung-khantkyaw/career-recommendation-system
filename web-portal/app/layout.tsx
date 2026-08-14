// For adding custom fonts with other frameworks, see:
// https://tailwindcss.com/docs/font-family
import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { auth } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Career Recommendation System",
  description: "AI-based Student Career Recommendation System",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <html lang="en">
      <body className="antialiased">
         <Providers session={session}>{children}</Providers>
      </body>
    </html>
  );
}
