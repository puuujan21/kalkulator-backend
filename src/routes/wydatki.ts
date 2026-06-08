import { Router, Request, Response } from 'express';
import pool from '../db';
import { weryfikujToken } from '../middleware/auth';

const router = Router();

router.get('/analiza', weryfikujToken, async (req: Request, res: Response) => {
  try {
    const { miesiac, rok } = req.query;
    const uid = (req as any).uzytkownikId;
    const params: any[] = [uid];
    let where = 'WHERE uzytkownik_id = $1';

    if (rok && miesiac) {
      where += ` AND EXTRACT(YEAR FROM data) = $2 AND EXTRACT(MONTH FROM data) = $3`;
      params.push(Number(rok), Number(miesiac));
    } else if (rok) {
      where += ` AND EXTRACT(YEAR FROM data) = $2`;
      params.push(Number(rok));
    }

    const [katWynik, miesWynik] = await Promise.all([
      pool.query(
        `SELECT kategoria, SUM(kwota)::numeric AS suma
         FROM wydatki ${where}
         GROUP BY kategoria ORDER BY suma DESC`,
        params
      ),
      pool.query(
        `SELECT TO_CHAR(data, 'YYYY-MM') AS miesiac, SUM(kwota)::numeric AS suma
         FROM wydatki WHERE uzytkownik_id = $1
         AND data >= CURRENT_DATE - INTERVAL '12 months'
         GROUP BY TO_CHAR(data, 'YYYY-MM')
         ORDER BY miesiac ASC`,
        [uid]
      ),
    ]);

    res.json({ kategorie: katWynik.rows, miesieczne: miesWynik.rows });
  } catch {
    res.status(500).json({ blad: 'Błąd serwera' });
  }
});

router.get('/', weryfikujToken, async (req: Request, res: Response) => {
  try {
    const { miesiac, rok } = req.query;
    const uid = (req as any).uzytkownikId;
    const params: any[] = [uid];
    let where = 'WHERE uzytkownik_id = $1';

    if (rok && miesiac) {
      where += ` AND EXTRACT(YEAR FROM data) = $2 AND EXTRACT(MONTH FROM data) = $3`;
      params.push(Number(rok), Number(miesiac));
    } else if (rok) {
      where += ` AND EXTRACT(YEAR FROM data) = $2`;
      params.push(Number(rok));
    }

    const wynik = await pool.query(
      `SELECT * FROM wydatki ${where} ORDER BY data DESC`,
      params
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