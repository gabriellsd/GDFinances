import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Informe um e-mail válido"),
  password: z.string().min(6, "A senha precisa ter pelo menos 6 caracteres"),
});

export const registerSchema = z.object({
  fullName: z.string().min(2, "Informe seu nome"),
  email: z.string().email("Informe um e-mail válido"),
  password: z
    .string()
    .min(6, "A senha precisa ter pelo menos 6 caracteres")
    .max(72, "Senha muito longa"),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
