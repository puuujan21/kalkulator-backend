import { Router, Request, Response } from 'express';
import pool from '../db';
import { weryfikujToken } from '../middleware/auth';

const router = Router();

router.get('/', weryfikujToken, async (req: Request, res: Response) => {
  try {
    const wynik = await pool.query(
      'SELECT id, email, imie, dochod_netto, stale_wydatki FROM uzytkownicy WHERE id = $1',
      [(req as any).uzytkownikId]
    );
    res.json(wynik.rows[0]);
  } catch {
    res.status(500).json({ blad: 'Błąd serwera' });
  }
});

router.patch('/', weryfikujToken, async (req: Request, res: Response) => {
  const { dochod_netto, stale_wydatki } = req.body;
  try {
    const wynik = await pool.query(
      'UPDATE uzytkownicy SET dochod_netto = $1, stale_wydatki = $2 WHERE id = $3 RETURNING id, email, imie, dochod_netto, stale_wydatki',
      [dochod_netto, stale_wydatki, (req as any).uzytkownikId]
    );
    res.json(wynik.rows[0]);
  } catch {
    res.status(500).json({ blad: 'Błąd serwera' });
  }
});

export default router;