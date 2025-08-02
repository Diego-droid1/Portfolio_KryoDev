const db = require('./db');

const coinDB = {
  async initCoinsTable() {
    await db.query(`
      CREATE TABLE IF NOT EXISTS dev_coins (
        id INT AUTO_INCREMENT PRIMARY KEY,
        userId INT NOT NULL UNIQUE,
        coins INT NOT NULL DEFAULT 0,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `);
  },


  async getDevCoins(userId) {
    const [rows] = await db.query(
      'SELECT coins FROM dev_coins WHERE userId = ?',
      [userId]
    );
    if (rows.length === 0) return 0;
    return rows[0].coins;
  },

  async setDevCoins(userId, amount) {
    const [existing] = await db.query(
      'SELECT id FROM dev_coins WHERE userId = ?',
      [userId]
    );
    if (existing.length > 0) {
      await db.query(
        'UPDATE dev_coins SET coins = ? WHERE userId = ?',
        [amount, userId]
      );
    } else {
      await db.query(
        'INSERT INTO dev_coins (userId, coins) VALUES (?, ?)',
        [userId, amount]
      );
    }
  }
};

module.exports = coinDB;