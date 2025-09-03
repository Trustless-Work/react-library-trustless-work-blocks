"use client";

import React, { useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "__UI_BASE__/dialog";
import { EntityCard } from "./EntityCard";
import { useEscrowContext } from "@/components/tw-blocks/providers/EscrowProvider";
import { useEscrowAmountContext } from "@/components/tw-blocks/providers/EscrowAmountProvider";
import { CircleCheckBig } from "lucide-react";

interface SuccessReleaseDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SuccessReleaseDialog = ({
  isOpen,
  onOpenChange,
}: SuccessReleaseDialogProps) => {
  const { selectedEscrow } = useEscrowContext();
  const { receiverAmount, platformFeeAmount, trustlessWorkAmount } =
    useEscrowAmountContext();

  const platformFee = Number(selectedEscrow?.platformFee || 0);
  const trustlessPercentage = 0.3;
  const receiverPercentage = 100 - (platformFee + trustlessPercentage);

  const currency = selectedEscrow?.trustline?.name ?? "";

  const cards = useMemo(
    () => [
      {
        type: "Platform",
        entity: selectedEscrow?.roles?.platformAddress,
        percentage: platformFee,
        amount: platformFeeAmount,
      },
      {
        type: "Trustless Work",
        entity: "Private",
        percentage: trustlessPercentage,
        amount: trustlessWorkAmount,
      },
      {
        type: "Receiver",
        entity: selectedEscrow?.roles?.receiver,
        percentage: receiverPercentage,
        amount: receiverAmount,
      },
    ],
    [
      platformFee,
      receiverPercentage,
      trustlessPercentage,
      platformFeeAmount,
      trustlessWorkAmount,
      receiverAmount,
      selectedEscrow?.roles?.platformAddress,
      selectedEscrow?.roles?.receiver,
    ]
  );

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md sm:max-w-lg md:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CircleCheckBig className="h-5 w-5 text-green-600" />
            Release Successful
          </DialogTitle>
          <DialogDescription>
            Funds were distributed successfully to the corresponding parties.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          {cards.map((c) => (
            <EntityCard
              key={c.type}
              type={c.type}
              entity={c.entity}
              hasPercentage
              percentage={Number(c.percentage.toFixed(2))}
              hasAmount
              amount={Number(c.amount.toFixed(2))}
              currency={currency}
            />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};
