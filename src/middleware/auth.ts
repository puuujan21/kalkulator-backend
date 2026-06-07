import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const weryfikujToken = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ blad: 'Brak tokenu' });
  }
  try {
    const dane = jwt.verify(token, process.env.JWT_SECRET || '') as { id: number };
    (req as any).uzytkownikId = dane.id;
    next();
  } catch {
    return res.status(401).json({ blad: 'Nieprawidłowy token' });
  }
};