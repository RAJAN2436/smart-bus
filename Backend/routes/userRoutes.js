import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const router = express.Router();

// Helper to generate JWT
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET || 'supersecretpassword123',
    { expiresIn: '30d' }
  );
};

// @route   POST api/users/register
// @desc    Register a new user
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Create user
       const userRole = role || 'user';
    const userStatus = (userRole === 'driver' || userRole === 'admin') ? 'Pending' : 'Active';
    const user = await User.create({
      id: `USR${Date.now()}`, // Simple ID generation
      name,
      email,
      password,
      role: userRole,
      status: userStatus,
      date: new Date().toISOString().split('T')[0]
    });

    if (user) {
      res.status(201).json({
        token: generateToken(user),
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });
    } else {
      res.status(400).json({ error: 'Invalid user data' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// @route   POST api/users/login
// @desc    Authenticate user & get token
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (user && (await user.comparePassword(password))) {
      res.json({
        token: generateToken(user),
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });
    } else {
      res.status(401).json({ error: 'Invalid email or password' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET all users
router.get('/', async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single user by id (not _id)
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findOne({ id: req.params.id }).select('-password');
    if (user) res.json(user);
    else res.status(404).json({ error: "User not found" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST new user (Legacy/Admin create)
router.post('/', async (req, res) => {
  try {
    const newUser = await User.create(req.body);
    const userResponse = newUser.toObject();
    delete userResponse.password;
    res.status(201).json(userResponse);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update user
router.put('/:id', async (req, res) => {
  try {
    const updated = await User.findOneAndUpdate({ id: req.params.id }, req.body, { new: true }).select('-password');
    if (updated) res.json(updated);
    else res.status(404).json({ error: "User not found" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE user
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await User.findOneAndDelete({ id: req.params.id });
    if (deleted) res.json({ success: true, message: "User deleted" });
    else res.status(404).json({ error: "User not found" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

