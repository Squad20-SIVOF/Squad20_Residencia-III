import type { Request, Response } from "express";

export const idFrom = (req: Request, param = "id"): string => {
  const value = req.params[param];
  return (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
};

type ServiceResult = { message: unknown; status: number };

export const createHandler =
  (
    errorMessage: string,
    options: { noStore?: boolean; logError?: boolean } = {},
  ) =>
  (operation: (req: Request) => Promise<ServiceResult>) =>
  async (req: Request, res: Response) => {
    if (options.noStore) res.setHeader("Cache-Control", "no-store");
    try {
      const { message, status } = await operation(req);
      res.status(status).json({ message });
    } catch (err) {
      if (options.logError !== false) console.error(`${errorMessage}:`, err);
      res.status(500).json({ message: errorMessage });
    }
  };
