import { z } from "zod";

export class DomainError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export const parse = <T>(schema: z.ZodType<T>, value: unknown): T => {
  const result = schema.safeParse(value);
  if (!result.success)
    throw new DomainError(
      400,
      result.error.issues.map((issue) => issue.message).join("; "),
    );
  return result.data;
};

export const execute = async (
  operation: () => Promise<unknown>,
  status = 200,
) => {
  try {
    return { message: await operation(), status };
  } catch (error) {
    if (error instanceof DomainError)
      return { message: error.message, status: error.status };
    throw error;
  }
};
