import { Router, Request, Response } from 'express';
import pool from '../db';
import { weryfikujToken } from '../middleware/auth';

const router = Router();

router.get('/', weryfikujToken, async (req: Request, res: Response) => {
  try {
    const wynik = await pool.query(
      'SELECT id, email, imie, dochod_netto, stale_wydatki, onboarding_done FROM uzytkownicy WHERE id = $1',
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
    const current = await pool.query(
      'SELECT dochod_netto, stale_wydatki FROM uzytkownicy WHERE id = $1',
      [(req as any).uzytkownikId]
    );
    const noweDochody = dochod_netto !== undefined ? dochod_netto : current.rows[0].dochod_netto;
    const noweWydatki = stale_wydatki !== undefined ? stale_wydatki : current.rows[0].stale_wydatki;
    const wynik = await pool.query(
      'UPDATE uzytkownicy SET dochod_netto = $1, stale_wydatki = $2 WHERE id = $3 RETURNING id, email, imie, dochod_netto, stale_wydatki',
      [noweDochody, noweWydatki, (req as any).uzytkownikId]
    );
    res.json(wynik.rows[0]);
  } catch {
    res.status(500).json({ blad: 'Błąd serwera' });
  }
});
router.post('/onboarding', weryfikujToken, async (req: Request, res: Response) => {
  const { dochod_netto, stale_wydatki, cel_nazwa, cel_kwota } = req.body;
  try {
    await pool.query(
      'UPDATE uzytkownicy SET dochod_netto = $1, stale_wydatki = $2, onboarding_done = TRUE WHERE id = $3',
      [dochod_netto || 0, stale_wydatki || 0, (req as any).uzytkownikId]
    );
    if (cel_nazwa && cel_kwota) {
      await pool.query(
        'INSERT INTO cele (uzytkownik_id, nazwa, docelowa) VALUES ($1, $2, $3)',
        [(req as any).uzytkownikId, cel_nazwa, cel_kwota]
      );
    }
    res.json({ sukces: true });
  } catch {
    res.status(500).json({ blad: 'Błąd serwera' });
  }
});

export default router;