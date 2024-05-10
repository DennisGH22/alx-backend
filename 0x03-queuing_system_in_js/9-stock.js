import redis from 'redis';
const express = require('express');
const { promisify } = require('util');

const app = express();
const port = 1245;

const client = redis.createClient();
const getAsync = promisify(client.get).bind(client);
const setAsync = promisify(client.set).bind(client);

const listProducts = [
  { itemId: 1, itemName: 'Suitcase 250', price: 50, initialAvailableQuantity: 4 },
  { itemId: 2, itemName: 'Suitcase 450', price: 100, initialAvailableQuantity: 10 },
  { itemId: 3, itemName: 'Suitcase 650', price: 350, initialAvailableQuantity: 2 },
  { itemId: 4, itemName: 'Suitcase 1050', price: 550, initialAvailableQuantity: 5 }
];

function getItemById (id) {
  return listProducts.find(product => product.itemId === id);
}

if (require.main === module) {
  app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
  });
}

app.get('/list_products', (req, res) => {
  res.json(listProducts.map(product => ({
    itemId: product.itemId,
    itemName: product.itemName,
    price: product.price,
    initialAvailableQuantity: product.initialAvailableQuantity
  })));
});

app.get('/list_products/:itemId', async (req, res) => {
  const itemId = parseInt(req.params.itemId);
  const product = getItemById(itemId);
  if (product) {
    const currentQuantity = await getCurrentReservedStockById(itemId);
    res.json({ ...product, currentQuantity });
  } else {
    res.status(404).json({ status: 'Product not found' });
  }
});

app.get('/reserve_product/:itemId', async (req, res) => {
  const itemId = parseInt(req.params.itemId);
  const product = getItemById(itemId);
  if (!product) {
    res.status(404).json({ status: 'Product not found' });
  } else if (product.initialAvailableQuantity <= 0) {
    res.json({ status: 'Not enough stock available', itemId });
  } else {
    await reserveStockById(itemId, 1);
    res.json({ status: 'Reservation confirmed', itemId });
  }
});

async function reserveStockById (itemId, quantity) {
  await setAsync(`item.${itemId}`, quantity);
}

async function getCurrentReservedStockById (itemId) {
  const stock = await getAsync(`item.${itemId}`);
  return parseInt(stock) || 0;
}
