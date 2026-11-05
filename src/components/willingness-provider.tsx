"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

import {
  countOnBlur,
  countOnChange,
  initialCount,
  type ArgumentChoice,
  type CountState,
} from "@/lib/subjective";
import {
  initialWillingness,
  willingnessFromSlider,
  willingnessOnBlur,
  willingnessOnChange,
  type WillingnessState,
} from "@/lib/willingness";

type WillingnessContextValue = {
  state: WillingnessState;
  setFromSlider: (value: number) => void;
  setText: (text: string) => void;
  commitText: () => void;
  argument: ArgumentChoice;
  setArgument: (choice: ArgumentChoice) => void;
  projects: CountState;
  setProjectsText: (text: string) => void;
  commitProjects: () => void;
  bugs: CountState;
  setBugsText: (text: string) => void;
  commitBugs: () => void;
};

const WillingnessContext = createContext<WillingnessContextValue | null>(null);

export function WillingnessProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(initialWillingness);
  const [argument, setArgument] = useState<ArgumentChoice>("nao");
  const [projects, setProjects] = useState(initialCount);
  const [bugs, setBugs] = useState(initialCount);

  const value = useMemo<WillingnessContextValue>(
    () => ({
      state,
      setFromSlider: (next) => setState(willingnessFromSlider(next)),
      setText: (text) => setState((current) => willingnessOnChange(text, current)),
      commitText: () => setState((current) => willingnessOnBlur(current)),
      argument,
      setArgument,
      projects,
      setProjectsText: (text) => setProjects((current) => countOnChange(text, current)),
      commitProjects: () => setProjects((current) => countOnBlur(current)),
      bugs,
      setBugsText: (text) => setBugs((current) => countOnChange(text, current)),
      commitBugs: () => setBugs((current) => countOnBlur(current)),
    }),
    [argument, bugs, projects, state],
  );

  return <WillingnessContext.Provider value={value}>{children}</WillingnessContext.Provider>;
}

export function useWillingness(): WillingnessContextValue {
  const value = useContext(WillingnessContext);
  if (!value) {
    throw new Error("useWillingness precisa do WillingnessProvider");
  }
  return value;
}
