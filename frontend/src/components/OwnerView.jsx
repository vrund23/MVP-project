import React, { useState, useEffect } from 'react';
import { api } from '../api';

export default function OwnerView() {
  const [tab, setTab] = useState('orders'); // orders, catalog, bespoke, crm, dashboard
  const [orders, setOrders] = useState([]);
  const [bespokeList, setBespokeList] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);

  // Add Product form state
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('collection');
  const [newPrice, setNewPrice] = useState('');
  const [newStock, setNewStock] = useState(10);

  // Quote input states mapped by bespoke ID
  const [quotes, setQuotes] = useState({});

  useEffect(() => {
    loadTabContent();
  }, [tab]);

  const loadTabContent = () => {
    if (tab === 'orders' || tab === 'dashboard') api.getAdminOrders().then(setOrders).catch(console.error);
    if (tab === 'bespoke' || tab === 'dashboard') api.getAdminBespoke().then(setBespokeList).catch(console.error);
    if (tab === 'catalog' || tab === 'dashboard') api.getProducts().then(setProducts).catch(console.error);
    if (tab === 'crm') api.getCustomers().then(setCustomers).catch(console.error);
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      await api.updateOrderStatus(orderId, newStatus);
      api.getAdminOrders().then(setOrders);
    } catch (err) {
      alert(`Status update failed: ${err.message}`);
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      await api.createProduct({
        title: newTitle,
        category: newCategory,
        price: Number(newPrice),
        stock: Number(newStock)
      });
      alert('Product successfully added to catalog!');
      setNewTitle('');
      setNewPrice('');
      api.getProducts().then(setProducts);
    } catch (err) {
      alert(`Failed to add product: ${err.message}`);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Delete this product from catalog?')) return;
    try {
      await api.deleteProduct(id);
      api.getProducts().then(setProducts);
    } catch (err) {
      alert(`Failed to delete product: ${err.message}`);
    }
  };

  const handleSendQuote = async (id) => {
    const quoteVal = quotes[id];
    if (!quoteVal || quoteVal <= 0) return alert('Enter a valid price quote.');

    try {
      await api.quoteBespoke(id, Number(quoteVal), 'Price Quoted');
      alert('Quote updated for customer!');
      api.getAdminBespoke().then(setBespokeList);
    } catch (err) {
      alert(`Failed to save quote: ${err.message}`);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: 'calc(100vh - 65px)' }}>
      {/* Owner Sidebar Navigation */}
      <aside style={{ width: '240px', background: '#3e2723', color: '#fff', padding: '24px 16px' }}>
        <h3 style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '20px', color: '#d7ccc8' }}>
          Owner Controls
        </h3>
        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[
            { id: 'dashboard', label: '📊 Dashboard Overview' },
            { id: 'orders', label: '🚚 Live Order Tracker' },
            { id: 'catalog', label: '🍰 Catalog Manager' },
            { id: 'bespoke', label: '🎂 Bespoke Inquiries' },
            { id: 'crm', label: '👥 Customer CRM' }
          ].map((item) => (
            <li
              key={item.id}
              onClick={() => setTab(item.id)}
              style={{
                padding: '10px 14px',
                borderRadius: '6px',
                cursor: 'pointer',
                background: tab === item.id ? '#5d4037' : 'transparent',
                fontWeight: tab === item.id ? 'bold' : 'normal',
                fontSize: '14px'
              }}
            >
              {item.label}
            </li>
          ))}
        </ul>
      </aside>

      {/* Content Space */}
      <main style={{ flex: 1, padding: '30px' }}>
        {/* Dashboard */}
        {tab === 'dashboard' && (
          <div>
            <h2 style={{ color: '#2b1712', marginBottom: '20px' }}>Bakery Dashboard Overview</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
              <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #ddd' }}>
                <span style={{ color: '#777', fontSize: '13px' }}>Total Customer Orders</span>
                <h3 style={{ fontSize: '28px', margin: '8px 0', color: '#2b1712' }}>{orders.length}</h3>
              </div>
              <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #ddd' }}>
                <span style={{ color: '#777', fontSize: '13px' }}>Pending Bespoke Inquiries</span>
                <h3 style={{ fontSize: '28px', margin: '8px 0', color: '#e65100' }}>
                  {bespokeList.filter((b) => b.status === 'Pending Quote').length}
                </h3>
              </div>
              <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #ddd' }}>
                <span style={{ color: '#777', fontSize: '13px' }}>Active Catalog Products</span>
                <h3 style={{ fontSize: '28px', margin: '8px 0', color: '#2e7d32' }}>{products.length}</h3>
              </div>
            </div>
          </div>
        )}

        {/* Live Order Tracker */}
        {tab === 'orders' && (
          <div>
            <h2 style={{ color: '#2b1712', marginBottom: '20px' }}>Live Order Tracker</h2>
            {orders.length === 0 ? (
              <p>No customer orders placed yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {orders.map((ord) => (
                  <div key={ord._id} style={{ background: '#fff', padding: '18px', borderRadius: '8px', border: '1px solid #ddd' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <div>
                        <strong>Customer:</strong> {ord.customerEmail} <br />
                        <small style={{ color: '#777' }}>ID: {ord._id}</small>
                      </div>
                      <strong style={{ fontSize: '18px', color: '#b71c1c' }}>₹{ord.totalAmount}</strong>
                    </div>
                    <p style={{ margin: '8px 0', fontSize: '14px' }}>
                      <strong>Items:</strong> {ord.items.map((i) => `${i.title} (₹${i.price})`).join(', ')}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '14px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 'bold' }}>Update State:</span>
                      {['Placed', 'Baking', 'Out for Delivery', 'Delivered'].map((st) => (
                        <button
                          key={st}
                          onClick={() => handleUpdateOrderStatus(ord._id, st)}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '4px',
                            border: '1px solid #5d4037',
                            background: ord.status === st ? '#5d4037' : '#fff',
                            color: ord.status === st ? '#fff' : '#5d4037',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          {st}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Catalog Manager */}
        {tab === 'catalog' && (
          <div>
            <h2 style={{ color: '#2b1712', marginBottom: '20px' }}>Catalog Manager</h2>

            <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #ddd', marginBottom: '24px' }}>
              <h3 style={{ margin: '0 0 12px', fontSize: '16px' }}>Add New Product</h3>
              <form onSubmit={handleAddProduct} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <input
                  required
                  placeholder="Product Title"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc', flex: '2' }}
                />
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc', flex: '1' }}
                >
                  <option value="collection">Collection</option>
                  <option value="artisanal">Artisanal</option>
                  <option value="heritage">Heritage</option>
                </select>
                <input
                  type="number"
                  required
                  placeholder="Price (₹)"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc', width: '100px' }}
                />
                <input
                  type="number"
                  required
                  placeholder="Stock"
                  value={newStock}
                  onChange={(e) => setNewStock(e.target.value)}
                  style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc', width: '80px' }}
                />
                <button
                  type="submit"
                  style={{ background: '#2e7d32', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  + Add Item
                </button>
              </form>
            </div>

            <table style={{ width: '100%', background: '#fff', borderCollapse: 'collapse', borderRadius: '8px', overflow: 'hidden' }}>
              <thead>
                <tr style={{ background: '#efebe9', textAlign: 'left' }}>
                  <th style={{ padding: '12px' }}>Title</th>
                  <th style={{ padding: '12px' }}>Category</th>
                  <th style={{ padding: '12px' }}>Price</th>
                  <th style={{ padding: '12px' }}>Stock</th>
                  <th style={{ padding: '12px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p._id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '12px' }}>{p.title}</td>
                    <td style={{ padding: '12px', textTransform: 'capitalize' }}>{p.category}</td>
                    <td style={{ padding: '12px' }}>₹{p.price}</td>
                    <td style={{ padding: '12px' }}>{p.stock}</td>
                    <td style={{ padding: '12px' }}>
                      <button
                        onClick={() => handleDeleteProduct(p._id)}
                        style={{ background: '#ffcdd2', color: '#b71c1c', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Bespoke Quoting */}
        {tab === 'bespoke' && (
          <div>
            <h2 style={{ color: '#2b1712', marginBottom: '20px' }}>Custom Bespoke Cake Inquiries</h2>
            {bespokeList.length === 0 ? (
              <p>No bespoke inquiries submitted.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {bespokeList.map((req) => (
                  <div key={req._id} style={{ background: '#fff', padding: '18px', borderRadius: '8px', border: '1px solid #ddd' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <h4>{req.customerEmail}</h4>
                      <span>Status: <strong>{req.status}</strong></span>
                    </div>
                    <p style={{ margin: '6px 0', fontSize: '14px' }}>
                      <strong>Details:</strong> {req.flavor} | {req.tiers} Tiers | {req.weightKg} kg
                    </p>
                    <p style={{ margin: '6px 0', color: '#555', fontSize: '13px' }}>
                      <strong>Notes:</strong> {req.notes}
                    </p>

                    <div style={{ marginTop: '14px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <label style={{ fontSize: '13px', fontWeight: 'bold' }}>Quote Price (₹):</label>
                      <input
                        type="number"
                        placeholder="e.g. 2500"
                        defaultValue={req.quotedPrice || ''}
                        onChange={(e) => setQuotes({ ...quotes, [req._id]: e.target.value })}
                        style={{ padding: '6px', borderRadius: '4px', border: '1px solid #ccc', width: '120px' }}
                      />
                      <button
                        onClick={() => handleSendQuote(req._id)}
                        style={{ background: '#2e7d32', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                      >
                        Save & Send Quote
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* CRM */}
        {tab === 'crm' && (
          <div>
            <h2 style={{ color: '#2b1712', marginBottom: '20px' }}>Registered Customers (CRM)</h2>
            <table style={{ width: '100%', background: '#fff', borderCollapse: 'collapse', borderRadius: '8px', overflow: 'hidden' }}>
              <thead>
                <tr style={{ background: '#efebe9', textAlign: 'left' }}>
                  <th style={{ padding: '12px' }}>Customer Name</th>
                  <th style={{ padding: '12px' }}>Email Address</th>
                  <th style={{ padding: '12px' }}>Joined Date</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c._id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '12px' }}>{c.name}</td>
                    <td style={{ padding: '12px' }}>{c.email}</td>
                    <td style={{ padding: '12px' }}>{new Date(c.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}