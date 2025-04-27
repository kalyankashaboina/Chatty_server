const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { generateToken, setTokenCookie } = require('../utils/auth');

// Register user
const register = async (req, res) => {
  const { username, email, password } = req.body;
  console.log("💬 Register attempt with data:", { username,
    email, password });

  try {
    const userExists = await User.findOne({ $or: [{ email }, { username }] });
    if (userExists) return res.status(400).json({ message: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({ username, email, password: hashedPassword });
    await newUser.save();
    console.log("✅ User registered:", newUser);

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Internal Server Error. Please try again later.' });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    console.log("💬 Login attempt with email:",{email,password} )

    // Step 1: Check if the user exists in the database
    const user = await User.findOne({ email });
    if (!user) {
      console.log(`❌ User not found with email: ${email}`);
      return res.status(400).json({ message: 'User not found' });
    }

    // Step 2: Compare the password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log(`❌ Invalid credentials for email: ${email}`);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Step 3: Generate token
    const token = generateToken(user._id);
    console.log("🔑 JWT token generated:", token);

    // Step 4: Set token in the response cookie
    setTokenCookie(res, token);
    console.log('✅ Token set in cookie');

    // Step 5: Return response with token and user info
    res.status(200).json({ message: 'Login successful',  user });

  }  catch (error) {
    console.error('💥 Login error:', error);
    res.status(500).json({ message: 'Internal Server Error. Please try again later.', error: error.message });
  }
};


// Logout user
const logout = (req, res) => {
  try {
    // Step 1: Clear the token by setting the cookie to an expired date
    res.clearCookie('token', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'Strict' });

    // Step 2: Respond with a success message
    res.status(200).json({ message: 'Logout successful' });
    console.log('✅ User logged out, token removed from cookie');

  } catch (error) {
    console.error('💥 Logout error:', error);
    res.status(500).json({ message: 'Internal Server Error. Please try again later.' });
  }
};

// Get list of users for sidebar
const sidebarUsers = async (req, res) => {
  const userId = req.user.id;
  console.log("💬 Fetching sidebar users for userId:", userId);

  try {
    const users = await User.find({ _id: { $ne: userId } }).select('_id  username');
    if (!users) {
      return res.status(404).json({ message: 'No users found' });
    }
    console.log('Sidebar users:', users);
    res.status(200).json({ users });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Internal Server Error. Please try again later.' });
  }
};

module.exports = {
  register,
  login,logout,
  sidebarUsers
};
