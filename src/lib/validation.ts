import { z } from "zod";

export const credentialsSchema = z.object({
  email: z.string().trim().toLowerCase().email({ message: "invalidEmail" }),
  password: z.string().min(8, { message: "passwordTooShort" }),
});

export const registerSchema = credentialsSchema.extend({
  acceptedTerms: z.literal(true, { message: "termsRequired" }),
});
