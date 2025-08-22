import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useUpdateEscrowSchema } from "./schema";
import { z } from "zod";
import {
  UpdateSingleReleaseEscrowPayload,
  UpdateSingleReleaseEscrowResponse,
} from "@trustless-work/escrow/types";
import { toast } from "sonner";
import { useEscrowContext } from "../../../escrow-context/EscrowProvider";
import { useWalletContext } from "@/components/tw-blocks/wallet-kit/WalletProvider";
import { useEscrowsMutations } from "@/components/tw-blocks/tanstak/useEscrowsMutations";
import {
  ErrorResponse,
  handleError,
} from "@/components/tw-blocks/handle-errors/handle";

export function useUpdateEscrow() {
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const { getSingleReleaseFormSchema } = useUpdateEscrowSchema();
  const formSchema = getSingleReleaseFormSchema();

  const { walletAddress } = useWalletContext();
  const { escrow, setEscrow } = useEscrowContext();
  const { updateEscrow } = useEscrowsMutations();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      engagementId: escrow?.engagementId || "",
      title: escrow?.title || "",
      description: escrow?.description || "",
      platformFee: escrow?.platformFee as unknown as
        | number
        | string
        | undefined,
      amount: escrow?.amount as unknown as number | string | undefined,
      receiverMemo: escrow?.receiverMemo ? String(escrow.receiverMemo) : "",
      trustline: {
        address: escrow?.trustlineAddress || "",
        decimals: 10000000,
      },
      roles: {
        approver: escrow?.roles?.approver || "",
        serviceProvider: escrow?.roles?.serviceProvider || "",
        platformAddress: escrow?.roles?.platformAddress || "",
        receiver: escrow?.roles?.receiver || "",
        releaseSigner: escrow?.roles?.releaseSigner || "",
        disputeResolver: escrow?.roles?.disputeResolver || "",
      },
      milestones: (escrow?.milestones || []).map((m: any) => ({
        description: m?.description || "",
      })),
    },
    mode: "onChange",
  });

  React.useEffect(() => {
    if (!escrow) return;
    form.reset({
      engagementId: escrow?.engagementId || "",
      title: escrow?.title || "",
      description: escrow?.description || "",
      platformFee:
        (escrow?.platformFee as unknown as number | string | undefined) || "",
      amount: (escrow?.amount as unknown as number | string | undefined) || "",
      receiverMemo: escrow?.receiverMemo ? String(escrow.receiverMemo) : "",
      trustline: {
        address: escrow?.trustlineAddress || "",
        decimals: 10000000,
      },
      roles: {
        approver: escrow?.roles?.approver || "",
        serviceProvider: escrow?.roles?.serviceProvider || "",
        platformAddress: escrow?.roles?.platformAddress || "",
        receiver: escrow?.roles?.receiver || "",
        releaseSigner: escrow?.roles?.releaseSigner || "",
        disputeResolver: escrow?.roles?.disputeResolver || "",
      },
      milestones: (escrow?.milestones || []).map((m: any) => ({
        description: m?.description || "",
      })),
    });
  }, [escrow, form]);

  const milestones = form.watch("milestones");
  const isAnyMilestoneEmpty = milestones.some((m) => m.description === "");

  const handleAddMilestone = () => {
    const current = form.getValues("milestones");
    const updated = [...current, { description: "" }];
    form.setValue("milestones", updated);
  };

  const handleRemoveMilestone = (index: number) => {
    const current = form.getValues("milestones");
    const updated = current.filter((_, i) => i !== index);
    form.setValue("milestones", updated);
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let rawValue = e.target.value;
    rawValue = rawValue.replace(/[^0-9.]/g, "");
    if (rawValue.split(".").length > 2) rawValue = rawValue.slice(0, -1);
    if (rawValue.includes(".")) {
      const parts = rawValue.split(".");
      if (parts[1] && parts[1].length > 2) {
        rawValue = parts[0] + "." + parts[1].slice(0, 2);
      }
    }
    form.setValue("amount", rawValue);
  };

  const handlePlatformFeeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let rawValue = e.target.value;
    rawValue = rawValue.replace(/[^0-9.]/g, "");
    if (rawValue.split(".").length > 2) rawValue = rawValue.slice(0, -1);
    if (rawValue.includes(".")) {
      const parts = rawValue.split(".");
      if (parts[1] && parts[1].length > 2) {
        rawValue = parts[0] + "." + parts[1].slice(0, 2);
      }
    }
    form.setValue("platformFee", rawValue);
  };

  const handleSubmit = form.handleSubmit(async (payload) => {
    try {
      setIsSubmitting(true);

      const finalPayload: UpdateSingleReleaseEscrowPayload = {
        contractId: escrow?.contractId || "",
        signer: walletAddress || "",
        escrow: {
          engagementId: payload.engagementId,
          title: payload.title,
          description: payload.description,
          platformFee:
            typeof payload.platformFee === "string"
              ? Number(payload.platformFee)
              : payload.platformFee,
          amount:
            typeof payload.amount === "string"
              ? Number(payload.amount)
              : payload.amount,
          receiverMemo: payload.receiverMemo
            ? Number(payload.receiverMemo)
            : undefined,
          trustlineAddress: payload.trustline.address,
          roles: payload.roles as any,
          milestones: payload.milestones,
        },
      };

      (await updateEscrow.mutateAsync({
        payload: finalPayload,
        type: "single-release",
        address: walletAddress || "",
      })) as UpdateSingleReleaseEscrowResponse;

      setEscrow({ ...escrow, ...finalPayload.escrow });
      toast.success("Escrow updated successfully");
    } catch (error) {
      toast.error(handleError(error as ErrorResponse).message);
    } finally {
      setIsSubmitting(false);
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
    handleAmountChange,
    handlePlatformFeeChange,
  };
}
