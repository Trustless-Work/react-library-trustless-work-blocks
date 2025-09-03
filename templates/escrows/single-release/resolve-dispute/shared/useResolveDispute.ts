import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { resolveDisputeSchema, type ResolveDisputeValues } from "./schema";
import { toast } from "sonner";
import { SingleReleaseResolveDisputePayload } from "@trustless-work/escrow";
import { useEscrowContext } from "@/components/tw-blocks/providers/EscrowProvider";
import { useEscrowsMutations } from "@/components/tw-blocks/tanstack/useEscrowsMutations";
import {
  ErrorResponse,
  handleError,
} from "@/components/tw-blocks/handle-errors/handle";
import { useWalletContext } from "@/components/tw-blocks/wallet-kit/WalletProvider";

export function useResolveDispute() {
  const { resolveDispute } = useEscrowsMutations();
  const { selectedEscrow, updateEscrow } = useEscrowContext();
  const { walletAddress } = useWalletContext();

  const form = useForm<ResolveDisputeValues>({
    resolver: zodResolver(resolveDisputeSchema),
    defaultValues: {
      approverFunds: 0,
      receiverFunds: 0,
    },
    mode: "onChange",
  });

  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = form.handleSubmit(async (payload) => {
    try {
      setIsSubmitting(true);

      /**
       * Create the final payload for the resolve dispute mutation
       *
       * @param payload - The payload from the form
       * @returns The final payload for the resolve dispute mutation
       */
      const finalPayload: SingleReleaseResolveDisputePayload = {
        contractId: selectedEscrow?.contractId || "",
        disputeResolver: walletAddress || "",
        approverFunds: Number(payload.approverFunds),
        receiverFunds: Number(payload.receiverFunds),
      };

      /**
       * Call the resolve dispute mutation
       *
       * @param payload - The final payload for the resolve dispute mutation
       * @param type - The type of the escrow
       * @param address - The address of the escrow
       */
      await resolveDispute.mutateAsync({
        payload: finalPayload,
        type: "single-release",
        address: walletAddress || "",
      });

      toast.success("Dispute resolved successfully");

      updateEscrow({
        ...selectedEscrow,
        flags: {
          ...selectedEscrow?.flags,
          disputed: false,
          resolved: true,
        },
        balance:
          (selectedEscrow?.balance || 0) -
            (Number(payload.approverFunds) + Number(payload.receiverFunds)) ||
          0,
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
