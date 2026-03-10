// Script to update existing users in MongoDB to use hashed passwords
// Run with: node scripts/updateUserPasswords.js

const mongoose = require('mongoose');
const crypto = require('crypto');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/fbpa-db';
const PASSWORD_HASH_SALT = process.env.PASSWORD_HASH_SALT || 'fbpa-default-salt';

function hashPassword(password) {
  return crypto
    .createHash('sha256')
    .update(`${PASSWORD_HASH_SALT}:${String(password || '')}`)
    .digest('hex');
}

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  passwordHash: String,
});

const User = mongoose.model('User', userSchema);

async function updatePasswords() {
  await mongoose.connect(MONGODB_URI);
  const users = await User.find({ passwordHash: { $exists: false }, password: { $exists: true } });
  for (const user of users) {
    if (user.password) {
      user.passwordHash = hashPassword(user.password);
      user.password = undefined;
      await user.save();
      console.log(`Updated user: ${user.email}`);
    }
  }
  await mongoose.disconnect();
  console.log('Password update complete.');
}

updatePasswords().catch(err => {
  console.error('Error updating passwords:', err);
  process.exit(1);
});
