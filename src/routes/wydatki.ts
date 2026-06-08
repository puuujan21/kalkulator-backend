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
  const { nazwa, kwota, kategoria, data, staly } = req.body;
  try {
    const wynik = await pool.query(
  'INSERT INTO wydatki (uzytkownik_id, nazwa, kwota, kategoria, data, staly) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
  [(req as any).uzytkownikId, nazwa, kwota, kategoria, data, staly || false]
);
    res.json(wynik.rows[0]);
    if (staly) {
  await pool.query(
    'UPDATE uzytkownicy SET stale_wydatki = stale_wydatki + $1 WHERE id = $2',
    [kwota, (req as any).uzytkownikId]
  );
}
  } catch {
    res.status(500).json({ blad: 'Błąd serwera' });
  }
});

router.delete('/:id', weryfikujToken, async (req: Request, res: Response) => {
  try {
    const wydatek = await pool.query(
      'SELECT * FROM wydatki WHERE id = $1 AND uzytkownik_id = $2',
      [req.params.id, (req as any).uzytkownikId]
    );
    if (wydatek.rows.length > 0 && wydatek.rows[0].staly) {
      await pool.query(
        'UPDATE uzytkownicy SET stale_wydatki = GREATEST(stale_wydatki - $1, 0) WHERE id = $2',
        [wydatek.rows[0].kwota, (req as any).uzytkownikId]
      );
    }
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