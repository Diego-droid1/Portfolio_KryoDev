const express = require('express');
const path = require('path');
const db = require('./db');
const coinDB = require('./coinDB');
coinDB.initCoinsTable();

const app = express();
const port = 3000;
const GLOBAL_USER_ID = 0;

app.use(express.json());
app.use(express.static('public'));

app.get('/api/store-exists', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT COUNT(*) AS count FROM store');
    res.json({ exists: rows[0].count > 0 });
  } catch {
    res.json({ exists: false });
  }
});

app.post('/api/create-store', async (req, res) => {
  const { storeName, ownerName, email, storeDescription, acceptedTerms } = req.body;
  if (!storeName || !ownerName || !email || !storeDescription || !acceptedTerms) {
    return res.status(400).json({ message: 'Faltan campos obligatorios o no se aceptaron los términos.' });
  }
  try {
    await db.query('INSERT INTO store (storeName, ownerName, email, storeDescription, acceptedTerms) VALUES (?, ?, ?, ?, ?)', [storeName, ownerName, email, storeDescription, acceptedTerms]);
    res.json({ message: 'Tienda creada exitosamente.' });
  } catch {
    res.status(500).json({ message: 'Error al crear la tienda.' });
  }
});

app.delete('/api/store', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT COUNT(*) AS count FROM store');
    if (rows[0].count === 0) return res.status(404).json({ message: 'No hay tienda para eliminar' });
    await db.query('DELETE FROM store');
    await db.query('DELETE FROM products');
    await db.query('DELETE FROM promotions');
    await db.query('DELETE FROM portfolios');
    res.json({ message: 'Tienda eliminada correctamente' });
  } catch {
    res.status(500).json({ message: 'Error al eliminar la tienda.' });
  }
});

app.get('/api/products', async (req, res) => {
  try {
    const [store] = await db.query('SELECT COUNT(*) AS count FROM store');
    if (store[0].count === 0) return res.status(404).json({ message: 'No existe una tienda creada.' });
    const [products] = await db.query('SELECT * FROM products');
    res.json(products);
  } catch {
    res.status(500).json({ message: 'Error al obtener productos.' });
  }
});

app.post('/api/products', async (req, res) => {
  try {
    const [store] = await db.query('SELECT COUNT(*) AS count FROM store');
    if (store[0].count === 0) return res.status(400).json({ message: 'No existe una tienda creada.' });

    const { name, category, description, price, image } = req.body;
    if (!name || !category || !description || typeof price !== 'number') {
      return res.status(400).json({ message: 'Campos incompletos o inválidos' });
    }
    const [result] = await db.query('INSERT INTO products (name, category, description, price, image) VALUES (?, ?, ?, ?, ?)', [name, category, description, price, image || '']);
    const newProduct = { id: result.insertId, name, category, description, price, image: image || '' };
    res.status(201).json(newProduct);
  } catch {
    res.status(500).json({ message: 'Error al crear producto.' });
  }
});

app.put('/api/products/:id', async (req, res) => {
  try {
    const [store] = await db.query('SELECT COUNT(*) AS count FROM store');
    if (store[0].count === 0) return res.status(400).json({ message: 'No existe una tienda creada.' });

    const id = parseInt(req.params.id, 10);
    const [rows] = await db.query('SELECT * FROM products WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Producto no encontrado' });

    const fields = [];
    const values = [];
    for (const key in req.body) {
      fields.push(`${key} = ?`);
      values.push(req.body[key]);
    }
    if (fields.length === 0) return res.status(400).json({ message: 'No hay datos para actualizar' });

    values.push(id);
    await db.query(`UPDATE products SET ${fields.join(', ')} WHERE id = ?`, values);
    res.json({ message: 'Producto actualizado' });
  } catch {
    res.status(500).json({ message: 'Error al actualizar producto.' });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    const [store] = await db.query('SELECT COUNT(*) AS count FROM store');
    if (store[0].count === 0) return res.status(400).json({ message: 'No existe una tienda creada.' });

    const id = parseInt(req.params.id, 10);
    const [rows] = await db.query('SELECT * FROM products WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Producto no encontrado' });

    await db.query('DELETE FROM products WHERE id = ?', [id]);
    res.json({ message: 'Producto eliminado' });
  } catch {
    res.status(500).json({ message: 'Error al eliminar producto.' });
  }
});

