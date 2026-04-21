"use client";

import React, { createContext, useContext, useState } from "react";
import type { PropsWithChildren } from "react";

export type Interview = {
  id: string;
  created_at: string;
  name: string | null;
  description: string | null;
  objective: string | null;
  organization_id: string | null;
  user_id: string | null;
  interviewer_id: number | null;
  is_active: boolean;
  is_anonymous: boolean;
  is_archived: boolean;
  logo_url: string | null;
  theme_color: string | null;
  url: string | null;
  readable_slug: string | null;
  questions: Record<string, unknown> | null;
  quotes: Record<string, unknown>[] | null;
  insights: string[] | null;
  respondents: string[] | null;
  question_count: number | null;
  response_count: number | null;
  time_duration: string | null;
};

type InterviewContextType = {
  interviews: Interview[];
  setInterviews: React.Dispatch<React.SetStateAction<Interview[]>>;
  selectedInterview: Interview | null;
  setSelectedInterview: React.Dispatch<React.SetStateAction<Interview | null>>;
};

const InterviewContext = createContext<InterviewContextType | undefined>(undefined);

export const InterviewProvider = ({ children }: PropsWithChildren) => {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null);

  return (
    <InterviewContext.Provider
      value={{ interviews, setInterviews, selectedInterview, setSelectedInterview }}
    >
      {children}
    </InterviewContext.Provider>
  );
};

export const useInterview = (): InterviewContextType => {
  const context = useContext(InterviewContext);
  if (!context) throw new Error("useInterview must be used within an InterviewProvider");
  return context;
};
