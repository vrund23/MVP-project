// frontend/src/api.js
// ─── Central API Client — wired to the real backend (Blocks 1-5) ────────────

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// ─── Token Helpers ──────────────────────────────────────────────────────────
const getToken = () => localStorage.getItem('m_token');

/** Headers for requests WITH a JSON body (POST / PUT) */
const authHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${getToken()}`,
});

/** Headers for requests WITHOUT a body (GET / DELETE) */
const noBodyAuthHeaders = () => ({
  Authorization: `Bearer ${getToken()}`,
});

// ─── Unified Response Handler ────────────────────────────────────────────────
const handleResponse = async (res) => {
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
};

// ─── Filtered Query-String Builder ──────────────────────────────────────────
const qs = (params = {}) => {
  const str = new URLSearchParams(
    Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v != null))
  ).toString();
  return str ? `?${str}` : '';
};

// ─── API Surface ─────────────────────────────────────────────────────────────
export const api = {
  // ── Auth ──────────────────────────────────────────────────────────────────
  // POST /api/auth/register
  register: (payload) =>
    fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).then(handleResponse),

  // POST /api/auth/login  → { success, token, user: { id, name, email, role } }
  login: (payload) =>
    fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).then(handleResponse),

  // GET /api/auth/me  (protected)
  getMe: () =>
    fetch(`${BASE_URL}/auth/me`, { headers: noBodyAuthHeaders() }).then(handleResponse),

  // ── Products ──────────────────────────────────────────────────────────────
  // GET /api/products?category=&subcategory=&badge=&search=
  // Returns { success, count, data: Product[] }
  getProducts: (params = {}) =>
    fetch(`${BASE_URL}/products${qs(params)}`).then(handleResponse),

  // GET /api/products/:id
  getProductById: (id) =>
    fetch(`${BASE_URL}/products/${id}`).then(handleResponse),

  // POST /api/products  (owner only)
  createProduct: (payload) =>
    fetch(`${BASE_URL}/products`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(payload),
    }).then(handleResponse),

  // PUT /api/products/:id  (owner only)
  updateProduct: (id, payload) =>
    fetch(`${BASE_URL}/products/${id}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(payload),
    }).then(handleResponse),

  // DELETE /api/products/:id  → soft-delete (isAvailable: false)  (owner only)
  deleteProduct: (id) =>
    fetch(`${BASE_URL}/products/${id}`, {
      method: 'DELETE',
      headers: noBodyAuthHeaders(),
    }).then(handleResponse),

  // ── Orders ────────────────────────────────────────────────────────────────
  // POST /api/orders  (authenticated)
  // Payload: { items:[{productId,variantId,quantity}], customizations, fulfillment, paymentMethod }
  // Returns { success, message, data: Order }
  createOrder: (payload) =>
    fetch(`${BASE_URL}/orders`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(payload),
    }).then(handleResponse),

  // GET /api/orders/my-orders  (authenticated customer)
  // Returns { success, count, data: Order[] }
  getMyOrders: () =>
    fetch(`${BASE_URL}/orders/my-orders`, {
      headers: noBodyAuthHeaders(),
    }).then(handleResponse),

  // GET /api/orders/:id  (owner OR the order's customer)
  getOrderById: (id) =>
    fetch(`${BASE_URL}/orders/${id}`, {
      headers: noBodyAuthHeaders(),
    }).then(handleResponse),

  // GET /api/orders?status=&date=  (owner only)
  // Returns { success, count, data: Order[] } — customer is populated
  getAllOrders: (params = {}) =>
    fetch(`${BASE_URL}/orders${qs(params)}`, {
      headers: noBodyAuthHeaders(),
    }).then(handleResponse),

  // PUT /api/orders/:id/status  (owner only)
  // Body: { orderStatus?, paymentStatus? }
  updateOrderStatus: (id, orderStatus, paymentStatus) =>
    fetch(`${BASE_URL}/orders/${id}/status`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(
        Object.fromEntries(
          Object.entries({ orderStatus, paymentStatus }).filter(([, v]) => v != null)
        )
      ),
    }).then(handleResponse),

  // PUT /api/orders/:id/cancel  (owner or customer, only before in_kitchen)
  // Body: { reason? }
  cancelOrder: (id, reason) =>
    fetch(`${BASE_URL}/orders/${id}/cancel`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({ reason }),
    }).then(handleResponse),

  // ── Payments ──────────────────────────────────────────────────────────────
  // POST /api/payments/create-order  (authenticated)
  createRazorpayOrder: (orderId) =>
    fetch(`${BASE_URL}/payments/create-order`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ orderId }),
    }).then(handleResponse),

  // POST /api/payments/verify  (authenticated)
  verifyPayment: (payload) =>
    fetch(`${BASE_URL}/payments/verify`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(payload),
    }).then(handleResponse),

  // ── Uploads (owner only) ──────────────────────────────────────────────────
  // POST /api/upload/single  — multipart/form-data with field "image"
  uploadImage: (formData) =>
    fetch(`${BASE_URL}/upload/single`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${getToken()}` }, // no Content-Type: browser sets multipart boundary
      body: formData,
    }).then(handleResponse),

  // DELETE /api/upload/:publicId  (owner only)
  deleteImage: (publicId) =>
    fetch(`${BASE_URL}/upload/${encodeURIComponent(publicId)}`, {
      method: 'DELETE',
      headers: noBodyAuthHeaders(),
    }).then(handleResponse),
};

export default api;

