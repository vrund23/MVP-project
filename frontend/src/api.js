const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const handleResponse = async (res) => {
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Server request failed');
  return data;
};

export const api = {
  // Authentication
  register: (payload) =>
    fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(handleResponse),

  login: (payload) =>
    fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(handleResponse),

  // Products & Catalog
  getProducts: (category) =>
    fetch(`${BASE_URL}/products${category ? `?category=${category}` : ''}`).then(handleResponse),

  createProduct: (payload) =>
    fetch(`${BASE_URL}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(handleResponse),

  deleteProduct: (id) =>
    fetch(`${BASE_URL}/products/${id}`, {
      method: 'DELETE'
    }).then(handleResponse),

  // Orders
  createOrder: (payload) =>
    fetch(`${BASE_URL}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(handleResponse),

  getUserOrders: (email) =>
    fetch(`${BASE_URL}/orders/user/${encodeURIComponent(email)}`).then(handleResponse),

  getAdminOrders: () =>
    fetch(`${BASE_URL}/admin/orders`).then(handleResponse),

  updateOrderStatus: (id, status) =>
    fetch(`${BASE_URL}/admin/orders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    }).then(handleResponse),

  // Bespoke Requests
  createBespoke: (payload) =>
    fetch(`${BASE_URL}/bespoke`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(handleResponse),

  getUserBespoke: (email) =>
    fetch(`${BASE_URL}/bespoke/user/${encodeURIComponent(email)}`).then(handleResponse),

  getAdminBespoke: () =>
    fetch(`${BASE_URL}/admin/bespoke`).then(handleResponse),

  quoteBespoke: (id, quotedPrice, status) =>
    fetch(`${BASE_URL}/admin/bespoke/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quotedPrice, status })
    }).then(handleResponse),

  // CRM
  getCustomers: () =>
    fetch(`${BASE_URL}/admin/customers`).then(handleResponse)
};