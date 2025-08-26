import * as React from "react";
import { Button } from "__UI_BASE__/button";
import { useEscrowsMutations } from "@/components/tw-blocks/tanstak/useEscrowsMutations";
import { useWalletContext } from "@/components/tw-blocks/wallet-kit/WalletProvider";
import { ChangeMilestoneStatusPayload } from "@trustless-work/escrow/types";
import { toast } from "sonner";
import {
  ErrorResponse,
  handleError,
} from "@/components/tw-blocks/handle-errors/handle";
import { useEscrowContext } from "../../../escrow-context/EscrowProvider";
import { Loader2 } from "lucide-react";

type ChangeMilestoneStatusButtonProps = {
  status: string;
  evidence?: string;
  milestoneIndex: number | string;
};

export default function ChangeMilestoneStatusButton({
  status,
  evidence,
  milestoneIndex,
}: ChangeMilestoneStatusButtonProps) {
  const { changeMilestoneStatus } = useEscrowsMutations();
  const { selectedEscrow } = useEscrowContext();
  const { walletAddress } = useWalletContext();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  async function handleClick() {
    try {
      if (!status || status.trim().length === 0) {
        toast.error("Status is required");
        return;
      }

      setIsSubmitting(true);

      const payload: ChangeMilestoneStatusPayload = {
        contractId: selectedEscrow?.contractId || "",
        milestoneIndex: String(milestoneIndex),
        newStatus: status,
        newEvidence: evidence || undefined,
        serviceProvider: walletAddress || "",
      };

      await changeMilestoneStatus.mutateAsync({
        payload,
        type: "single-release",
        address: walletAddress || "",
      });

      toast.success("Milestone status updated successfully");
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
          <span className="ml-2">Updating...</span>
        </div>
      ) : (
        "Update Status"
      )}
    </Button>
  );
}
