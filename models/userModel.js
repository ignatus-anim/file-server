import pool from '../db.js';
import { v4 as uuidv4 } from 'uuid';

export const createUser = async (username,email,hashedPassword) => {
  const result = await pool.query('INSERT INTO users (id, username,email,password) VALUES ($1,$2, $3, $4) RETURNING *', [uuidv4(), username, email, hashedPassword]);
  return result.rows[0];
};

export const findUserByUsername = async (username) => {
  const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
  return result.rows[0];
};

export const findUserByEmail = async (email) => {
  const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  return result.rows[0];
};

export const comparePasswords = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};