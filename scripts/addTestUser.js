import mongoose from 'mongoose';
import { User } from '../server/multitenant/src/modules/users/user.model.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://FBPADB:FBPA2020@cluster0.fvycshx.mongodb.net/fbpa-db?appName=Cluster0';

async function addTestUser() {
  await mongoose.connect(MONGODB_URI);
  const testUser = {
    email: 'testuser@example.com',
    password_hash: '$2b$10$testhashfortesting', // Replace with a real bcrypt hash
    role: 'user',
    created_at: new Date(),
  };
  try {
    const user = await User.create(testUser);
    console.log('Test user created:', user);
  } catch (err) {
    console.error('Error creating test user:', err);
  } finally {
    await mongoose.disconnect();
  }
}

addTestUser();
