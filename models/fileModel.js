import pool from '../db.js';

export const uploadFile = async (filename, filepath, user_id) => {
  const result = await pool.query('INSERT INTO files (filename, filepath, user_id) VALUES ($1, $2, $3) RETURNING *', [filename, filepath, user_id]);
  return result.rows[0];
};

export const listFiles = async () => {
  const result = await pool.query('SELECT * FROM files');
  return result.rows;
};

export const findFileById = async (id) => {
  const result = await pool.query('SELECT * FROM files WHERE id = $1', [id]);
  return result.rows[0];
};

export const deleteFile = async (id) => {
  await pool.query('DELETE FROM files WHERE id = $1', [id]);
};

export const generateShareableLink = async (id, link) => {
  const result = await pool.query('UPDATE files SET shared_link = $1 WHERE id = $2 RETURNING *', [link, id]);
  return result.rows[0];
};

export const findFileBySharedLink = async (link) => {
  const result = await pool.query('SELECT * FROM files WHERE shared_link = $1', [link]);
  return result.rows[0];
};
