// controllers/authController.js
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const generateToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET || 'devsecret', { expiresIn: '1d' });

const registerUser = async (req, res) => {
  const { username, name, email, password } = req.body;
  if (!username || !name || !email || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    const existingEmail = await User.findOne({ email });
    if (existingEmail) return res.status(400).json({ message: 'Email already exists' });

    const existingUsername = await User.findOne({ username });
    if (existingUsername) return res.status(400).json({ message: 'Username already exists' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = new User({
      username,
      name,
      email,
      password: hashedPassword,
    });

    await user.save();

    const token = generateToken(user._id);
    const safeUser = {
      id: user._id,
      username: user.username,
      name: user.name,
      email: user.email,
      profilePic: user.profilePic || '',
      avatar: user.avatar || '',
      helpingPosts: user.helpingPosts || [],
    };

    return res.status(201).json({ token, user: safeUser });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const loginUser = async (req, res) => {
  const { identifier, password } = req.body; // identifier = username OR email
  if (!identifier || !password) return res.status(400).json({ message: 'Missing credentials' });

  try {
    const user = await User.findOne({
      $or: [{ username: identifier }, { email: identifier }],
    });

    if (!user) {
      // do not reveal whether user exists
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = generateToken(user._id);
    const safeUser = {
      id: user._id,
      username: user.username,
      name: user.name,
      email: user.email,
      profilePic: user.profilePic || '',
      avatar: user.avatar || '',
      helpingPosts: user.helpingPosts || [],
    };

    return res.status(200).json({ token, user: safeUser });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = { registerUser, loginUser };
