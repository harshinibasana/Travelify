const express = require('express');
const router  = express.Router();
const { body, validationResult } = require('express-validator');
const bcrypt  = require('bcryptjs');
const User    = require('../models/User');
const { protect } = require('../middleware/auth');

// ── REGISTER ─────────────────────────────────────────────────────────────────
router.post('/register', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, message: errors.array()[0].msg });

    const { name, email, password } = req.body;
    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) return res.status(400).json({ success: false, message: 'An account with this email already exists' });

    const count = await User.countDocuments();
    const role  = count === 0 ? 'admin' : 'user';

    const user  = await User.create({ name: name.trim(), email: email.toLowerCase().trim(), password, role });
    const token = user.generateToken();

    res.status(201).json({
      success: true, token,
      user: { id: user._id, name: user.name, email: user.email, avatar: user.avatar, role: user.role },
    });
  } catch (err) {
    console.error('Register error:', err.message);
    res.status(500).json({ success: false, message: 'Registration failed. Please try again.' });
  }
});

// ── LOGIN ─────────────────────────────────────────────────────────────────────
router.post('/login', [
  body('email').isEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password is required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, message: errors.array()[0].msg });

    const { email, password } = req.body;
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');

    if (!user) {
      console.log('Login: no user:', email);
      return res.status(401).json({ success: false, message: 'No account found with this email. Please register first.' });
    }

    // ── FIX: account exists but has no password (created via Atlas or old version) ──
    if (!user.password) {
      console.log('Login: no password for:', email, '— setting password now');
      // Auto-set the provided password for this account
      const hashed = await bcrypt.hash(password, 12);
      await User.findByIdAndUpdate(user._id, { $set: { password: hashed } }, { runValidators: false });
      const token = user.generateToken();
      console.log('Password set and logged in for:', email);
      return res.json({
        success: true, token,
        user: { id: user._id, name: user.name, email: user.email, avatar: user.avatar, role: user.role },
        message: 'Password has been set for your account.',
      });
    }

    // Compare password — supports both bcrypt and legacy plain-text
    let match = false;
    if (user.password.startsWith('$2')) {
      match = await bcrypt.compare(password, user.password);
    } else {
      match = user.password === password;
      if (match) {
        // Upgrade plain-text to bcrypt
        await User.findByIdAndUpdate(user._id, { $set: { password: await bcrypt.hash(password, 12) } }, { runValidators: false });
        console.log('Upgraded plain-text password for:', email);
      }
    }

    if (!match) {
      console.log('Login: wrong password for:', email);
      return res.status(401).json({ success: false, message: 'Incorrect password. Please try again.' });
    }

    const token = user.generateToken();
    console.log('Login success:', email, '| role:', user.role);

    res.json({
      success: true, token,
      user: { id: user._id, name: user.name, email: user.email, avatar: user.avatar, role: user.role },
    });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ success: false, message: 'Login failed. Check backend is running and MongoDB is connected.' });
  }
});

// ── SET / RESET PASSWORD (for accounts without a password) ────────────────────
router.post('/set-password', [
  body('email').isEmail().withMessage('Valid email required'),
  body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, message: errors.array()[0].msg });

    const { email, newPassword } = req.body;
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
    if (!user) return res.status(404).json({ success: false, message: 'No account found with this email' });

    const hashed = await bcrypt.hash(newPassword, 12);
    await User.findByIdAndUpdate(user._id, { $set: { password: hashed } }, { runValidators: false });
    const token = user.generateToken();

    console.log('Password set via set-password for:', email);
    res.json({
      success: true, token,
      user: { id: user._id, name: user.name, email: user.email, avatar: user.avatar, role: user.role },
      message: 'Password set successfully. You are now logged in.',
    });
  } catch (err) {
    console.error('Set-password error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to set password.' });
  }
});

// ── GET ME ────────────────────────────────────────────────────────────────────
router.get('/me', protect, async (req, res) => {
  const u = req.user;
  res.json({ success: true, user: { id: u._id, name: u.name, email: u.email, avatar: u.avatar, role: u.role, createdAt: u.createdAt } });
});

// ── UPDATE PROFILE ────────────────────────────────────────────────────────────
router.put('/profile', protect, async (req, res) => {
  try {
    const { name, avatar, password, currentPassword } = req.body;
    const update = {};
    if (name) update.name = name.trim();
    if (avatar !== undefined) update.avatar = avatar;

    if (password) {
      const userWithPw = await User.findById(req.user._id).select('+password');
      if (userWithPw.password) {
        if (!currentPassword) return res.status(400).json({ success: false, message: 'Current password is required' });
        const ok = await bcrypt.compare(currentPassword, userWithPw.password);
        if (!ok) return res.status(400).json({ success: false, message: 'Current password is incorrect' });
      }
      update.password = await bcrypt.hash(password, 12);
    }

    const user = await User.findByIdAndUpdate(req.user._id, { $set: update }, { new: true, runValidators: false }).select('-password');
    res.json({ success: true, user });
  } catch (err) {
    console.error('Profile update error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to update profile' });
  }
});

module.exports = router;
