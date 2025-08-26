"use client";

import * as React from "react";
import { createContext, useContext, useMemo, useState } from "react";

export type DialogState = {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
};

export type DialogStates = {
  second: DialogState;
  completeMilestone: DialogState;
  qr: DialogState;
  resolveDispute: DialogState;
  editMilestone: DialogState;
  editEntities: DialogState;
  editBasicProperties: DialogState;
  successRelease: DialogState;
  successResolveDispute: DialogState;
};

export type StatusStates = {};

type EscrowDialogsContextType = DialogStates & StatusStates;

const EscrowDialogsContext = createContext<
  EscrowDialogsContextType | undefined
>(undefined);

export function EscrowDialogsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [secondOpen, setSecondOpen] = useState(false);
  const [completeMilestoneOpen, setCompleteMilestoneOpen] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [resolveDisputeOpen, setResolveDisputeOpen] = useState(false);
  const [editMilestoneOpen, setEditMilestoneOpen] = useState(false);
  const [editEntitiesOpen, setEditEntitiesOpen] = useState(false);
  const [editBasicPropertiesOpen, setEditBasicPropertiesOpen] = useState(false);
  const [successReleaseOpen, setSuccessReleaseOpen] = useState(false);
  const [successResolveDisputeOpen, setSuccessResolveDisputeOpen] =
    useState(false);

  const value = useMemo<EscrowDialogsContextType>(
    () => ({
      second: { isOpen: secondOpen, setIsOpen: setSecondOpen },
      completeMilestone: {
        isOpen: completeMilestoneOpen,
        setIsOpen: setCompleteMilestoneOpen,
      },
      qr: { isOpen: qrOpen, setIsOpen: setQrOpen },
      resolveDispute: {
        isOpen: resolveDisputeOpen,
        setIsOpen: setResolveDisputeOpen,
      },
      editMilestone: {
        isOpen: editMilestoneOpen,
        setIsOpen: setEditMilestoneOpen,
      },
      editEntities: {
        isOpen: editEntitiesOpen,
        setIsOpen: setEditEntitiesOpen,
      },
      editBasicProperties: {
        isOpen: editBasicPropertiesOpen,
        setIsOpen: setEditBasicPropertiesOpen,
      },
      successRelease: {
        isOpen: successReleaseOpen,
        setIsOpen: setSuccessReleaseOpen,
      },
      successResolveDispute: {
        isOpen: successResolveDisputeOpen,
        setIsOpen: setSuccessResolveDisputeOpen,
      },
    }),
    [
      secondOpen,
      completeMilestoneOpen,
      qrOpen,
      resolveDisputeOpen,
      editMilestoneOpen,
      editEntitiesOpen,
      editBasicPropertiesOpen,
      successReleaseOpen,
      successResolveDisputeOpen,
    ]
  );

  return (
    <EscrowDialogsContext.Provider value={value}>
      {children}
    </EscrowDialogsContext.Provider>
  );
}

export function useEscrowDialogs() {
  const ctx = useContext(EscrowDialogsContext);
  if (!ctx) {
    throw new Error(
      "useEscrowDialogs must be used within EscrowDialogsProvider"
    );
  }
  return ctx;
}
