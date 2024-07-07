import { query } from 'express';
import pool from '../db.js';
import redisClient from '../redisClient.js';

export const uploadFile = async (filename, filepath, user_id, title, description) => {
  const result = await pool.query('INSERT INTO files (filename, filepath, user_id, title, description) VALUES ($1, $2, $3, $4, $5) RETURNING *', [filename, filepath, user_id, title, description]);
  return result.rows[0];
};

export const verifyAdminStatus = async (userId) => {
  const result = await pool.query('SELECT isAdmin FROM users WHERE id = $1', [userId]);
  return result.rows[0].isadmin
} 


export const listFiles = async (userId) => {
  const cacheKey = `files:${userId}`;
  // const cachedFiles = await redisClient.get(cacheKey);

  // if (cachedFiles) {
    // return JSON.parse(cachedFiles);
  // }

  const result = await pool.query('SELECT id, filename, filepath as "downloadURL", title, description, download_count, email_count FROM files', []);
  const files = result.rows;

  await redisClient.set(cacheKey, JSON.stringify(files), { EX: 60 * 5 }); // Cache for 5 minutes

  return files;
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

export const searchFiles = async (query, userId) => {
  const cacheKey = `search:${userId}:${query}`;
  const cachedFiles = await redisClient.get(cacheKey);

  if (cachedFiles) {
    return JSON.parse(cachedFiles);
  }

  const result = await pool.query('SELECT * FROM files WHERE user_id = $1 AND filename ILIKE $2', [userId, `%${query}%`]);
  const files = result.rows;

  await redisClient.set(cacheKey, JSON.stringify(files), { EX: 60 * 5 }); // Cache for 5 minutes

  return files;
};

export const incrementDownloadCount = async (fileId) => {
  const query = `
  UPDATE files
  SET download_count = download_count + 1
  WHERE id = $1;
  `

  await pool.query(query, [fileId]);
}

export const incrementEmailCount = async (fileId) => {
  const query = `
  UPDATE files
  SET email_count = email_count + 1
  WHERE id = $1;
  `

  await pool.query(query, [fileId]);
}