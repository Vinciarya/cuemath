"use client";

import React, { createContext, useContext, useState } from "react";
import type { PropsWithChildren } from "react";

export type Interviewer = {
  id: number;
  created_at: string;
  agent_id: string | null;
  name: string;
  description: string;
  image: string;
  audio: string | null;
  empathy: number;
  exploration: number;
  rapport: number;
  speed: number;
};

type InterviewerContextType = {
  interviewers: Interviewer[];
  setInterviewers: React.Dispatch<React.SetStateAction<Interviewer[]>>;
  selectedInterviewer: Interviewer | null;
  setSelectedInterviewer: React.Dispatch<React.SetStateAction<Interviewer | null>>;
};

const InterviewerContext = createContext<InterviewerContextType | undefined>(undefined);

export const InterviewerProvider = ({ children }: PropsWithChildren) => {
  const [interviewers, setInterviewers] = useState<Interviewer[]>([]);
  const [selectedInterviewer, setSelectedInterviewer] = useState<Interviewer | null>(null);

  return (
    <InterviewerContext.Provider
      value={{ interviewers, setInterviewers, selectedInterviewer, setSelectedInterviewer }}
    >
      {children}
    </InterviewerContext.Provider>
  );
};

export const useInterviewer = (): InterviewerContextType => {
  const context = useContext(InterviewerContext);
  if (!context) throw new Error("useInterviewer must be used within an InterviewerProvider");
  return context;
};
