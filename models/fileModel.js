import pool from '../db.js';
import redisClient from '../redisClient.js';

export const uploadFile = async (filename, filepath, user_id) => {
  console.log("user id", user_id)
  const result = await pool.query('INSERT INTO files (filename, filepath, user_id) VALUES ($1, $2, $3) RETURNING *', [filename, filepath, user_id]);
  return result.rows[0];
};

// export const listFiles = async (userId) => {

//   if (userId !== undefined) {
//     const result = await pool.query('SELECT * FROM files WHERE user_id = $1', [userId]);
//     return result.rows;
//   }

//   const result = await pool.query('SELECT * FROM files');
//   return result.rows;
// };

export const listFiles = async (userId) => {
  const cacheKey = `files:${userId}`;
  const cachedFiles = await redisClient.get(cacheKey);

  if (cachedFiles) {
    return JSON.parse(cachedFiles);
  }

  // const result = await pool.query('SELECT * FROM files WHERE user_id = $1', [userId]);
  const result = await pool.query('SELECT id, filename, filepath as "downloadURL" FROM files WHERE user_id = $1', [userId]);
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