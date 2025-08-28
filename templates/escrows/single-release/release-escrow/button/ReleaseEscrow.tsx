import * as React from "react";
import { Button } from "__UI_BASE__/button";
import { useEscrowsMutations } from "@/components/tw-blocks/tanstack/useEscrowsMutations";
import { useWalletContext } from "@/components/tw-blocks/wallet-kit/WalletProvider";
import { SingleReleaseReleaseFundsPayload } from "@trustless-work/escrow/types";
import { toast } from "sonner";
import {
  ErrorResponse,
  handleError,
} from "@/components/tw-blocks/handle-errors/handle";
import { useEscrowContext } from "../../../escrow-context/EscrowProvider";
import { useEscrowDialogs } from "../../../escrow-context/EscrowDialogsProvider";
import { useEscrowAmountContext } from "../../../escrow-context/EscrowAmountProvider";
import { Loader2 } from "lucide-react";

export default function ReleaseEscrowButton() {
  const { releaseFunds } = useEscrowsMutations();
  const { selectedEscrow, updateEscrow } = useEscrowContext();
  const dialogStates = useEscrowDialogs();
  const { setAmounts } = useEscrowAmountContext();
  const { walletAddress } = useWalletContext();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  async function handleClick() {
    try {
      setIsSubmitting(true);

      const payload: SingleReleaseReleaseFundsPayload = {
        contractId: selectedEscrow?.contractId || "",
        releaseSigner: walletAddress || "",
      };

      await releaseFunds.mutateAsync({
        payload,
        type: "single-release",
        address: walletAddress || "",
      });

      toast.success("Escrow released successfully");

      // Ensure amounts are up to date for the success dialog
      if (selectedEscrow) {
        const totalAmount = Number(selectedEscrow.amount || 0);
        const platformFee = Number(selectedEscrow.platformFee || 0);
        setAmounts(totalAmount, platformFee);
      }

      updateEscrow({
        ...selectedEscrow,
        flags: { ...selectedEscrow?.flags, released: true },
        balance: (selectedEscrow?.balance || 0) - (selectedEscrow?.amount || 0),
      });

      // Open success dialog
      dialogStates.successRelease.setIsOpen(true);
    } catch (error) {
      toast.error(handleError(error as ErrorResponse).message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Button
      type="button"
      disabled={isSubmitting}
      onClick={handleClick}
      className="cursor-pointer w-full"
    >
      {isSubmitting ? (
        <div className="flex items-center">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="ml-2">Releasing...</span>
        </div>
      ) : (
        "Release Escrow"
      )}
    </Button>
  );
}
