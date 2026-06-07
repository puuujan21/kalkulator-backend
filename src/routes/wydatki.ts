import { Router, Request, Response } from 'express';
import pool from '../db';
import { weryfikujToken } from '../middleware/auth';

const router = Router();

router.get('/', weryfikujToken, async (req: Request, res: Response) => {
  try {
    const wynik = await pool.query(
      'SELECT * FROM wydatki WHERE uzytkownik_id = $1 ORDER BY data DESC',
      [(req as any).uzytkownikId]
    );
    res.json(wynik.rows);
  } catch {
    res.status(500).json({ blad: 'Błąd serwera' });
  }
});

router.post('/', weryfikujToken, async (req: Request, res: Response) => {
  const { nazwa, kwota, kategoria, data } = req.body;
  try {
    const wynik = await pool.query(
      'INSERT INTO wydatki (uzytkownik_id, nazwa, kwota, kategoria, data) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [(req as any).uzytkownikId, nazwa, kwota, kategoria, data]
    );
    res.json(wynik.rows[0]);
  } catch {
    res.status(500).json({ blad: 'Błąd serwera' });
  }
});

router.delete('/:id', weryfikujToken, async (req: Request, res: Response) => {
  try {
    await pool.query(
      'DELETE FROM wydatki WHERE id = $1 AND uzytkownik_id = $2',
      [req.params.id, (req as any).uzytkownikId]
    );
    res.json({ sukces: true });
  } catch {
    res.status(500).json({ blad: 'Błąd serwera' });
  }
});

export default router;