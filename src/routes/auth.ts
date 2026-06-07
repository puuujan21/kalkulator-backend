import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../db';

const router = Router();

router.post('/rejestracja', async (req: Request, res: Response) => {
  const { email, haslo, imie } = req.body;
  try {
    const istnieje = await pool.query('SELECT id FROM uzytkownicy WHERE email = $1', [email]);
    if (istnieje.rows.length > 0) {
      return res.status(400).json({ blad: 'Użytkownik z tym emailem już istnieje' });
    }
    const hash = await bcrypt.hash(haslo, 10);
    const wynik = await pool.query(
      'INSERT INTO uzytkownicy (email, haslo, imie) VALUES ($1, $2, $3) RETURNING id, email, imie',
      [email, hash, imie]
    );
    const uzytkownik = wynik.rows[0];
    const token = jwt.sign({ id: uzytkownik.id }, process.env.JWT_SECRET || '', { expiresIn: '7d' });
    res.json({ token, uzytkownik });
  } catch (err) {
    res.status(500).json({ blad: 'Błąd serwera' });
  }
});

router.post('/logowanie', async (req: Request, res: Response) => {
  const { email, haslo } = req.body;
  try {
    const wynik = await pool.query('SELECT * FROM uzytkownicy WHERE email = $1', [email]);
    if (wynik.rows.length === 0) {
      return res.status(400).json({ blad: 'Nieprawidłowy email lub hasło' });
    }
    const uzytkownik = wynik.rows[0];
    const poprawne = await bcrypt.compare(haslo, uzytkownik.haslo);
    if (!poprawne) {
      return res.status(400).json({ blad: 'Nieprawidłowy email lub hasło' });
    }
    const token = jwt.sign({ id: uzytkownik.id }, process.env.JWT_SECRET || '', { expiresIn: '7d' });
    res.json({ token, uzytkownik: { id: uzytkownik.id, email: uzytkownik.email, imie: uzytkownik.imie } });
  } catch (err) {
    res.status(500).json({ blad: 'Błąd serwera' });
  }
});

export default router;