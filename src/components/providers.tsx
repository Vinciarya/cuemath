"use client";

import { ClientProvider } from "@/contexts/clients.context";
import { InterviewerProvider } from "@/contexts/interviewers.context";
import { InterviewProvider } from "@/contexts/interviews.context";
import { ResponseProvider } from "@/contexts/responses.context";
import compose from "@/lib/compose";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { PropsWithChildren } from "react";
import React from "react";

const queryClient = new QueryClient();

const Providers = ({ children }: PropsWithChildren) => {
  const Provider = compose([
    InterviewProvider,
    InterviewerProvider,
    ResponseProvider,
    ClientProvider,
  ]);

  return (
    <NextThemesProvider attribute="class" defaultTheme="light">
      <QueryClientProvider client={queryClient}>
        <Provider>{children}</Provider>
      </QueryClientProvider>
    </NextThemesProvider>
  );
};

export default Providers;
