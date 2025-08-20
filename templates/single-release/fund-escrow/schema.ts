import { z } from "zod";

export const fundEscrowSchema = z.object({
  name: z.string().min(1, "Name is required"),
});

export type FundEscrowValues = z.infer<typeof fundEscrowSchema>;
