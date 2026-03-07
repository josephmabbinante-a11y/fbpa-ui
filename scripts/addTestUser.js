import mongoose from 'mongoose';
import { User } from '../server/models.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://FBPADB:FBPA2020@cluster0.fvycshx.mongodb.net/fbpa-db?appName=Cluster0';

async function addTestUser() {
  await mongoose.connect(MONGODB_URI);
  const testUser = {
    email: 'testuser@example.com',
    passwordHash: '$2b$10$testhashfortesting', // Replace with a real bcrypt hash
    plainPassword: 'password123',
    role: 'user',
    verified: true,
    verificationToken: '',
    createdAt: new Date(),
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
