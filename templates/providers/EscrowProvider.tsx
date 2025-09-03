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
import {
  GetEscrowsFromIndexerResponse as Escrow,
  Trustline,
} from "@trustless-work/escrow/types";

type RelaxedEscrow = Omit<
  Escrow,
  "type" | "updatedAt" | "createdAt" | "user" | "trustline" | "amount"
> &
  Partial<
    Pick<Escrow, "type" | "updatedAt" | "createdAt" | "user" | "amount">
  > & {
    trustline: Trustline & { name?: string };
  };

type EscrowContextType = {
  selectedEscrow: RelaxedEscrow | null;
  hasEscrow: boolean;
  userRolesInEscrow: string[];
  updateEscrow: (
    updater:
      | Partial<RelaxedEscrow>
      | ((previous: RelaxedEscrow) => RelaxedEscrow)
  ) => void;
  setEscrowField: <K extends keyof RelaxedEscrow>(
    key: K,
    value: RelaxedEscrow[K]
  ) => void;
  clearEscrow: () => void;
  setSelectedEscrow: (escrow?: RelaxedEscrow) => void;
  setUserRolesInEscrow: (roles: string[]) => void;
};

const EscrowContext = createContext<EscrowContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = "selectedEscrow";

export const EscrowProvider = ({ children }: { children: ReactNode }) => {
  const [selectedEscrow, setSelectedEscrowState] =
    useState<RelaxedEscrow | null>(null);
  const [userRolesInEscrow, setUserRolesInEscrowState] = useState<string[]>([]);

  /**
   * Get the selected escrow from the local storage
   */
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const parsed: RelaxedEscrow = JSON.parse(stored);
        setSelectedEscrowState(parsed);
      }
    } catch (_err) {
      // ignore malformed localStorage content
    }
  }, []);

  /**
   * Persist the selected escrow to the local storage
   *
   * @param value - The escrow to persist
   */
  const persist = (value: RelaxedEscrow | null) => {
    if (value) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(value));
    } else {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
  };

  /**
   * Update the selected escrow
   *
   * @param updater - The updater function
   */
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

  /**
   * Set a field of the selected escrow
   *
   * @param key - The key of the field to set
   * @param value - The value to set
   */
  const setEscrowField: EscrowContextType["setEscrowField"] = (key, value) => {
    setSelectedEscrowState((current) => {
      if (!current) return current;
      const next = { ...current, [key]: value } as RelaxedEscrow;
      persist(next);
      return next;
    });
  };

  /**
   * Clear the selected escrow
   */
  const clearEscrow = () => {
    setSelectedEscrowState(null);
    persist(null);
  };

  /**
   * Set the user roles in the escrow
   *
   * @param roles - The roles to set
   */
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

  /**
   * Check if the user has an escrow
   */
  const hasEscrow = useMemo(() => Boolean(selectedEscrow), [selectedEscrow]);

  return (
    <EscrowContext.Provider
      value={{
        selectedEscrow,
        hasEscrow,
        updateEscrow,
        setEscrowField,
        clearEscrow,
        setSelectedEscrow: (value?: RelaxedEscrow) =>
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
