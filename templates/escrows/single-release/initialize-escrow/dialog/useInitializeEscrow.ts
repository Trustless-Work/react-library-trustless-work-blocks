import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useInitializeEscrowSchema } from "./schema";
import { z } from "zod";
import {
  InitializeSingleReleaseEscrowPayload,
  InitializeSingleReleaseEscrowResponse,
} from "@trustless-work/escrow/types";
import { toast } from "sonner";
import { useEscrowContext } from "../../../escrow-context/EscrowProvider";
import { useWalletContext } from "@/components/tw-blocks/wallet-kit/WalletProvider";
import { useEscrowsMutations } from "@/components/tw-blocks/tanstak/useEscrowsMutations";
import {
  ErrorResponse,
  handleError,
} from "@/components/tw-blocks/handle-errors/handle";

export function useInitializeEscrow() {
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const { getSingleReleaseFormSchema } = useInitializeEscrowSchema();
  const formSchema = getSingleReleaseFormSchema();

  const { walletAddress } = useWalletContext();
  const { setEscrow } = useEscrowContext();
  const { deployEscrow } = useEscrowsMutations();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      engagementId: "",
      title: "",
      description: "",
      platformFee: undefined,
      amount: undefined,
      receiverMemo: "",
      trustline: {
        address: "",
        decimals: 10000000,
      },
      roles: {
        approver: "",
        serviceProvider: "",
        platformAddress: "",
        receiver: "",
        releaseSigner: "",
        disputeResolver: "",
      },
      milestones: [{ description: "" }],
    },
    mode: "onChange",
  });

  const milestones = form.watch("milestones");
  const isAnyMilestoneEmpty = milestones.some(
    (milestone) => milestone.description === ""
  );

  const handleAddMilestone = () => {
    const currentMilestones = form.getValues("milestones");
    const updatedMilestones = [...currentMilestones, { description: "" }];
    form.setValue("milestones", updatedMilestones);
  };

  const handleRemoveMilestone = (index: number) => {
    const currentMilestones = form.getValues("milestones");
    const updatedMilestones = currentMilestones.filter((_, i) => i !== index);
    form.setValue("milestones", updatedMilestones);
  };

  const handleSubmit = form.handleSubmit(async (payload) => {
    try {
      setIsSubmitting(true);

      const finalPayload: InitializeSingleReleaseEscrowPayload = {
        ...payload,
        amount:
          typeof payload.amount === "string"
            ? Number(payload.amount)
            : payload.amount,
        platformFee:
          typeof payload.platformFee === "string"
            ? Number(payload.platformFee)
            : payload.platformFee,
        receiverMemo: Number(payload.receiverMemo) ?? 0,
        signer: walletAddress || "",
        milestones: payload.milestones,
      };

      const response: InitializeSingleReleaseEscrowResponse =
        (await deployEscrow.mutateAsync({
          payload: finalPayload,
          type: "single-release",
          address: walletAddress || "",
        })) as InitializeSingleReleaseEscrowResponse;

      setEscrow({ ...response.escrow, contractId: response.contractId });

      console.log("response", response);
      toast.success("Escrow initialized successfully");

      // do something with the response ...
    } catch (error) {
      toast.error(handleError(error as ErrorResponse).message);
    } finally {
      setIsSubmitting(false);
      form.reset();
    }
  });

  return {
    form,
    isSubmitting,
    milestones,
    isAnyMilestoneEmpty,

    handleSubmit,
    handleAddMilestone,
    handleRemoveMilestone,
  };
}
