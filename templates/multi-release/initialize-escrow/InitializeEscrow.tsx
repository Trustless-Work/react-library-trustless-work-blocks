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
import { useInitializeEscrow } from "./useInitializeEscrow";

export type InitializeEscrowProps = {
  className?: string;
  submitLabel?: string;
  onSubmit?: (values: { name: string }) => Promise<void> | void;
  defaultValues?: Partial<{ name: string }>;
};

export function InitializeEscrow({
  className,
  submitLabel = "Initialize escrow",
  onSubmit,
  defaultValues,
}: InitializeEscrowProps) {
  const { form, handleSubmit, isSubmitting } = useInitializeEscrow({
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

export default InitializeEscrow;
