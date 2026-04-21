"use client";

import Navbar from "@/components/navbar";
import Providers from "@/components/providers";
import SideMenu from "@/components/sideMenu";
import { cn } from "@/lib/utils";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

const metadata = {
  title: "CueMath AI",
  description: "AI-powered Hiring Interviews by CueMath AI",
  openGraph: {
    title: "CueMath AI",
    description: "AI-powered Hiring Interviews by CueMath AI",
    siteName: "CueMath AI",
    images: [
      {
        url: "/cuematch.png",
        width: 800,
        height: 600,
      },
    ],
    locale: "en_US",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Providers>
      <div className={cn(inter.className, "min-h-screen bg-transparent antialiased")}>
        <Navbar />
        <div className="flex min-h-screen">
          <SideMenu />
          <div className="ml-[280px] w-full pt-20">
            <main className="min-h-[calc(100vh-5rem)] px-6 py-8 lg:px-10">{children}</main>
          </div>
        </div>
        <Toaster
          toastOptions={{
            classNames: {
              toast: "bg-white",
              title: "text-black",
              description: "text-red-400",
              actionButton: "bg-indigo-400",
              cancelButton: "bg-orange-400",
              closeButton: "bg-white-400",
            },
          }}
        />
      </div>
    </Providers>
  );
}
