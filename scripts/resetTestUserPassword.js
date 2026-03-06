import mongoose from 'mongoose';
import { User } from '../server/multitenant/src/modules/users/user.model.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://FBPADB:FBPA2020@cluster0.fvycshx.mongodb.net/fbpa-db?appName=Cluster0';

async function resetPassword(email, newHash) {
  await mongoose.connect(MONGODB_URI);
  try {
    const user = await User.findOneAndUpdate(
      { email },
      { password_hash: newHash },
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
resetPassword('testuser@example.com', '$2b$10$newhashforreset'); // Replace with real bcrypt hash
