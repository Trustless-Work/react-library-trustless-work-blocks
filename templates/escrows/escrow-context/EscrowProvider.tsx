"use client";

import * as React from "react";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
  useCallback,
} from "react";
import { GetEscrowsFromIndexerResponse as Escrow } from "@trustless-work/escrow/types";

type EscrowContextType = {
  selectedEscrow: Escrow | null;
  hasEscrow: boolean;
  userRolesInEscrow: string[];
  updateEscrow: (
    updater: Partial<Escrow> | ((previous: Escrow) => Escrow)
  ) => void;
  setEscrowField: <K extends keyof Escrow>(key: K, value: Escrow[K]) => void;
  clearEscrow: () => void;
  setSelectedEscrow: (escrow?: Escrow) => void;
  setUserRolesInEscrow: (roles: string[]) => void;
};

const EscrowContext = createContext<EscrowContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = "selectedEscrow";

export const EscrowProvider = ({ children }: { children: ReactNode }) => {
  const [selectedEscrow, setSelectedEscrowState] = useState<Escrow | null>(
    null
  );
  const [userRolesInEscrow, setUserRolesInEscrowState] = useState<string[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const parsed: Escrow = JSON.parse(stored);
        setSelectedEscrowState(parsed);
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

  const updateEscrow: EscrowContextType["updateEscrow"] = (updater) => {
    setSelectedEscrowState((current) => {
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
    setSelectedEscrowState((current) => {
      if (!current) return current;
      const next = { ...current, [key]: value } as Escrow;
      persist(next);
      return next;
    });
  };

  const clearEscrow = () => {
    setSelectedEscrowState(null);
    persist(null);
  };

  const setUserRolesInEscrow = useCallback((roles: string[]) => {
    setUserRolesInEscrowState((prev) => {
      // Avoid unnecessary updates to prevent re-renders
      if (
        prev.length === roles.length &&
        prev.every((r, i) => r === roles[i])
      ) {
        return prev;
      }
      return roles;
    });
  }, []);

  const hasEscrow = useMemo(() => Boolean(selectedEscrow), [selectedEscrow]);

  return (
    <EscrowContext.Provider
      value={{
        selectedEscrow,
        hasEscrow,
        updateEscrow,
        setEscrowField,
        clearEscrow,
        setSelectedEscrow: (value?: Escrow) =>
          setSelectedEscrowState(value ?? null),
        setUserRolesInEscrow,
        userRolesInEscrow,
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
