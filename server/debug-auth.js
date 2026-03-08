import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { User } from './models.js';

dotenv.config();

const testPassword = 'Password123!';
const testEmail = 'debug@example.com';

async function runDebug() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('--- Connected to Database ---');

    // 1. Find the User
    const user = await User.findOne({ email: testEmail });
    if (!user) {
      console.error('User not found. Please register debug@example.com first.');
      process.exit(1);
    }

    console.log(`Checking user: ${user.email}`);
    console.log(`Stored Hash: ${user.passwordHash}`);

    // 2. Test SHA-256 (Old Custom Logic)
    const salt = process.env.PASSWORD_HASH_SALT || 'fbpa-default-salt';
    const sha256Hash = crypto
      .createHash('sha256')
      .update(`${salt}:${testPassword}`)
      .digest('hex');
    
    console.log('\n--- SHA-256 Comparison ---');
    console.log(`Generated: ${sha256Hash}`);
    console.log(`Match? ${sha256Hash === user.passwordHash}`);

    // 3. Test Bcrypt (Standard Logic)
    console.log('\n--- Bcrypt Comparison ---');
    const isBcryptMatch = await bcrypt.compare(testPassword, user.passwordHash);
    console.log(`Match? ${isBcryptMatch}`);

    if (isBcryptMatch && !(sha256Hash === user.passwordHash)) {
      console.log('\nRESULT: Your DB uses BCRYPT. Update your Login code to use bcrypt.compare().');
    } else if (!isBcryptMatch && sha256Hash === user.passwordHash) {
      console.log('\nRESULT: Your DB uses SHA-256. You should migrate these users to BCRYPT.');
    }

  } catch (err) {
    console.error('Debug Error:', err);
  } finally {
    mongoose.connection.close();
  }
}

runDebug();
