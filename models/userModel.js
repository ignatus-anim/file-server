import pool from '../db.js';
import { v4 as uuidv4 } from 'uuid';

export const createUser = async (username, email, hashedPassword, verificationToken) => {
    const query = `
        INSERT INTO users (id, username, email, password, verification_token)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *;
    `;
    const values = [uuidv4(), username, email, hashedPassword, verificationToken];
    const res = await pool.query(query, values);
    return res.rows[0];
};

export const findUserByEmail = async (email) => {
    const query = 'SELECT * FROM users WHERE email = $1';
    const values = [email];
    const res = await pool.query(query, values);
    return res.rows[0];
};

export const findUserById = async (id) => {
    const query = 'SELECT * FROM users WHERE id = $1';
    const values = [id];
    const res = await pool.query(query, values);
    return res.rows[0];
};

export const updateUserVerification = async (token) => {
    const query = `
        UPDATE users
        SET is_verified = TRUE, verification_token = NULL
        WHERE verification_token = $1
        RETURNING *;
    `;
    const values = [token];
    const res = await pool.query(query, values);
    return res.rows[0];
};

export const createResetToken = async (email, resetToken) => {
    const query = `
        UPDATE users
        SET reset_token = $1
        WHERE email = $2
        RETURNING *;
    `;
    const values = [resetToken, email];
    const res = await pool.query(query, values);
    return res.rows[0];
};

export const findUserByResetToken = async (resetToken) => {
    const query = 'SELECT * FROM users WHERE reset_token = $1';
    const values = [resetToken];
    const res = await pool.query(query, values);
    return res.rows[0];
};

export const reSetPassword = async (userId, hashedPassword) => {
    const query = `
        UPDATE users
        SET password = $1, reset_token = NULL
        WHERE id = $2
        RETURNING *;
    `;
    console.log(userId)
    const values = [hashedPassword, userId];
    const res = await pool.query(query, values);
    console.log(res.rows)
    return res.rows[0];
};

export const getUserToReset = async (token) => {
    const query = `
    SELECT email from users
    WHERE reset_token = $1
    `

    const res = await pool.query(query, [token])

    return res.rows.at(0)

}
