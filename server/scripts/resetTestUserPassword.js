import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '../server/models.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://FBPADB:FBPA2020@cluster0.fvycshx.mongodb.net/fbpa-db?appName=Cluster0';

async function resetPassword(email, plainPassword) {
  await mongoose.connect(MONGODB_URI);
  try {
    const hash = bcrypt.hashSync(plainPassword, 10);
    const user = await User.findOneAndUpdate(
      { email },
      { passwordHash: hash, plainPassword },
      { new: true }
    );
    if (user) {
      console.log('Password reset for:', user.email);
    } else {
      console.log('User not found:', email);
    }
  } catch (err) {
    console.error('Error resetting password:', err);
  } finally {
    await mongoose.disconnect();
  }
}

// Example usage
resetPassword('testuser@example.com', 'password123');
