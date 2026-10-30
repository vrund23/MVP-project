import { useState, useEffect, useCallback } from 'react';
import api from '../api';

// ─── Brand Tokens ────────────────────────────────────────────────────────────
const C = {
  canvas:     '#FAF7F2',
  dark:       '#2B1E16',
  darkAlt:    '#3B2820',
  cta:        '#C86A28',
  gold:       '#D4AF37',
  goldMuted:  '#CBB279',
  muted:      '#8A7060',
  cardBg:     '#FFFFFF',
  border:     '#E8DDD5',
  cream:      '#FDFAF7',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
const categoryEmoji = { cakes: '🍰', chocolates: '🍫', hampers: '🎁' };

const STATUS_META = {
  placed:            { label: 'Order Placed',          bg: '#FFF9C4', color: '#F57F17' },
  confirmed:         { label: 'Confirmed',              bg: '#E3F2FD', color: '#1565C0' },
  in_kitchen:        { label: 'In Kitchen 🍳',          bg: '#FFF3E0', color: '#E65100' },
  ready_for_pickup:  { label: 'Ready for Pickup 📦',   bg: '#E8F5E9', color: '#2E7D32' },
  out_for_delivery:  { label: 'Out for Delivery 🚚',   bg: '#E0F7FA', color: '#00695C' },
  delivered:         { label: 'Delivered ✅',           bg: '#E8F5E9', color: '#1B5E20' },
  cancelled:         { label: 'Cancelled',              bg: '#FFEBEE', color: '#B71C1C' },
};

const TIME_SLOTS = [
  { value: 'morning_10_13',  label: 'Morning (10 AM – 1 PM)' },
  { value: 'afternoon_14_17',label: 'Afternoon (2 PM – 5 PM)' },
  { value: 'evening_18_21',  label: 'Evening (6 PM – 9 PM)' },
];

const today = new Date().toISOString().split('T')[0];

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function fmtOrderId(id) {
  return id ? `#${String(id).slice(-8).toUpperCase()}` : '';
}

// ─── ProductCard ──────────────────────────────────────────────────────────────
function ProductCard({ product, onAddToCart }) {
  const [selIdx, setSelIdx] = useState(0);
  const variant = product.variants[selIdx] || product.variants[0];
  const outOfStock = !variant || variant.stock < 1;

  return (
    <div style={{
      background: C.cardBg,
      borderRadius: 16,
      border: `1px solid ${C.border}`,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '0 2px 8px rgba(43,30,22,0.07)',
      transition: 'box-shadow 0.2s',
    }}>
      {/* Image */}
      <div style={{ position: 'relative', height: 220, width: '100%', overflow: 'hidden', backgroundColor: '#F3ECE3', flexShrink: 0 }}>
        {variant?.imageUrl ? (
          <img
            src={variant.imageUrl}
            alt={product.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', display: 'block' }}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 64 }}>
            {categoryEmoji[product.category] || '🛍️'}
          </div>
        )}
        {/* Badge */}
        {product.badge && (
          <span style={{
            position: 'absolute', top: 10, left: 10,
            background: C.gold, color: C.dark,
            fontSize: 11, fontWeight: 700, padding: '3px 10px',
            borderRadius: 999, letterSpacing: 0.3,
          }}>{product.badge}</span>
        )}
        {/* Lead time */}
        {product.leadTimeHours > 0 && (
          <span style={{
            position: 'absolute', top: 10, right: 10,
            background: '#FFF3E0', color: C.cta,
            fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 999,
          }}>⏱ {product.leadTimeHours}h prep</span>
        )}
        {/* Out of stock overlay */}
        {outOfStock && (
          <div style={{
            position: 'absolute', inset: 0,
            background: 'rgba(43,30,22,0.55)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ color: '#fff', fontWeight: 700, fontSize: 16, letterSpacing: 1 }}>Out of Stock</span>
          </div>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
        {/* Title */}
        <div style={{ fontWeight: 700, fontSize: 15, color: C.dark, lineHeight: 1.3 }}>{product.title}</div>

        {/* Description */}
        <div style={{
          fontSize: 13, color: C.muted, lineHeight: 1.5,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>{product.description}</div>

        {/* Dietary tags */}
        {product.dietaryTags?.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {product.dietaryTags.map(tag => (
              <span key={tag} style={{
                background: '#E8F5E9', color: '#2E7D32',
                fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 999,
              }}>{tag}</span>
            ))}
          </div>
        )}

        {/* Variant selector */}
        {product.variants.length > 1 && (
          <select
            value={selIdx}
            onChange={e => setSelIdx(Number(e.target.value))}
            style={{
              width: '100%', padding: '7px 10px', borderRadius: 8,
              border: `1px solid ${C.border}`, background: C.canvas,
              color: C.dark, fontSize: 13, cursor: 'pointer', outline: 'none',
            }}
          >
            {product.variants.map((v, i) => (
              <option key={v.variantId} value={i}>{v.label} · {v.weight}</option>
            ))}
          </select>
        )}

        {/* Price row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
          <span style={{ fontSize: 20, fontWeight: 800, color: C.cta }}>₹{variant?.price ?? '—'}</span>
          {variant && variant.stock > 0 && variant.stock <= 5 && (
            <span style={{ fontSize: 12, color: '#E65100', fontWeight: 600 }}>Only {variant.stock} left!</span>
          )}
          {variant && variant.stock > 5 && (
            <span style={{ fontSize: 12, color: C.muted }}>In stock</span>
          )}
        </div>

        {/* Add to Cart */}
        <button
          disabled={outOfStock}
          onClick={() => !outOfStock && onAddToCart(product, selIdx)}
          style={{
            marginTop: 'auto',
            background: outOfStock ? '#D0C8C0' : C.cta,
            color: '#fff',
            border: 'none', borderRadius: 10,
            padding: '10px 0', fontWeight: 700, fontSize: 14,
            cursor: outOfStock ? 'not-allowed' : 'pointer',
            width: '100%', letterSpacing: 0.3,
            transition: 'opacity 0.15s',
          }}
        >{outOfStock ? 'Sold Out' : 'Add to Cart'}</button>
      </div>
    </div>
  );
}

// ─── CheckoutSuccess ──────────────────────────────────────────────────────────
function CheckoutSuccess({ order, onViewOrders }) {
  return (
    <div style={{
      background: '#F1FFF6', border: '1.5px solid #A5D6A7',
      borderRadius: 16, padding: 32, textAlign: 'center',
      display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'center',
    }}>
      <div style={{ fontSize: 48 }}>🎉</div>
      <div style={{ fontWeight: 800, fontSize: 20, color: '#1B5E20' }}>Order Placed Successfully!</div>
      <div style={{ fontSize: 15, color: '#2E7D32' }}>
        Your order <strong>{fmtOrderId(order._id)}</strong> has been received.
      </div>
      <div style={{ fontSize: 13, color: C.muted }}>We'll confirm it shortly and keep you updated.</div>
      <button
        onClick={onViewOrders}
        style={{
          background: C.cta, color: '#fff', border: 'none',
          borderRadius: 10, padding: '10px 28px',
          fontWeight: 700, fontSize: 14, cursor: 'pointer', marginTop: 8,
        }}
      >📋 View My Orders</button>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function CustomerView({ user }) {
  const [activeTab, setActiveTab] = useState('cakes');

  // Products
  const [products, setProducts]     = useState([]);
  const [prodLoading, setProdLoading] = useState(false);
  const [prodError, setProdError]   = useState('');

  // Cart
  const [cart, setCart] = useState([]);

  // Orders
  const [orders, setOrders]         = useState([]);
  const [ordLoading, setOrdLoading] = useState(false);

  // Checkout form state
  const [fulfillMethod, setFulfillMethod]   = useState('delivery');
  const [deliveryDate,  setDeliveryDate]    = useState('');
  const [timeSlot,      setTimeSlot]        = useState('');
  const [cakeMessage,   setCakeMessage]     = useState('');
  const [greetingNote,  setGreetingNote]    = useState('');
  const [dietaryNote,   setDietaryNote]     = useState('');
  const [recipientName, setRecipientName]   = useState('');
  const [recipientPhone,setRecipientPhone]  = useState('');
  const [street,        setStreet]          = useState('');
  const [city,          setCity]            = useState('');
  const [pincode,       setPincode]         = useState('');
  const [paymentMethod, setPaymentMethod]   = useState('cod');
  const [checkoutError, setCheckoutError]   = useState('');
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [placedOrder,   setPlacedOrder]     = useState(null);

  // ── Fetch products ──────────────────────────────────────────────────────────
  const fetchProducts = useCallback(async (category) => {
    setProdLoading(true);
    setProdError('');
    try {
      const res = await api.getProducts({ category });
      if (res.success) setProducts(res.data || []);
      else setProdError(res.message || 'Failed to load products.');
    } catch (e) {
      setProdError('Could not reach the server. Please try again.');
    } finally {
      setProdLoading(false);
    }
  }, []);

  useEffect(() => {
    if (['cakes', 'chocolates', 'hampers'].includes(activeTab)) {
      fetchProducts(activeTab);
    }
  }, [activeTab, fetchProducts]);

  // ── Fetch orders ────────────────────────────────────────────────────────────
  const fetchOrders = useCallback(async () => {
    setOrdLoading(true);
    try {
      const res = await api.getMyOrders();
      if (res.success) setOrders(res.data || []);
    } catch (e) {
      // silent
    } finally {
      setOrdLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'orders') fetchOrders();
  }, [activeTab, fetchOrders]);

  // ── Cart helpers ────────────────────────────────────────────────────────────
  const handleAddToCart = (product, variantIdx) => {
    const variant = product.variants[variantIdx];
    setCart(prev => {
      const idx = prev.findIndex(
        item => item.productId === product._id && item.variantId === variant.variantId
      );
      if (idx !== -1) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], quantity: updated[idx].quantity + 1 };
        return updated;
      }
      return [...prev, {
        productId:    product._id,
        variantId:    variant.variantId,
        title:        product.title,
        variantLabel: variant.label,
        weight:       variant.weight,
        price:        variant.price,
        quantity:     1,
        imageUrl:     variant.imageUrl || '',
      }];
    });
  };

  const changeQty = (idx, delta) => {
    setCart(prev => {
      const updated = [...prev];
      const newQty = updated[idx].quantity + delta;
      if (newQty <= 0) {
        return updated.filter((_, i) => i !== idx);
      }
      updated[idx] = { ...updated[idx], quantity: newQty };
      return updated;
    });
  };

  const removeItem = (idx) => setCart(prev => prev.filter((_, i) => i !== idx));

  const itemsTotal  = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const deliveryFee = fulfillMethod === 'delivery' ? 50 : 0;
  const grandTotal  = itemsTotal + deliveryFee;
  const cartCount   = cart.reduce((s, i) => s + i.quantity, 0);

  // ── Form reset helper ────────────────────────────────────────────────────────
  const resetCheckoutForm = () => {
    setDeliveryDate(''); setTimeSlot(''); setCakeMessage('');
    setGreetingNote(''); setDietaryNote(''); setRecipientName('');
    setRecipientPhone(''); setStreet(''); setCity(''); setPincode('');
    setPaymentMethod('cod');
  };

  // ── Build order payload ─────────────────────────────────────────────────────
  const buildOrderPayload = () => ({
    items: cart.map(item => ({
      productId: item.productId,
      variantId: item.variantId,
      quantity:  item.quantity,
    })),
    customizations: {
      cakeMessage:          cakeMessage.trim(),
      greetingCardMessage:  greetingNote.trim(),
      dietaryNote:          dietaryNote.trim(),
    },
    fulfillment: {
      method:       fulfillMethod,
      deliveryDate: new Date(deliveryDate).toISOString(),
      timeSlot,
      shippingAddress: fulfillMethod === 'delivery' ? {
        recipientName:  recipientName.trim(),
        recipientPhone: recipientPhone.trim(),
        street:         street.trim(),
        city:           city.trim(),
        pincode:        pincode.trim(),
      } : undefined,
    },
    paymentMethod,
  });

  // ── Razorpay checkout modal ─────────────────────────────────────────────────
  const openRazorpayCheckout = (rzpData, internalOrder) => {
    return new Promise((resolve, reject) => {
      const options = {
        key:         rzpData.keyId,
        amount:      rzpData.amount,
        currency:    rzpData.currency,
        order_id:    rzpData.razorpayOrderId,
        name:        'M Chocolates & Cakes',
        description: `Order ${fmtOrderId(internalOrder._id)}`,
        image:       '',
        prefill: {
          name:    user?.name  || '',
          email:   user?.email || '',
        },
        theme: { color: '#C86A28' },
        handler: (response) => {
          // Payment successful — response contains razorpay_payment_id, razorpay_order_id, razorpay_signature
          resolve(response);
        },
        modal: {
          ondismiss: () => {
            reject(new Error('Payment cancelled. Your order is saved — you can retry payment from My Orders.'));
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (resp) => {
        reject(new Error(resp.error?.description || 'Payment failed. Please try again.'));
      });
      rzp.open();
    });
  };

  // ── Place order (COD or Online) ─────────────────────────────────────────────
  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setCheckoutError('');

    if (cart.length === 0) { setCheckoutError('Your cart is empty.'); return; }
    if (!deliveryDate)     { setCheckoutError('Please select a delivery/pickup date.'); return; }
    if (!timeSlot)         { setCheckoutError('Please select a time slot.'); return; }
    if (fulfillMethod === 'delivery') {
      if (!recipientName || !recipientPhone || !street || !city || !pincode) {
        setCheckoutError('Please fill in all delivery address fields.'); return;
      }
    }

    const payload = buildOrderPayload();
    setCheckoutLoading(true);

    try {
      // Step 1: Create the order on backend (stock is atomically decremented here)
      const orderRes = await api.createOrder(payload);
      if (!orderRes.success) {
        setCheckoutError(orderRes.message || 'Order failed. Please try again.');
        return;
      }

      const createdOrder = orderRes.data;

      // ── COD Flow: order is done ─────────────────────────────────────────
      if (paymentMethod === 'cod') {
        setPlacedOrder(createdOrder);
        setCart([]);
        resetCheckoutForm();
        return;
      }

      // ── Online Payment Flow (Razorpay) ──────────────────────────────────
      // Step 2: Create Razorpay gateway order
      const rzpRes = await api.createRazorpayOrder(createdOrder._id);
      if (!rzpRes.success) {
        setCheckoutError(rzpRes.message || 'Could not initiate payment gateway. Please try again.');
        return;
      }

      // Step 3: Open Razorpay checkout modal
      const rzpResponse = await openRazorpayCheckout(rzpRes.data, createdOrder);

      // Step 4: Verify payment signature with backend
      const verifyRes = await api.verifyPayment({
        internalOrderId:    createdOrder._id,
        razorpay_order_id:  rzpResponse.razorpay_order_id,
        razorpay_payment_id: rzpResponse.razorpay_payment_id,
        razorpay_signature: rzpResponse.razorpay_signature,
      });

      if (verifyRes.success) {
        setPlacedOrder(verifyRes.data);
        setCart([]);
        resetCheckoutForm();
      } else {
        setCheckoutError(verifyRes.message || 'Payment verification failed. Contact support.');
      }
    } catch (err) {
      setCheckoutError(err?.message || 'Order failed. Please try again.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  // ── Cancel order ────────────────────────────────────────────────────────────
  const handleCancelOrder = async (orderId) => {
    try {
      const res = await api.cancelOrder(orderId, 'Cancelled by customer');
      if (res.success) {
        setOrders(prev => prev.map(o => o._id === orderId ? res.data : o));
      }
    } catch (e) {
      // silent
    }
  };

  // ── Styles ──────────────────────────────────────────────────────────────────
  const tabBarStyle = {
    position: 'sticky', top: 0, zIndex: 100,
    background: C.canvas, borderBottom: `1px solid ${C.border}`,
    display: 'flex', gap: 8, padding: '12px 24px',
    overflowX: 'auto',
  };

  const tabStyle = (id) => ({
    padding: '8px 18px', borderRadius: 999, fontSize: 14, fontWeight: 600,
    cursor: 'pointer', whiteSpace: 'nowrap', letterSpacing: 0.2,
    border: activeTab === id ? 'none' : `1.5px solid ${C.border}`,
    background:  activeTab === id ? C.dark   : 'transparent',
    color:       activeTab === id ? '#fff'   : C.darkAlt,
    transition:  'all 0.18s',
    display: 'flex', alignItems: 'center', gap: 6,
  });

  const inputStyle = {
    width: '100%', padding: '9px 12px', borderRadius: 8, fontSize: 14,
    border: `1px solid ${C.border}`, background: '#fff', color: C.dark,
    outline: 'none', boxSizing: 'border-box',
  };

  const labelStyle = {
    fontSize: 13, fontWeight: 600, color: C.dark, marginBottom: 4, display: 'block',
  };

  const sectionLabelStyle = {
    fontSize: 13, fontWeight: 700, color: C.gold,
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8,
  };

  const pillToggleStyle = (active) => ({
    padding: '8px 18px', borderRadius: 999, fontSize: 13, fontWeight: 600,
    cursor: 'pointer',
    border: `1.5px solid ${active ? C.cta : C.border}`,
    background: active ? '#FFF3E0' : 'transparent',
    color: active ? C.cta : C.muted,
    transition: 'all 0.15s',
  });

  // ─── Render ─────────────────────────────────────────────────────────────────
  const tabs = [
    { id: 'cakes',      label: '🍰 Cakes' },
    { id: 'chocolates', label: '🍫 Chocolates' },
    { id: 'hampers',    label: '🎁 Hampers' },
    { id: 'cart',       label: null },
    { id: 'orders',     label: '📋 My Orders' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: C.canvas, fontFamily: "'Segoe UI', system-ui, sans-serif" }}>

      {/* ── Navigation ── */}
      <div style={tabBarStyle}>
        {tabs.map(tab => {
          if (tab.id === 'cart') {
            return (
              <button key="cart" onClick={() => setActiveTab('cart')} style={tabStyle('cart')}>
                🛒 Cart
                {cartCount > 0 && (
                  <span style={{
                    background: C.cta, color: '#fff',
                    fontSize: 11, fontWeight: 800,
                    borderRadius: 999, minWidth: 20, height: 20,
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    padding: '0 5px',
                  }}>{cartCount}</span>
                )}
              </button>
            );
          }
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={tabStyle(tab.id)}>
              {tab.label}
            </button>
          );
        })}

        {/* Greeting */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', fontSize: 13, color: C.muted, whiteSpace: 'nowrap' }}>
          👋 {user?.name || 'Guest'}
        </div>
      </div>

      {/* ── Page Content ── */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '28px 20px 60px' }}>

        {/* ══ PRODUCT TABS ══ */}
        {['cakes', 'chocolates', 'hampers'].includes(activeTab) && (
          <div>
            <h2 style={{ color: C.dark, fontWeight: 800, fontSize: 22, marginBottom: 20 }}>
              {categoryEmoji[activeTab]} {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
            </h2>

            {prodLoading && (
              <div style={{ textAlign: 'center', padding: 60, color: C.muted, fontSize: 16 }}>
                Loading delicious treats…
              </div>
            )}

            {!prodLoading && prodError && (
              <div style={{ background: '#FFEBEE', color: '#B71C1C', borderRadius: 10, padding: '14px 18px', marginBottom: 20 }}>
                {prodError}
              </div>
            )}

            {!prodLoading && !prodError && products.length === 0 && (
              <div style={{ textAlign: 'center', padding: 80, color: C.muted }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>{categoryEmoji[activeTab]}</div>
                <div style={{ fontSize: 16, fontWeight: 600 }}>No products available right now.</div>
                <div style={{ fontSize: 13, marginTop: 6 }}>Check back soon!</div>
              </div>
            )}

            {!prodLoading && products.length > 0 && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: 24,
              }}>
                {products.map(product => (
                  <ProductCard
                    key={product._id}
                    product={product}
                    onAddToCart={handleAddToCart}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══ CART TAB ══ */}
        {activeTab === 'cart' && (
          <div>
            <h2 style={{ color: C.dark, fontWeight: 800, fontSize: 22, marginBottom: 20 }}>🛒 Your Cart</h2>

            {cart.length === 0 && !placedOrder && (
              <div style={{ textAlign: 'center', padding: 80, color: C.muted }}>
                <div style={{ fontSize: 56, marginBottom: 14 }}>🛒</div>
                <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Your cart is empty</div>
                <div style={{ fontSize: 13, marginBottom: 20 }}>Browse our delicious selection and add something sweet!</div>
                <button
                  onClick={() => setActiveTab('cakes')}
                  style={{ background: C.cta, color: '#fff', border: 'none', borderRadius: 10, padding: '10px 28px', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}
                >
                  🍰 Browse Cakes
                </button>
              </div>
            )}

            {placedOrder && cart.length === 0 && (
              <CheckoutSuccess order={placedOrder} onViewOrders={() => { setPlacedOrder(null); setActiveTab('orders'); }} />
            )}

            {cart.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.4fr) minmax(0,1fr)', gap: 28, alignItems: 'start' }}>

                {/* Left — Cart Items */}
                <div style={{ background: C.cardBg, borderRadius: 16, border: `1px solid ${C.border}`, overflow: 'hidden' }}>
                  <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.border}`, fontWeight: 700, fontSize: 15, color: C.dark }}>
                    {cartCount} item{cartCount !== 1 ? 's' : ''}
                  </div>
                  {cart.map((item, idx) => (
                    <div
                      key={`${item.productId}-${item.variantId}`}
                      style={{
                        display: 'flex', gap: 14, alignItems: 'center',
                        padding: '14px 20px',
                        borderBottom: idx < cart.length - 1 ? `1px solid ${C.border}` : 'none',
                      }}
                    >
                      {/* Thumbnail */}
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.title}
                          style={{ width: 60, height: 60, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
                      ) : (
                        <div style={{ width: 60, height: 60, borderRadius: 8, background: '#F3EDE5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, flexShrink: 0 }}>
                          🍫
                        </div>
                      )}

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 14, color: C.dark, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.title}</div>
                        <div style={{ fontSize: 12, color: C.muted }}>{item.variantLabel} · {item.weight}</div>
                        <div style={{ fontSize: 13, color: C.cta, fontWeight: 700, marginTop: 2 }}>₹{item.price}</div>
                      </div>

                      {/* Qty Controls */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                        <button onClick={() => changeQty(idx, -1)}
                          style={{ width: 28, height: 28, borderRadius: 8, border: `1px solid ${C.border}`, background: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: 16, color: C.dark, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                        <span style={{ fontWeight: 700, fontSize: 14, minWidth: 20, textAlign: 'center' }}>{item.quantity}</span>
                        <button onClick={() => changeQty(idx, +1)}
                          style={{ width: 28, height: 28, borderRadius: 8, border: `1px solid ${C.border}`, background: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: 16, color: C.dark, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                      </div>

                      {/* Subtotal */}
                      <div style={{ fontWeight: 800, fontSize: 14, color: C.dark, minWidth: 56, textAlign: 'right' }}>
                        ₹{item.price * item.quantity}
                      </div>

                      {/* Remove */}
                      <button onClick={() => removeItem(idx)}
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: C.muted, fontSize: 18, padding: 4, lineHeight: 1, flexShrink: 0 }}>✕</button>
                    </div>
                  ))}
                </div>

                {/* Right — Checkout Panel */}
                <div style={{ background: C.cardBg, borderRadius: 16, border: `1px solid ${C.border}`, padding: 24, position: 'sticky', top: 76 }}>
                  <div style={{ fontWeight: 800, fontSize: 17, color: C.dark, marginBottom: 20 }}>Complete Your Order</div>

                  {checkoutError && (
                    <div style={{ background: '#FFEBEE', color: '#B71C1C', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, fontWeight: 500 }}>
                      ⚠️ {checkoutError}
                    </div>
                  )}

                  <form onSubmit={handlePlaceOrder} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

                    {/* Fulfillment toggle */}
                    <div>
                      <label style={labelStyle}>Fulfillment Method</label>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button type="button" onClick={() => setFulfillMethod('delivery')} style={pillToggleStyle(fulfillMethod === 'delivery')}>🚚 Delivery</button>
                        <button type="button" onClick={() => setFulfillMethod('pickup')}   style={pillToggleStyle(fulfillMethod === 'pickup')}>🏪 Pickup</button>
                      </div>
                    </div>

                    {/* Date picker */}
                    <div>
                      <label style={labelStyle}>{fulfillMethod === 'delivery' ? 'Delivery' : 'Pickup'} Date *</label>
                      <input
                        type="date"
                        min={today}
                        value={deliveryDate}
                        onChange={e => setDeliveryDate(e.target.value)}
                        required
                        style={inputStyle}
                      />
                    </div>

                    {/* Time slot */}
                    <div>
                      <label style={labelStyle}>Time Slot *</label>
                      <select
                        value={timeSlot}
                        onChange={e => setTimeSlot(e.target.value)}
                        required
                        style={{ ...inputStyle, cursor: 'pointer' }}
                      >
                        <option value="">Select a time slot</option>
                        {TIME_SLOTS.map(slot => (
                          <option key={slot.value} value={slot.value}>{slot.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* Customizations */}
                    <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 14 }}>
                      <div style={sectionLabelStyle}>🎀 Customizations</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div>
                          <label style={labelStyle}>Cake Message</label>
                          <input
                            type="text"
                            maxLength={50}
                            value={cakeMessage}
                            onChange={e => setCakeMessage(e.target.value)}
                            placeholder="e.g. Happy Birthday Priya!"
                            style={inputStyle}
                          />
                          <div style={{ fontSize: 11, color: C.muted, marginTop: 3, textAlign: 'right' }}>{cakeMessage.length}/50</div>
                        </div>
                        <div>
                          <label style={labelStyle}>Greeting Card Note</label>
                          <textarea
                            maxLength={200}
                            rows={2}
                            value={greetingNote}
                            onChange={e => setGreetingNote(e.target.value)}
                            placeholder="A personal message for the card…"
                            style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
                          />
                          <div style={{ fontSize: 11, color: C.muted, marginTop: 3, textAlign: 'right' }}>{greetingNote.length}/200</div>
                        </div>
                        <div>
                          <label style={labelStyle}>Dietary Note</label>
                          <input
                            type="text"
                            value={dietaryNote}
                            onChange={e => setDietaryNote(e.target.value)}
                            placeholder="e.g. No nuts, no eggs"
                            style={inputStyle}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Delivery address */}
                    {fulfillMethod === 'delivery' && (
                      <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 14 }}>
                        <div style={sectionLabelStyle}>📍 Delivery Address</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                          <div>
                            <label style={labelStyle}>Recipient Name *</label>
                            <input type="text" value={recipientName} onChange={e => setRecipientName(e.target.value)} placeholder="Full name" required style={inputStyle} />
                          </div>
                          <div>
                            <label style={labelStyle}>Recipient Phone *</label>
                            <input type="tel" value={recipientPhone} onChange={e => setRecipientPhone(e.target.value)} placeholder="10-digit mobile" required style={inputStyle} />
                          </div>
                          <div>
                            <label style={labelStyle}>Street *</label>
                            <input type="text" value={street} onChange={e => setStreet(e.target.value)} placeholder="House no., street, locality" required style={inputStyle} />
                          </div>
                          <div style={{ display: 'flex', gap: 10 }}>
                            <div style={{ flex: 1 }}>
                              <label style={labelStyle}>City *</label>
                              <input type="text" value={city} onChange={e => setCity(e.target.value)} placeholder="City" required style={inputStyle} />
                            </div>
                            <div style={{ flex: 1 }}>
                              <label style={labelStyle}>Pincode *</label>
                              <input type="text" value={pincode} onChange={e => setPincode(e.target.value)} placeholder="6-digit" required style={inputStyle} />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Order summary */}
                    <div style={{ background: C.canvas, borderRadius: 10, padding: 16, borderTop: `1px solid ${C.border}`, paddingTop: 14 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: C.muted, marginBottom: 6 }}>
                        <span>Items Subtotal</span><span>₹{itemsTotal}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: C.muted, marginBottom: 10 }}>
                        <span>Delivery Fee</span>
                        <span>{fulfillMethod === 'pickup' ? 'Free' : `₹${deliveryFee}`}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 18, color: C.cta, borderTop: `1px solid ${C.border}`, paddingTop: 10 }}>
                        <span>Total</span><span>₹{grandTotal}</span>
                      </div>
                    </div>

                    {/* Payment method selector */}
                    <div>
                      <label style={labelStyle}>Payment</label>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          onClick={() => setPaymentMethod('cod')}
                          style={pillToggleStyle(paymentMethod === 'cod')}
                        >💵 Cash on Delivery (COD)</button>
                        <button
                          type="button"
                          onClick={() => setPaymentMethod('online_upi')}
                          style={pillToggleStyle(paymentMethod === 'online_upi')}
                        >📱 Pay Online (UPI / QR / Cards)</button>
                      </div>
                    </div>

                    {/* Submit */}
                    <button
                      type="submit"
                      disabled={checkoutLoading}
                      style={{
                        background: checkoutLoading ? '#D0C8C0' : C.cta,
                        color: '#fff', border: 'none', borderRadius: 12,
                        padding: '13px 0', fontWeight: 800, fontSize: 15,
                        cursor: checkoutLoading ? 'not-allowed' : 'pointer',
                        width: '100%', letterSpacing: 0.3,
                        transition: 'background 0.15s',
                      }}
                    >
                      {checkoutLoading
                        ? 'Processing…'
                        : paymentMethod === 'online_upi'
                          ? `Pay Online · ₹${grandTotal}`
                          : `Place Order · ₹${grandTotal}`}
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══ MY ORDERS TAB ══ */}
        {activeTab === 'orders' && (
          <div>
            <h2 style={{ color: C.dark, fontWeight: 800, fontSize: 22, marginBottom: 20 }}>📋 My Orders</h2>

            {ordLoading && (
              <div style={{ textAlign: 'center', padding: 60, color: C.muted, fontSize: 16 }}>Loading your orders…</div>
            )}

            {!ordLoading && orders.length === 0 && (
              <div style={{ textAlign: 'center', padding: 80, color: C.muted }}>
                <div style={{ fontSize: 56, marginBottom: 14 }}>📋</div>
                <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>No orders yet</div>
                <div style={{ fontSize: 13, marginBottom: 20 }}>Place your first order and it will appear here!</div>
                <button
                  onClick={() => setActiveTab('cakes')}
                  style={{ background: C.cta, color: '#fff', border: 'none', borderRadius: 10, padding: '10px 28px', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}
                >
                  🍰 Start Shopping
                </button>
              </div>
            )}

            {!ordLoading && orders.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {orders.map(ord => {
                  const meta   = STATUS_META[ord.orderStatus] || { label: ord.orderStatus, bg: '#F5F5F5', color: '#555' };
                  const canCancel = ord.orderStatus === 'placed' || ord.orderStatus === 'confirmed';
                  const slot   = TIME_SLOTS.find(s => s.value === ord.fulfillment?.timeSlot)?.label || ord.fulfillment?.timeSlot || '—';
                  return (
                    <div key={ord._id} style={{ background: C.cardBg, borderRadius: 16, border: `1px solid ${C.border}`, overflow: 'hidden', boxShadow: '0 1px 6px rgba(43,30,22,0.06)' }}>

                      {/* Header */}
                      <div style={{ background: C.cream, padding: '14px 20px', display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', borderBottom: `1px solid ${C.border}` }}>
                        <div style={{ fontWeight: 800, fontSize: 14, color: C.dark }}>Order {fmtOrderId(ord._id)}</div>
                        <div style={{ fontSize: 13, color: C.muted }}>{fmtDate(ord.createdAt)}</div>

                        {/* Status badge */}
                        <span style={{
                          background: meta.bg, color: meta.color,
                          fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 999,
                        }}>{meta.label}</span>

                        <div style={{ marginLeft: 'auto', fontWeight: 800, fontSize: 16, color: C.cta }}>
                          ₹{ord.pricing?.totalAmount ?? '—'}
                        </div>
                      </div>

                      {/* Body */}
                      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>

                        {/* Item chips */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                          {ord.items?.map((item, i) => (
                            <span key={i} style={{
                              background: C.canvas, border: `1px solid ${C.border}`,
                              borderRadius: 8, padding: '5px 10px', fontSize: 12, color: C.darkAlt, fontWeight: 500,
                            }}>
                              {item.title} — {item.variantLabel} × {item.quantity}
                            </span>
                          ))}
                        </div>

                        {/* Fulfillment row */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, fontSize: 13, color: C.muted }}>
                          <span>📅 {fmtDate(ord.fulfillment?.deliveryDate)}</span>
                          <span>🕐 {slot}</span>
                          <span>{ord.fulfillment?.method === 'delivery' ? '🚚 Delivery' : '🏪 Pickup'}</span>
                          {ord.fulfillment?.method === 'delivery' && ord.fulfillment?.shippingAddress?.city && (
                            <span>📍 {ord.fulfillment.shippingAddress.city}</span>
                          )}
                        </div>

                        {/* Customizations highlights */}
                        {(ord.customizations?.cakeMessage || ord.customizations?.dietaryNote) && (
                          <div style={{ fontSize: 12, color: C.muted, display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                            {ord.customizations.cakeMessage && <span>🎂 "{ord.customizations.cakeMessage}"</span>}
                            {ord.customizations.dietaryNote && <span>🥗 {ord.customizations.dietaryNote}</span>}
                          </div>
                        )}

                        {/* Cancel */}
                        {canCancel && (
                          <div>
                            <button
                              onClick={() => handleCancelOrder(ord._id)}
                              style={{
                                background: 'transparent', color: '#B71C1C',
                                border: '1.5px solid #EF9A9A', borderRadius: 8,
                                padding: '7px 16px', fontSize: 13, fontWeight: 600,
                                cursor: 'pointer',
                              }}
                            >Cancel Order</button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
