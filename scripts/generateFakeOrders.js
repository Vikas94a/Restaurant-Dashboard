// Usage: node scripts/generateFakeOrders.js <restaurantId>
const { initializeApp, applicationDefault, cert } = require('firebase-admin/app');
const { getFirestore, Timestamp } = require('firebase-admin/firestore');
const admin = require('firebase-admin');

// TODO: Replace with your service account or use applicationDefault()
// const serviceAccount = require('./path/to/serviceAccountKey.json');

if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  console.error('Set GOOGLE_APPLICATION_CREDENTIALS to your Firebase service account key.');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
});

const db = getFirestore();

const restaurantId = process.argv[2];
if (!restaurantId) {
  console.error('Usage: node scripts/generateFakeOrders.js <restaurantId>');
  process.exit(1);
}

const NUM_MONTHS = 6;
const ORDERS_PER_DAY_MIN = 5;
const ORDERS_PER_DAY_MAX = 15;
const ITEMS_PER_ORDER_MIN = 1;
const ITEMS_PER_ORDER_MAX = 4;

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFromArray(arr) {
  return arr[randomInt(0, arr.length - 1)];
}

async function fetchMenu(restaurantId) {
  const menuSnap = await db.collection('restaurants').doc(restaurantId).collection('menu').get();
  const categories = [];
  menuSnap.forEach(doc => {
    const data = doc.data();
    categories.push({
      id: doc.id,
      name: data.categoryName || 'Uncategorized',
      items: (data.items || []).map((item, idx) => ({
        id: item.id || `item-${doc.id}-${idx}`,
        name: item.name || '',
        price: item.price?.amount || 0,
        categoryName: data.categoryName || 'Uncategorized',
      })),
    });
  });
  return categories;
}

function randomDateInDay(day) {
  const start = new Date(day);
  start.setHours(0, 0, 0, 0);
  const end = new Date(day);
  end.setHours(23, 59, 59, 999);
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

async function main() {
  const categories = await fetchMenu(restaurantId);
  const allItems = categories.flatMap(cat => cat.items.map(item => ({ ...item, categoryName: cat.name })));
  if (allItems.length === 0) {
    console.error('No menu items found for this restaurant.');
    process.exit(1);
  }

  const today = new Date();
  const startDate = new Date(today);
  startDate.setMonth(today.getMonth() - NUM_MONTHS);
  startDate.setHours(0, 0, 0, 0);

  let currentDate = new Date(startDate);
  let orderCount = 0;

  while (currentDate <= today) {
    const numOrders = randomInt(ORDERS_PER_DAY_MIN, ORDERS_PER_DAY_MAX);
    const batch = db.batch();
    for (let i = 0; i < numOrders; i++) {
      const numItems = randomInt(ITEMS_PER_ORDER_MIN, Math.min(ITEMS_PER_ORDER_MAX, allItems.length));
      const items = [];
      const usedIndexes = new Set();
      while (items.length < numItems) {
        const idx = randomInt(0, allItems.length - 1);
        if (!usedIndexes.has(idx)) {
          usedIndexes.add(idx);
          const menuItem = allItems[idx];
          items.push({
            categoryName: menuItem.categoryName,
            itemName: menuItem.name,
            itemPrice: menuItem.price,
            quantity: randomInt(1, 3),
            restaurantId,
          });
        }
      }
      const orderTime = randomDateInDay(currentDate);
      const orderDoc = db.collection('restaurants').doc(restaurantId).collection('orders').doc();
      batch.set(orderDoc, {
        createdAt: orderTime.toISOString(),
        status: 'completed',
        items,
        total: items.reduce((sum, item) => sum + item.itemPrice * item.quantity, 0),
        customerDetails: {
          name: 'Test User',
          phone: '1234567890',
          email: 'test@example.com',
          pickupDate: orderTime.toISOString(),
          pickupTime: 'asap',
        },
        pickupOption: 'asap',
        pickupTime: 'asap',
        restaurantId,
      });
      orderCount++;
    }
    await batch.commit();
    console.log(`Created ${numOrders} orders for ${currentDate.toISOString().slice(0, 10)}`);
    currentDate.setDate(currentDate.getDate() + 1);
  }
  console.log(`Done! Created ${orderCount} orders for restaurant ${restaurantId}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
}); 