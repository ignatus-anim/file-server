import bcrypt from 'bcrypt';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv'
import {
    createUser,
    findUserByEmail,
    findUserById,
    updateUserVerification,
    createResetToken,
    findUserByResetToken,
    reSetPassword,
    getUserToReset
} from '../models/userModel.js';


dotenv.config

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    auth: {
        user: process.env.SMTP_LOGIN,
        pass: process.env.SMTP_PASSWORD
    }
});

export const renderRegister = (req, res) => {
    res.render('register');
};

export const renderVerificationSent = (_request, response) => {
    response.render('verification-sent')
}

export const register = async (req, res) => {
    const { username, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString('hex');

    try {
        await createUser(username, email, hashedPassword, verificationToken);

        const verificationLink = `${req.protocol}://${req.get('host')}/auth/verify/${verificationToken}`;
        await transporter.sendMail({
            from: "ignatusa3@gmail.com",
            to: email,
            subject: 'Account Verification',
            text: `Click the link to verify your account: ${verificationLink}`,
            html: `<a href="${verificationLink}">Verify your email</a>`
        });

        res.status(201).redirect('/auth/verification-sent');
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const verifyEmail = async (req, res) => {
    const { token } = req.params;
    try {
      const user = await updateUserVerification(token);
      if (!user) return res.status(400).json({ message: 'Invalid token' });
  
      res.redirect('/auth/login');
    } catch (err) {
      res.status(500).json({ message: 'Server error', err });
    }
  };

export const renderLogin = (req, res) => {
    res.render('login');
};

export const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await findUserByEmail(email);

        if (!user) {
            return res.status(400).json({ error: 'Invalid email or password.' });
        }

        const match = await bcrypt.compare(password, user.password);

        if (!match) {
            return res.status(400).json({ error: 'Invalid email or password.' });
        }

        if (!user.is_verified) {
            return res.status(400).json({ error: 'Account not verified. Please check your email.' });
        }

        
        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.cookie('token', token, { httpOnly: true });
        res.status(200).redirect('/files/list');
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const renderAdmin = (req, res) => {
    res.render('admin');
};

export const admin = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await findUserByEmail(email);

        if (!user) {
            return res.status(400).json({ error: 'Invalid email or password.' });
        }

        const match = await bcrypt.compare(password, user.password);

        if (!match) {
            return res.status(400).json({ error: 'Invalid email or password.' });
        }

        if (!user.is_verified) {
            return res.status(400).json({ error: 'Account not verified. Please check your email.' });
        }

        
        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.cookie('token', token, { httpOnly: true });
        res.status(200).json({ message: 'Login successful' });
        res.redirect('/admin/list')
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


export const logout = (req, res) => {
    res.clearCookie('token');
    res.status(200).json({ message: 'Logout successful' });
    res.redirect('/');
};

export const verifyAccount = async (req, res) => {
    const { token } = req.params;

    try {
        const user = await updateUserVerification(token);

        if (!user) {
            return res.status(400).json({ error: 'Invalid or expired verification token.' });
        }

        res.status(200).redirect("/auth/login")
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const resetPasswordRequest = async (req, res) => {
    const { email } = req.body;
    const resetToken = crypto.randomBytes(32).toString('hex');

    try {
        const user = await createResetToken(email, resetToken);

        if (!user) {
            return res.status(400).json({ error: 'Email not found.' });
        }

        const resetLink = `${req.protocol}://${req.get('host')}/auth/reset-password/${resetToken}`;

        await transporter.sendMail({
            from: "ignatusa3@gmail.com",
            to: email,
            subject: 'Password Reset',
            text: `Click the link to reset your password: ${resetLink}`,
            html: `<a href='${resetLink}'>Click the link to reset your password: ${resetLink}</a>`
        });

        res.status(200).json({ message: 'Password reset email sent. Please check your email.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const renderResetPassword = async (req,res) =>{
    res.render('request-password');
}

export const resetPassword = async (req, res) => {
    const { confirmPassword, email } = req.body;

    const user = await findUserByEmail(email)
    const hashedPassword = await bcrypt.hash(confirmPassword, 10);

    try {
        await reSetPassword(user.id, hashedPassword)
    } catch (error) {
        console.error(error)
    }

    return res.status(200).redirect('/auth/login')
  };
  
  
  export const renderNewPassword = async (req, res) => {
    const token = req.params.token

    const userToReset = await getUserToReset(token)

    if (!userToReset) {
        return res.status(404)
    }

    const email = userToReset.email
    
    res.render('new-password', { email });
  };
  
  export const updatePassword = async (req, res) => {
    const { token, newPassword } = req.body;
    try {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      const user = await updatePassword(token, hashedPassword);
      if (!user) return res.status(400).json({ message: 'Invalid token' });
  
      res.redirect('/auth/login');
    } catch (err) {
      res.status(500).json({ message: 'Server error', err });
    }
  };