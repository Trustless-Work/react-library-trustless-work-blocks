import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { resolveDisputeSchema, type ResolveDisputeValues } from "./schema";
import { toast } from "sonner";
import { SingleReleaseResolveDisputePayload } from "@trustless-work/escrow";
import { useEscrowContext } from "../../../escrow-context/EscrowProvider";
import { useEscrowsMutations } from "@/components/tw-blocks/tanstak/useEscrowsMutations";
import {
  ErrorResponse,
  handleError,
} from "@/components/tw-blocks/handle-errors/handle";
import { useWalletContext } from "@/components/tw-blocks/wallet-kit/WalletProvider";

export function useResolveDispute() {
  const { resolveDispute } = useEscrowsMutations();
  const { selectedEscrow } = useEscrowContext();
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

      const finalPayload: SingleReleaseResolveDisputePayload = {
        contractId: selectedEscrow?.contractId || "",
        disputeResolver: walletAddress || "",
        approverFunds: Number(payload.approverFunds),
        receiverFunds: Number(payload.receiverFunds),
      };

      await resolveDispute.mutateAsync({
        payload: finalPayload,
        type: "single-release",
        address: walletAddress || "",
      });

      toast.success("Dispute resolved successfully");
    } catch (error) {
      toast.error(handleError(error as ErrorResponse).message);
    } finally {
      setIsSubmitting(false);
      form.reset();
    }
  });

  return { form, handleSubmit, isSubmitting };
}
