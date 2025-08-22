"use client";

import * as React from "react";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from "react";
import { GetEscrowsFromIndexerResponse } from "@trustless-work/escrow/types";

type Escrow = {
  [K in keyof Omit<
    GetEscrowsFromIndexerResponse,
    "type" | "updatedAt" | "createdAt" | "user"
  >]: K extends "trustline"
    ? Omit<NonNullable<GetEscrowsFromIndexerResponse["trustline"]>, "name">
    : GetEscrowsFromIndexerResponse[K];
};

type EscrowContextType = {
  escrow: Escrow | null;
  hasEscrow: boolean;
  setEscrow: (escrow: Escrow) => void;
  updateEscrow: (
    updater: Partial<Escrow> | ((previous: Escrow) => Escrow)
  ) => void;
  setEscrowField: <K extends keyof Escrow>(key: K, value: Escrow[K]) => void;
  clearEscrow: () => void;
};

const EscrowContext = createContext<EscrowContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = "selectedEscrow";

export const EscrowProvider = ({ children }: { children: ReactNode }) => {
  const [escrow, setEscrowState] = useState<Escrow | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const parsed: Escrow = JSON.parse(stored);
        setEscrowState(parsed);
      }
    } catch (_err) {
      // ignore malformed localStorage content
    }
  }, []);

  const persist = (value: Escrow | null) => {
    if (value) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(value));
    } else {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
  };

  const setEscrow = (next: Escrow) => {
    setEscrowState(next);
    persist(next);
  };

  const updateEscrow: EscrowContextType["updateEscrow"] = (updater) => {
    setEscrowState((current) => {
      if (!current) return current;
      const next =
        typeof updater === "function"
          ? updater(current)
          : { ...current, ...updater };
      persist(next);
      return next;
    });
  };

  const setEscrowField: EscrowContextType["setEscrowField"] = (key, value) => {
    setEscrowState((current) => {
      if (!current) return current;
      const next = { ...current, [key]: value } as Escrow;
      persist(next);
      return next;
    });
  };

  const clearEscrow = () => {
    setEscrowState(null);
    persist(null);
  };

  const hasEscrow = useMemo(() => Boolean(escrow), [escrow]);

  return (
    <EscrowContext.Provider
      value={{
        escrow,
        hasEscrow,
        setEscrow,
        updateEscrow,
        setEscrowField,
        clearEscrow,
      }}
    >
      {children}
    </EscrowContext.Provider>
  );
};

export const useEscrowContext = () => {
  const context = useContext(EscrowContext);
  if (!context) {
    throw new Error("useEscrowContext must be used within EscrowProvider");
  }
  return context;
};
