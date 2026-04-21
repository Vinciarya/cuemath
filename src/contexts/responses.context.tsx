"use client";

import React, { createContext, useContext, useState } from "react";
import type { PropsWithChildren } from "react";

export type Response = {
  id: number;
  created_at: string;
  interview_id: string | null;
  name: string | null;
  email: string | null;
  call_id: string | null;
  candidate_status: string | null;
  duration: number | null;
  details: Record<string, unknown> | null;
  analytics: Record<string, unknown> | null;
  is_analysed: boolean;
  is_ended: boolean;
  is_viewed: boolean;
  tab_switch_count: number | null;
};

type ResponseContextType = {
  responses: Response[];
  setResponses: React.Dispatch<React.SetStateAction<Response[]>>;
  selectedResponse: Response | null;
  setSelectedResponse: React.Dispatch<React.SetStateAction<Response | null>>;
};

const ResponseContext = createContext<ResponseContextType | undefined>(undefined);

export const ResponseProvider = ({ children }: PropsWithChildren) => {
  const [responses, setResponses] = useState<Response[]>([]);
  const [selectedResponse, setSelectedResponse] = useState<Response | null>(null);

  return (
    <ResponseContext.Provider
      value={{ responses, setResponses, selectedResponse, setSelectedResponse }}
    >
      {children}
    </ResponseContext.Provider>
  );
};

export const useResponse = (): ResponseContextType => {
  const context = useContext(ResponseContext);
  if (!context) throw new Error("useResponse must be used within a ResponseProvider");
  return context;
};
