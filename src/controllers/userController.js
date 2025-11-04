const User = require('../models/User');

// Basic create user (no auth hashing included; extend as required)
exports.createUser = async (req, res, next) => {
  try {
    const { name, email } = req.body;
    const user = new User({ name, email });
    await user.save();
    res.json({ ok: true, user });
  } catch (err) {
    next(err);
  }
};

exports.listUsers = async (req, res, next) => {
  try {
    const users = await User.find().limit(50);
    res.json({ users });
  } catch (err) {
    next(err);
  }
};
