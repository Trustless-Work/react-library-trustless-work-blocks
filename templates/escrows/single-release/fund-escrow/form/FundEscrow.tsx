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
import { Loader2 } from "lucide-react";

export default function FundEscrow() {
  const { form, handleSubmit, isSubmitting } = useFundEscrow();

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit}>
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Amount</FormLabel>
              <FormControl>
                <Input type="number" placeholder="Enter amount" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="mt-4">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="cursor-pointer"
          >
            {isSubmitting ? (
              <div className="flex items-center">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="ml-2">Funding...</span>
              </div>
            ) : (
              "Fund"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
