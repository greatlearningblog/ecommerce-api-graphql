const jwt = require('jsonwebtoken');

function getUserFromToken(token) {
  if (token) {
    try {
      // Remove "Bearer " prefix if present
      if (token.startsWith('Bearer ')) {
        token = token.slice(7, token.length).trim();
      }
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      return decoded;
    } catch (err) {
      console.error('JWT verification error:', err);
      return null;
    }
  }
  return null;
}

module.exports = { getUserFromToken };
