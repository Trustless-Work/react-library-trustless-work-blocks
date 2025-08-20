import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { initializeEscrowSchema, type InitializeEscrowValues } from "./schema";

export type UseInitializeEscrowOptions = {
  defaultValues?: Partial<InitializeEscrowValues>;
  onSubmit?: (values: InitializeEscrowValues) => Promise<void> | void;
};

export function useInitializeEscrow(options?: UseInitializeEscrowOptions) {
  const form = useForm<InitializeEscrowValues>({
    resolver: zodResolver(initializeEscrowSchema),
    defaultValues: {
      name: "",
      ...(options?.defaultValues || {}),
    },
    mode: "onSubmit",
  });

  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = form.handleSubmit(async (values) => {
    try {
      setIsSubmitting(true);
      console.log("values1", values);
      await options?.onSubmit?.(values);
    } finally {
      setIsSubmitting(false);
    }
  });

  return { form, handleSubmit, isSubmitting };
}
