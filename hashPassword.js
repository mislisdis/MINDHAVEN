const bcrypt = require('bcryptjs');

async function generateHashedPassword(plainPassword) {
  try {
    const saltRounds = 10; // recommended default
    const hashedPassword = await bcrypt.hash(plainPassword, saltRounds);
    console.log('Plain password:', plainPassword);
    console.log('Hashed password:', hashedPassword);
  } catch (err) {
    console.error('Error hashing password:', err);
  }
}

// Example usage
generateHashedPassword('Admin@123!');