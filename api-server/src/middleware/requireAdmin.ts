import { Request, Response, NextFunction } from "express";
import { checkIfAdmin } from "../utils/auth.js";

export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated() || !req.user) {
    return res.status(401).json({ error: "Unauthenticated" });
  }

  const user = req.user as { email: string };
  const isAdmin = await checkIfAdmin(user.email);

  if (!isAdmin) {
    return res.status(403).json({ error: "Forbidden" });
  }

  next();
}
