import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  changeMilestoneStatusSchema,
  type ChangeMilestoneStatusValues,
} from "./schema";
import { toast } from "sonner";
import { ChangeMilestoneStatusPayload } from "@trustless-work/escrow";
import { useEscrowContext } from "../../../escrow-context/EscrowProvider";
import { useEscrowsMutations } from "@/components/tw-blocks/tanstak/useEscrowsMutations";
import {
  ErrorResponse,
  handleError,
} from "@/components/tw-blocks/handle-errors/handle";
import { useWalletContext } from "@/components/tw-blocks/wallet-kit/WalletProvider";

export function useChangeMilestoneStatus() {
  const { changeMilestoneStatus } = useEscrowsMutations();
  const { selectedEscrow, updateEscrow } = useEscrowContext();
  const { walletAddress } = useWalletContext();

  const form = useForm<ChangeMilestoneStatusValues>({
    resolver: zodResolver(changeMilestoneStatusSchema),
    defaultValues: {
      milestoneIndex: "0",
      status: "",
      evidence: "",
    },
    mode: "onChange",
  });

  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = form.handleSubmit(async (payload) => {
    try {
      setIsSubmitting(true);

      const finalPayload: ChangeMilestoneStatusPayload = {
        contractId: selectedEscrow?.contractId || "",
        milestoneIndex: payload.milestoneIndex,
        newStatus: payload.status,
        newEvidence: payload.evidence || undefined,
        serviceProvider: walletAddress || "",
      };

      await changeMilestoneStatus.mutateAsync({
        payload: finalPayload,
        type: "single-release",
        address: walletAddress || "",
      });

      toast.success("Milestone status updated successfully");

      updateEscrow({
        ...selectedEscrow,
        milestones: selectedEscrow?.milestones.map((milestone, index) => {
          if (index === Number(payload.milestoneIndex)) {
            return {
              ...milestone,
              status: payload.status,
              evidence: payload.evidence || undefined,
            };
          }
          return milestone;
        }),
      });
    } catch (error) {
      toast.error(handleError(error as ErrorResponse).message);
    } finally {
      setIsSubmitting(false);
      form.reset();
    }
  });

  return { form, handleSubmit, isSubmitting };
}
