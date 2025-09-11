import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import generateToken from '../utils/generateToken.js';
import passport from 'passport';

export const register = async (req, res) => {
  try {
    const { username, email, password, role, class: className, college } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      username,
      email,
      password: hashedPassword,
      role,
      class: className,
      college
    });

    // Generate token
    const token = generateToken(newUser);

    // ✅ Send token in response (NOT in cookie)
    res.status(201).json({
      message: 'User registered successfully',
      token, // 👈 token here
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
        class: newUser.class,
        college: newUser.college
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user);

    // ✅ Send token in response (NOT in cookie)
    res.status(200).json({
      message: 'Login successful',
      token, // 👈 token here
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        class: user.class,
        college: user.college
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const logout = (req, res) => {
  // ✅ Clear token on frontend by removing from localStorage
  res.status(200).json({ message: 'Logout successful' });
};

export const checkAuth = async (req, res) => {
  try {
    // You should have a middleware that sets req.user from token
    if (req.user) {
      const user = await User.findById(req.user.id).select('-password');
      return res.status(200).json({
        isAuthenticated: true,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role
        }
      });
    }
    res.status(401).json({ isAuthenticated: false });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// =========================
// Google OAuth Controllers
// =========================

export const googleAuth = passport.authenticate('google', {
  scope: ['profile', 'email'],
  prompt: 'select_account'
});

export const googleCallback = (req, res, next) => {
  passport.authenticate('google', { session: false }, async (err, profileUser) => {
    try {
      if (err) return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/login?error=oauth_failed`);
      if (!profileUser) return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/login?error=no_profile`);

      // Issue JWT and redirect to frontend with token
      const token = generateToken(profileUser);
      const redirectUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/auth/callback?token=${encodeURIComponent(token)}`;
      return res.redirect(redirectUrl);
    } catch (e) {
      return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/login?error=server_error`);
    }
  })(req, res, next);
};
