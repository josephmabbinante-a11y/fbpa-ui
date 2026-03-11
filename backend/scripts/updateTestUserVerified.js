import mongoose from 'mongoose';
import { User } from '../server/models.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://FBPADB:FBPA2020@cluster0.fvycshx.mongodb.net/fbpa-db?appName=Cluster0';

async function updateVerified() {
  await mongoose.connect(MONGODB_URI);
  try {
    const user = await User.findOneAndUpdate(
      { email: 'testuser@example.com' },
      { verified: true },
      { new: true }
    );
    if (user) {
      console.log('Updated verified for:', user.email);
    } else {
      console.log('User not found:', 'testuser@example.com');
    }
  } catch (err) {
    console.error('Error updating verified:', err);
  } finally {
    await mongoose.disconnect();
  }
}

updateVerified();
