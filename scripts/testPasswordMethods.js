// Password hash test utility
import argon2 from 'argon2';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

async function testPasswordMethods(password) {
  const results = {};

  // Bcrypt
  try {
    const bcryptHash = bcrypt.hashSync(password, 10);
    const bcryptValid = bcrypt.compareSync(password, bcryptHash);
    results.bcrypt = { hash: bcryptHash, valid: bcryptValid };
  } catch (e) {
    results.bcrypt = { error: e.message };
  }

  // Argon2
  try {
    const argonHash = await argon2.hash(password);
    const argonValid = await argon2.verify(argonHash, password);
    results.argon2 = { hash: argonHash, valid: argonValid };
  } catch (e) {
    results.argon2 = { error: e.message };
  }

  // PBKDF2
  try {
    const salt = crypto.randomBytes(16);
    const pbkdf2Hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
    results.pbkdf2 = { hash: pbkdf2Hash, valid: true };
  } catch (e) {
    results.pbkdf2 = { error: e.message };
  }

  return results;
}

(async () => {
  const password = 'TestPassword123!';
  const results = await testPasswordMethods(password);
  console.log('Password method test results:', results);
})();
