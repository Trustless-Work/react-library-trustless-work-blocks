import { z } from "zod";

export const initializeEscrowSchema = z.object({
  name: z.string().min(1, "Name is required"),
});

export type InitializeEscrowValues = z.infer<typeof initializeEscrowSchema>;
