import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { fundEscrowSchema, type FundEscrowValues } from "./schema";

export type UseFundEscrowOptions = {
  defaultValues?: Partial<FundEscrowValues>;
  onSubmit?: (values: FundEscrowValues) => Promise<void> | void;
};

export function useFundEscrow(options?: UseFundEscrowOptions) {
  const form = useForm<FundEscrowValues>({
    resolver: zodResolver(fundEscrowSchema),
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
      await options?.onSubmit?.(values);
    } finally {
      setIsSubmitting(false);
    }
  });

  return { form, handleSubmit, isSubmitting };
}
