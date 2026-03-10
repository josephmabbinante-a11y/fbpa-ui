// Script to reset a user's password in MongoDB using bcrypt
// Usage: node scripts/resetUserPassword.cjs

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

require('dotenv').config();
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/fbpa-db';
const email = 'debuguser@example.com'; // User email to reset
const newPassword = 'Dbuser26$'; // New password to set
const SALT_ROUNDS = 10;

const userSchema = new mongoose.Schema({
  email: String,
  passwordHash: String,
});

const User = mongoose.model('User', userSchema);

async function resetPassword() {
  await mongoose.connect(MONGODB_URI);
  const user = await User.findOne({ email });
  if (!user) {
    console.error('User not found:', email);
    await mongoose.disconnect();
    return;
  }
  const hash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  user.passwordHash = hash;
  await user.save();
  console.log(`Password for ${email} reset successfully.`);
  await mongoose.disconnect();
}

resetPassword().catch(err => {
  console.error('Error resetting password:', err);
  process.exit(1);
});
