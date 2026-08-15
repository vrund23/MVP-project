import React, { useState, useEffect } from 'react';
import { api } from '../api';

export default function CustomerView({ user }) {
  const [activeTab, setActiveTab] = useState('collection');
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [userOrders, setUserOrders] = useState([]);
  const [userBespoke, setUserBespoke] = useState([]);
  const [loading, setLoading] = useState(false);

  // Bespoke form state
  const [flavor, setFlavor] = useState('');
  const [tiers, setTiers] = useState(1);
  const [weightKg, setWeightKg] = useState(1);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (['collection', 'artisanal', 'heritage'].includes(activeTab)) {
      setLoading(true);
      api.getProducts(activeTab)
        .then(setProducts)
        .catch(console.error)
        .finally(() => setLoading(false));
    } else if (activeTab === 'profile') {
      loadProfileData();
    }
  }, [activeTab]);

  const loadProfileData = () => {
    setLoading(true);
    Promise.all([
      api.getUserOrders(user.email),
      api.getUserBespoke(user.email)
    ])
      .then(([orders, bespoke]) => {
        setUserOrders(orders);
        setUserBespoke(bespoke);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  const handleAddToCart = (product) => {
    setCart((prev) => [...prev, product]);
  };

  const handleRemoveFromCart = (index) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    const totalAmount = cart.reduce((sum, item) => sum + item.price, 0);

    try {
      await api.createOrder({
        customerEmail: user.email,
        items: cart,
        totalAmount
      });
      alert('Order Placed Successfully!');
      setCart([]);
      setActiveTab('profile');
    } catch (err) {
      alert(`Checkout failed: ${err.message}`);
    }
  };

  const handleBespokeSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.createBespoke({
        customerEmail: user.email,
        flavor,
        tiers: Number(tiers),
        weightKg: Number(weightKg),
        notes
      });
      alert('Bespoke custom inquiry sent to owner!');
      setFlavor('');
      setNotes('');
      setActiveTab('profile');
    } catch (err) {
      alert(`Submission failed: ${err.message}`);
    }
  };

  return (
    <div>
      {/* Category Navigation Bar */}
      <nav style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '10px',
        padding: '14px 20px',
        background: '#ffffff',
        borderBottom: '1px solid #e8e2de',
        flexWrap: 'wrap'
      }}>
        {[
          { id: 'collection', label: 'Signature Collection' },
          { id: 'artisanal', label: 'Artisanal Chocolates' },
          { id: 'heritage', label: 'Heritage Recipes' },
          { id: 'bespoke', label: 'Custom Bespoke Cakes' },
          { id: 'cart', label: `Cart (${cart.length})` },
          { id: 'profile', label: 'My Orders & Quotes' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              background: activeTab === tab.id ? '#3e2723' : '#fff',
              color: activeTab === tab.id ? '#fff' : '#3e2723',
              border: '1px solid #3e2723',
              padding: '8px 16px',
              borderRadius: '20px',
              cursor: 'pointer',
              fontWeight: activeTab === tab.id ? 'bold' : 'normal',
              fontSize: '13px'
            }}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Main Body */}
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '30px 20px' }}>
        {/* Catalog Categories */}
        {['collection', 'artisanal', 'heritage'].includes(activeTab) && (
          <div>
            <h2 style={{ textTransform: 'capitalize', color: '#2b1712', marginBottom: '4px' }}>
              {activeTab} Page
            </h2>
            <p style={{ color: '#7a5a50', marginBottom: '20px', fontSize: '14px' }}>
              Select items baked with single-origin cocoa and premium dairy.
            </p>

            {loading ? (
              <p>Loading items...</p>
            ) : products.length === 0 ? (
              <p>No products added in this category yet.</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '20px' }}>
                {products.map((prod) => (
                  <div
                    key={prod._id}
                    style={{
                      background: '#fff',
                      padding: '20px',
                      borderRadius: '10px',
                      border: '1px solid #e8e2de',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div>
                      <h3 style={{ margin: '0 0 8px', color: '#2b1712' }}>{prod.title}</h3>
                      <p style={{ color: '#8d6e63', fontSize: '13px', margin: '0 0 16px' }}>
                        In Stock: {prod.stock} units
                      </p>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#b71c1c' }}>₹{prod.price}</span>
                      <button
                        onClick={() => handleAddToCart(prod)}
                        style={{
                          background: '#3e2723',
                          color: '#fff',
                          border: 'none',
                          padding: '8px 14px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontWeight: '600'
                        }}
                      >
                        Add to Cart
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Bespoke Engine */}
        {activeTab === 'bespoke' && (
          <div style={{ background: '#fff', padding: '30px', borderRadius: '10px', border: '1px solid #e8e2de' }}>
            <h2 style={{ color: '#2b1712', margin: '0 0 6px' }}>Request a Custom Bespoke Cake</h2>
            <p style={{ color: '#7a5a50', margin: '0 0 20px', fontSize: '14px' }}>
              Submit your desired specifications. The bakery owner will review and quote a price.
            </p>

            <form onSubmit={handleBespokeSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxWidth: '480px' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 'bold', fontSize: '13px', marginBottom: '4px' }}>Flavor</label>
                <input
                  required
                  placeholder="e.g. Belgian Dark Truffle"
                  value={flavor}
                  onChange={(e) => setFlavor(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontWeight: 'bold', fontSize: '13px', marginBottom: '4px' }}>Tiers</label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={tiers}
                    onChange={(e) => setTiers(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontWeight: 'bold', fontSize: '13px', marginBottom: '4px' }}>Weight (kg)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 'bold', fontSize: '13px', marginBottom: '4px' }}>Design Instructions / Text</label>
                <textarea
                  required
                  rows="4"
                  placeholder="e.g. Golden pearl piping and 'Happy 50th Birthday Mom'"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
                />
              </div>

              <button
                type="submit"
                style={{
                  background: '#3e2723',
                  color: '#fff',
                  padding: '12px',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                Send Request to Owner
              </button>
            </form>
          </div>
        )}

        {/* Shopping Cart */}
        {activeTab === 'cart' && (
          <div style={{ background: '#fff', padding: '30px', borderRadius: '10px', border: '1px solid #e8e2de' }}>
            <h2 style={{ color: '#2b1712', margin: '0 0 16px' }}>Your Shopping Cart</h2>
            {cart.length === 0 ? (
              <p>Your cart is empty.</p>
            ) : (
              <div>
                {cart.map((item, index) => (
                  <div
                    key={index}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px 0',
                      borderBottom: '1px solid #f0f0f0'
                    }}
                  >
                    <div>
                      <strong>{item.title}</strong>
                      <span style={{ marginLeft: '8px', color: '#888', fontSize: '13px' }}>({item.category})</span>
                    </div>
                    <div>
                      <strong style={{ marginRight: '16px' }}>₹{item.price}</strong>
                      <button
                        onClick={() => handleRemoveFromCart(index)}
                        style={{ background: '#ffcdd2', color: '#b71c1c', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}

                <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ margin: 0 }}>
                    Total: ₹{cart.reduce((sum, item) => sum + item.price, 0)}
                  </h3>
                  <button
                    onClick={handleCheckout}
                    style={{
                      background: '#2e7d32',
                      color: '#fff',
                      border: 'none',
                      padding: '12px 24px',
                      borderRadius: '6px',
                      fontWeight: 'bold',
                      cursor: 'pointer'
                    }}
                  >
                    Confirm & Checkout
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Profile with Live Stepper */}
        {activeTab === 'profile' && (
          <div>
            <h2 style={{ color: '#2b1712', marginBottom: '20px' }}>Active Orders & Custom Quotes</h2>

            <h3 style={{ color: '#3e2723', marginBottom: '10px' }}>Standard Orders</h3>
            {userOrders.length === 0 ? (
              <p style={{ color: '#777', marginBottom: '24px' }}>No orders placed yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
                {userOrders.map((ord) => (
                  <div key={ord._id} style={{ background: '#fff', padding: '16px', borderRadius: '8px', border: '1px solid #e0dcd8' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span><strong>Order ID:</strong> {ord._id}</span>
                      <strong style={{ color: '#b71c1c' }}>₹{ord.totalAmount}</strong>
                    </div>
                    <p style={{ fontSize: '13px', color: '#555', margin: '4px 0 10px' }}>
                      Items: {ord.items.map((i) => i.title).join(', ')}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 'bold' }}>Status:</span>
                      <span style={{
                        background: ord.status === 'Delivered' ? '#c8e6c9' : '#fff9c4',
                        color: ord.status === 'Delivered' ? '#2e7d32' : '#f57f17',
                        padding: '3px 10px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}>
                        {ord.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <h3 style={{ color: '#3e2723', marginBottom: '10px' }}>Bespoke Custom Cake Requests</h3>
            {userBespoke.length === 0 ? (
              <p style={{ color: '#777' }}>No custom cake requests submitted.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {userBespoke.map((bes) => (
                  <div key={bes._id} style={{ background: '#fff', padding: '16px', borderRadius: '8px', border: '1px solid #e0dcd8' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <h4>{bes.flavor} ({bes.weightKg} kg, {bes.tiers} Tiers)</h4>
                      <span style={{
                        background: bes.status === 'Pending Quote' ? '#ffe0b2' : '#c8e6c9',
                        color: bes.status === 'Pending Quote' ? '#e65100' : '#2e7d32',
                        padding: '3px 10px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}>
                        {bes.status}
                      </span>
                    </div>
                    <p style={{ margin: '6px 0', fontSize: '13px', color: '#555' }}>Notes: {bes.notes}</p>
                    <p style={{ margin: 0, fontWeight: 'bold' }}>
                      Quoted Price: {bes.quotedPrice > 0 ? `₹${bes.quotedPrice}` : 'Awaiting Quote from Owner'}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}