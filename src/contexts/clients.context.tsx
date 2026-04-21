"use client";

import React, { createContext, useContext, useState } from "react";
import type { PropsWithChildren } from "react";

export type Client = {
  id: string;
  created_at: string;
  name: string | null;
  image_url: string | null;
  allowed_responses_count: number | null;
  plan: "free" | "pro" | "free_trial_over" | null;
};

type ClientContextType = {
  client: Client | null;
  setClient: React.Dispatch<React.SetStateAction<Client | null>>;
};

const ClientContext = createContext<ClientContextType | undefined>(undefined);

export const ClientProvider = ({ children }: PropsWithChildren) => {
  const [client, setClient] = useState<Client | null>(null);

  return (
    <ClientContext.Provider value={{ client, setClient }}>
      {children}
    </ClientContext.Provider>
  );
};

export const useClient = (): ClientContextType => {
  const context = useContext(ClientContext);
  if (!context) throw new Error("useClient must be used within a ClientProvider");
  return context;
};
