// Little helpers for hashing refresh tokens (so a DB leak can't reuse them).
const bcrypt = require('bcrypt');

// Hash a token string for storage in DB (never store plaintext refresh tokens).
const hashToken = (token) => bcrypt.hash(token, 12);

// Compare a raw token with a stored hash.
const compareToken = (token, hash) => bcrypt.compare(token, hash);

// Convert unix exp (seconds) to a JS Date for DB columns.
const expToDate = (expSeconds) => new Date(expSeconds * 1000);

module.exports = { hashToken, compareToken, expToDate };
