import * as React from "react";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "__UI_BASE__/form";
import { Input } from "__UI_BASE__/input";
import { Button } from "__UI_BASE__/button";
import { useFundEscrow } from "./useFundEscrow";

export type FundEscrowProps = {
  className?: string;
  submitLabel?: string;
  onSubmit?: (values: { name: string }) => Promise<void> | void;
  defaultValues?: Partial<{ name: string }>;
};

export function FundEscrow({
  className,
  submitLabel = "Fund escrow",
  onSubmit,
  defaultValues,
}: FundEscrowProps) {
  const { form, handleSubmit, isSubmitting } = useFundEscrow({
    onSubmit,
    defaultValues,
  });

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className={className}>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="mt-4">
          <Button type="submit" disabled={isSubmitting}>
            {submitLabel}
          </Button>
        </div>
      </form>
    </Form>
  );
}

export default FundEscrow;
