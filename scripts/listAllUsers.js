import mongoose from 'mongoose';
import { User } from '../server/multitenant/src/modules/users/user.model.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://FBPADB:FBPA2020@cluster0.fvycshx.mongodb.net/fbpa-db?appName=Cluster0';

async function listAllUsers() {
  await mongoose.connect(MONGODB_URI);
  try {
    const users = await User.find({});
    console.log('All users:');
    users.forEach(u => console.log(u.email, u.role));
  } catch (err) {
    console.error('Error listing users:', err);
  } finally {
    await mongoose.disconnect();
  }
}

listAllUsers();
