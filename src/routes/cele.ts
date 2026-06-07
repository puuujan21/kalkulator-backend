import { Router, Request, Response } from 'express';
import pool from '../db';
import { weryfikujToken } from '../middleware/auth';

const router = Router();

router.get('/', weryfikujToken, async (req: Request, res: Response) => {
  try {
    const wynik = await pool.query(
      'SELECT * FROM cele WHERE uzytkownik_id = $1 ORDER BY created_at DESC',
      [(req as any).uzytkownikId]
    );
    res.json(wynik.rows);
  } catch {
    res.status(500).json({ blad: 'Błąd serwera' });
  }
});

router.post('/', weryfikujToken, async (req: Request, res: Response) => {
  const { nazwa, docelowa } = req.body;
  try {
    const wynik = await pool.query(
      'INSERT INTO cele (uzytkownik_id, nazwa, docelowa) VALUES ($1, $2, $3) RETURNING *',
      [(req as any).uzytkownikId, nazwa, docelowa]
    );
    res.json(wynik.rows[0]);
  } catch {
    res.status(500).json({ blad: 'Błąd serwera' });
  }
});

router.patch('/:id/wplata', weryfikujToken, async (req: Request, res: Response) => {
  const { kwota } = req.body;
  try {
    const wynik = await pool.query(
      'UPDATE cele SET aktualna = LEAST(aktualna + $1, docelowa) WHERE id = $2 AND uzytkownik_id = $3 RETURNING *',
      [kwota, req.params.id, (req as any).uzytkownikId]
    );
    res.json(wynik.rows[0]);
  } catch {
    res.status(500).json({ blad: 'Błąd serwera' });
  }
});

router.delete('/:id', weryfikujToken, async (req: Request, res: Response) => {
  try {
    await pool.query(
      'DELETE FROM cele WHERE id = $1 AND uzytkownik_id = $2',
      [req.params.id, (req as any).uzytkownikId]
    );
    res.json({ sukces: true });
  } catch {
    res.status(500).json({ blad: 'Błąd serwera' });
  }
});

export default router;