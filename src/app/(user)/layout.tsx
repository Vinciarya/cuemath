import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Providers from "@/components/providers";
import { Toaster } from "sonner";

import { getBaseUrl } from "@/lib/url";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(getBaseUrl()),
  title: "CueMath AI",
  description: "AI-powered Hiring Interviews by CueMath AI",
  openGraph: {
    title: "CueMath AI",
    description: "AI-powered Interviews",
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
      <div className={inter.className}>{children}</div>
      <Toaster
        toastOptions={{
          classNames: {
            toast: "bg-white border-2 border-indigo-400",
            title: "text-black",
            description: "text-red-400",
            actionButton: "bg-indigo-400",
            cancelButton: "bg-orange-400",
            closeButton: "bg-lime-400",
          },
        }}
      />
    </Providers>
  );
}