app.get('/api/portfolios', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM portfolios');
    res.json(rows);
  } catch {
    res.status(500).json({ message: 'Error al obtener portfolios.' });
  }
});

app.post('/api/portfolios', async (req, res) => {
  try {
    const { userId, content } = req.body;
    if (!userId || !content) return res.status(400).json({ message: 'Faltan datos para crear portfolio.' });

    const [result] = await db.query('INSERT INTO portfolios (userId, content, createdAt) VALUES (?, ?, NOW())', [userId, content]);
    const newPortfolio = { id: result.insertId, userId, content, createdAt: new Date() };
    res.status(201).json(newPortfolio);
  } catch {
    res.status(500).json({ message: 'Error al crear portfolio.' });
  }
});

app.put('/api/portfolios/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [rows] = await db.query('SELECT * FROM portfolios WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Portfolio no encontrado' });

    const fields = [];
    const values = [];
    for (const key in req.body) {
      fields.push(`${key} = ?`);
      values.push(req.body[key]);
    }
    if (fields.length === 0) return res.status(400).json({ message: 'No hay datos para actualizar' });

    values.push(id);
    await db.query(`UPDATE portfolios SET ${fields.join(', ')} WHERE id = ?`, values);
    res.json({ message: 'Portfolio actualizado' });
  } catch {
    res.status(500).json({ message: 'Error al actualizar portfolio.' });
  }
});

app.delete('/api/portfolios/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [result] = await db.query('DELETE FROM portfolios WHERE id = ?', [id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Portfolio no encontrado' });
    res.json({ message: 'Portfolio eliminado' });
  } catch {
    res.status(500).json({ message: 'Error al eliminar portfolio.' });
  }
});

app.get('/api/global-coins', async (req, res) => {
  try {
    const coins = await coinDB.getDevCoins(GLOBAL_USER_ID);
    res.json({ coins });
  } catch {
    res.status(500).json({ message: 'Error al obtener monedas' });
  }
});

app.post('/api/global-coins/set', async (req, res) => {
  try {
    const { amount } = req.body;
    if (typeof amount !== 'number' || amount < 0) return res.status(400).json({ message: 'Cantidad inválida' });
    await coinDB.setDevCoins(GLOBAL_USER_ID, amount);
    res.json({ message: 'Cantidad de monedas actualizada' });
  } catch {
    res.status(500).json({ message: 'Error al establecer monedas' });
  }
});

app.get('/api/promotions', async (req, res) => {
  try {
    const now = new Date();
    const [rows] = await db.query('SELECT * FROM promotions WHERE expiresAt > ?', [now]);
    res.json(rows);
  } catch {
    res.status(500).json({ message: 'Error al obtener promociones' });
  }
});

app.post('/api/promotions', async (req, res) => {
  try {
    const { amount, systemId, systemName, startAt, expiresAt } = req.body;
    if (!amount || !systemId || !systemName || !startAt || !expiresAt) {
      return res.status(400).json({ message: 'Faltan datos de la promoción' });
    }
    const now = new Date();
    const [exists] = await db.query('SELECT * FROM promotions WHERE systemId = ? AND expiresAt > ?', [systemId, now]);
    if (exists.length > 0) return res.status(409).json({ message: 'Este sistema ya está promocionado' });

    await db.query('INSERT INTO promotions (amount, systemId, systemName, startAt, expiresAt) VALUES (?, ?, ?, ?, ?)', [amount, systemId, systemName, startAt, expiresAt]);
    res.status(201).json({ message: 'Promoción registrada' });
  } catch {
    res.status(500).json({ message: 'Error al registrar promoción' });
  }
});

app.delete('/api/promotions/:systemId', async (req, res) => {
  try {
    const systemId = req.params.systemId;
    const [result] = await db.query('DELETE FROM promotions WHERE systemId = ?', [systemId]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Promoción no encontrada' });
    res.json({ message: 'Promoción eliminada' });
  } catch {
    res.status(500).json({ message: 'Error al eliminar promoción' });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});