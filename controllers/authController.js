import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { createUser, findUserByUsername} from '../models/userModel.js';
import { config } from '../config.js';

export const renderRegister = (req, res) => {
  res.render('register');
};

export const register = async (req, res) => {
  const { username,email, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    await createUser(username, email, hashedPassword);
    res.status(201).redirect('/auth/login');
  } catch (err) {
    res.status(500).json({ message: 'Server error', err });
  }
};

export const renderLogin = (req, res) => {
  res.render('login');
};

export const login = async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await findUserByUsername(username);
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id }, config.jwtSecret, { expiresIn: '1h' });
    res.cookie('token', token, { httpOnly: true });
    res.redirect('/files/list');
  } catch (err) {
    res.status(500).json({ message: 'Server error', err });
  }
};

export const logout = (req, res) => {
  res.clearCookie('token');
  res.redirect('/');
};
