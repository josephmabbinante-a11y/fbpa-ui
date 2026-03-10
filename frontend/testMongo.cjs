const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

function buildMongoUri() {
  const explicitUri = String(process.env.MONGODB_URI).trim();
  if (explicitUri) return explicitUri;

  const user = process.env.MONGODB_USER;
  const password = process.env.MONGODB_PASSWORD;
  const host = process.env.MONGODB_HOST;
  const db = process.env.MONGODB_DB || 'fbpa-db';

  if (!user || !password || !host) return '';

  const encodedUser = encodeURIComponent(String(user));
  const encodedPassword = encodeURIComponent(String(password));
  return `mongodb+srv://${encodedUser}:${encodedPassword}@${host}/${db}?retryWrites=true&w=majority`;
}

const uri = buildMongoUri();

const clientOptions = { serverApi: { version: '1', strict: true, deprecationErrors: true } };

async function run() {
  try {
    if (!uri) {
      throw new Error('MONGODB_URI is not set. Configure MONGODB_URI or MONGODB_USER/MONGODB_PASSWORD/MONGODB_HOST in .env');
    }

    // Create a Mongoose client with a MongoClientOptions object to set the Stable API version
    await mongoose.connect(uri, clientOptions);
    await mongoose.connection.db.admin().command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    await mongoose.disconnect();
  }
}
run().catch(console.dir);
