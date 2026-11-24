// Smoke test untuk mode serverless (vercel-sim) + SQLite lokal.
const BASE = process.env.BASE || 'http://127.0.0.1:3200';
const results = [];
const check = (name, ok, extra = '') => {
  results.push(`${ok ? 'PASS' : 'FAIL'}  ${name}${extra ? ' — ' + extra : ''}`);
  if (!ok) process.exitCode = 1;
};

let cookie = '';

async function call(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (cookie) headers.cookie = cookie;
  if (options.body && !(options.body instanceof FormData)) headers['content-type'] = 'application/json';
  const res = await fetch(BASE + path, { ...options, headers, redirect: 'manual' });
  const setCookie = res.headers.get('set-cookie');
  if (setCookie) cookie = setCookie.split(';')[0];
  const type = res.headers.get('content-type') || '';
  const body = type.includes('json') ? await res.json() : await res.arrayBuffer();
  return { status: res.status, body, type };
}

// 1. publik
const products = await call('/api/products');
check('GET /api/products', products.status === 200 && products.body.products.length === 12, `${products.body.products?.length} produk`);

const meta = await call('/api/meta');
check('GET /api/meta', meta.status === 200 && meta.body.categories.length === 4);

// 2. proteksi admin
const unauth = await call('/api/admin/products');
check('admin tanpa sesi = 401', unauth.status === 401);

const badLogin = await call('/api/auth/login', { method: 'POST', body: JSON.stringify({ username: 'admin', password: 'salah' }) });
check('login salah = 401', badLogin.status === 401);

const login = await call('/api/auth/login', { method: 'POST', body: JSON.stringify({ username: 'admin', password: 'admin' }) });
check('login benar = 200', login.status === 200);

const stats = await call('/api/admin/stats');
check('GET /api/admin/stats', stats.status === 200 && stats.body.stats.total === 12, JSON.stringify(stats.body.stats));

// 3. CRUD
const created = await call('/api/admin/products', {
  method: 'POST',
  body: JSON.stringify({
    name: 'Uji Serverless',
    category: 'Coffee Milk',
    price: 21000,
    description: 'produk uji',
    image: '/images/products/americano.jpg',
    inStock: true,
    sizes: [{ label: 'Regular', extra: 0 }],
    temperatures: ['Dingin'],
    ingredients: [{ name: 'Kopi', image: '/images/ingredients/coffee-beans.jpg' }],
    tools: [{ name: 'Gelas', image: '/images/tools/glass-cup.jpg' }],
    steps: ['seduh'],
  }),
});
check('POST produk = 201', created.status === 201, `id ${created.body.product?.id}`);
const id = created.body.product?.id;

const stock = await call(`/api/admin/products/${id}/stock`, { method: 'PATCH', body: JSON.stringify({ inStock: false }) });
check('PATCH stok', stock.status === 200 && stock.body.product.inStock === false);

const updated = await call(`/api/admin/products/${id}`, {
  method: 'PUT',
  body: JSON.stringify({
    name: 'Uji Serverless Edit',
    category: 'Non-Coffee',
    price: 23000,
    description: 'edit',
    image: '/images/products/matcha-latte.jpg',
    inStock: true,
    sizes: [{ label: 'Large', extra: 2000 }],
    temperatures: [],
    ingredients: [],
    tools: [],
    steps: [],
  }),
});
check('PUT produk', updated.status === 200 && updated.body.product.name === 'Uji Serverless Edit');

// 4. upload ke database + akses gambar
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
const form = new FormData();
form.append('image', new Blob([png], { type: 'image/png' }), 'pixel.png');
const uploaded = await call('/api/admin/upload', { method: 'POST', body: form });
check('POST /api/admin/upload = 201', uploaded.status === 201, uploaded.body.url);

if (uploaded.body?.url) {
  const img = await fetch(BASE + uploaded.body.url);
  check('GET upload tersaji', img.status === 200 && img.headers.get('content-type') === 'image/png', `${(await img.arrayBuffer()).byteLength} byte`);
}

const removed = await call(`/api/admin/products/${id}`, { method: 'DELETE' });
check('DELETE produk', removed.status === 200);

// 5. SPA fallback & aset statis
const spa = await fetch(BASE + '/menu');
const spaHtml = await spa.text();
check('SPA /menu = index.html', spa.status === 200 && spaHtml.includes('<div id="root">'));

const asset = await fetch(BASE + '/images/hero.jpg');
check('aset /images/hero.jpg', asset.status === 200);

// 5b. pesanan pelanggan
const invalidOrder = await call('/api/orders', {
  method: 'POST',
  body: JSON.stringify({ customerName: 'A', customerPhone: '12', items: [] }),
});
check('POST /api/orders tidak valid = 400', invalidOrder.status === 400, invalidOrder.body.error);

const newOrder = await call('/api/orders', {
  method: 'POST',
  body: JSON.stringify({
    customerName: 'Budi Santoso',
    customerPhone: '082122190680',
    method: 'pickup',
    address: '',
    note: 'less sugar',
    items: [{ productId: 1, sizeLabel: 'Regular (250 ml)', temperature: 'Dingin', qty: 2 }],
  }),
});
check('POST /api/orders = 201', newOrder.status === 201, `${newOrder.body.order?.code}`);
check('total dihitung server = 44000', newOrder.body.order?.total === 44000, String(newOrder.body.order?.total));

const orderList = await call('/api/admin/orders');
const savedOrder = orderList.body.orders?.find((order) => order.code === newOrder.body.order?.code);
check('GET /api/admin/orders memuat pesanan', orderList.status === 200 && Boolean(savedOrder));

if (savedOrder) {
  const statusUpdate = await call(`/api/admin/orders/${savedOrder.id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'diproses' }),
  });
  check('PATCH status pesanan', statusUpdate.status === 200 && statusUpdate.body.order.status === 'diproses');
}

const checkoutPage = await fetch(BASE + '/checkout');
check('SPA /checkout = index.html', checkoutPage.status === 200 && (await checkoutPage.text()).includes('<div id="root">'));

// 6. logout
const logout = await call('/api/auth/logout', { method: 'POST' });
check('logout', logout.status === 200);
const after = await call('/api/admin/products');
check('setelah logout = 401', after.status === 401);

const afterOrders = await call('/api/admin/orders');
check('pesanan tanpa sesi = 401', afterOrders.status === 401);

console.log(results.join('\n'));
console.log(`\n${results.filter((r) => r.startsWith('PASS')).length}/${results.length} cek lolos`);
