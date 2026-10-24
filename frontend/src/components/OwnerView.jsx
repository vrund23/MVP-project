import { useState, useEffect } from 'react';
import api from '../api';

// ─── Constants ───────────────────────────────────────────────────────────────

const STATUS_SEQUENCE = [
  'placed',
  'confirmed',
  'in_kitchen',
  'ready_for_pickup',
  'out_for_delivery',
  'delivered',
];

const STATUS_LABELS = {
  placed: 'Placed',
  confirmed: 'Confirmed',
  in_kitchen: 'In Kitchen',
  ready_for_pickup: 'Ready for Pickup',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

const STATUS_BADGE_STYLES = {
  placed:           { background: '#FFF9C4', color: '#F57F17' },
  confirmed:        { background: '#E3F2FD', color: '#1565C0' },
  in_kitchen:       { background: '#FFF3E0', color: '#E65100' },
  ready_for_pickup: { background: '#E8F5E9', color: '#2E7D32' },
  out_for_delivery: { background: '#E0F7FA', color: '#00695C' },
  delivered:        { background: '#E8F5E9', color: '#1B5E20' },
  cancelled:        { background: '#FFEBEE', color: '#B71C1C' },
};

const TIME_SLOT_LABELS = {
  morning_10_13:  'Morning (10 AM – 1 PM)',
  afternoon_14_17:'Afternoon (2 PM – 5 PM)',
  evening_18_21:  'Evening (6 PM – 9 PM)',
};

const DIETARY_OPTIONS = ['eggless', 'gluten-free', 'vegan', 'nut-free'];

const COLORS = {
  bg:          '#FAF7F2',
  dark:        '#2B1E16',
  secondary:   '#3B2820',
  amber:       '#C86A28',
  gold:        '#D4AF37',
  subtle:      '#CBB279',
  muted:       '#8A7060',
  card:        '#FFFFFF',
  border:      '#E8DDD5',
  sidebar:     '#2B1E16',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getNextStatus(current) {
  const idx = STATUS_SEQUENCE.indexOf(current);
  if (idx === -1 || idx === STATUS_SEQUENCE.length - 1) return null;
  return STATUS_SEQUENCE[idx + 1];
}

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

function formatRupees(amount) {
  return `₹${Number(amount || 0).toLocaleString('en-IN')}`;
}

function generateVariantId() {
  return `v_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

function makeEmptyVariant() {
  return {
    variantId: generateVariantId(),
    subtype: '',
    label: '',
    weight: '',
    servings: '',
    price: '',
    stock: '',
    imageUrl: '',
  };
}

function makeEmptyForm() {
  return {
    title: '',
    category: 'cakes',
    subcategory: '',
    description: '',
    shelfLife: '',
    badge: '',
    leadTimeHours: 0,
    dietaryTags: ['eggless'],
    cocoaPercentage: '',
    cakeLevels: '',
    packagingType: '',
    itemsIncluded: '',
    variants: [makeEmptyVariant()],
  };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ icon, label, value, valueColor }) {
  return (
    <div style={{
      background: COLORS.card,
      border: `1px solid ${COLORS.border}`,
      borderRadius: 12,
      padding: '20px 20px 18px',
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
    }}>
      <span style={{ fontSize: 28 }}>{icon}</span>
      <span style={{
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: COLORS.muted,
      }}>{label}</span>
      <span style={{
        fontSize: 26,
        fontWeight: 800,
        color: valueColor || COLORS.dark,
        lineHeight: 1.1,
      }}>{value}</span>
    </div>
  );
}

function StatusBadge({ status }) {
  const style = STATUS_BADGE_STYLES[status] || { background: '#F5F5F5', color: '#333' };
  return (
    <span style={{
      ...style,
      padding: '3px 10px',
      borderRadius: 20,
      fontSize: 12,
      fontWeight: 700,
      letterSpacing: '0.03em',
      whiteSpace: 'nowrap',
    }}>
      {STATUS_LABELS[status] || status}
    </span>
  );
}

function OrderCard({ order, onStatusAdvance, onCancel, updating }) {
  const { _id, customer, orderStatus, pricing, payment, fulfillment, customizations, items, createdAt } = order;

  const nextStatus = getNextStatus(orderStatus);
  const canCancel = orderStatus === 'placed' || orderStatus === 'confirmed';
  const isDelivered = orderStatus === 'delivered';
  const isCancelled = orderStatus === 'cancelled';

  const hasKitchenAlert =
    (customizations?.cakeMessage && customizations.cakeMessage.trim()) ||
    (customizations?.dietaryNote && customizations.dietaryNote.trim()) ||
    (customizations?.greetingCardMessage && customizations.greetingCardMessage.trim());

  const addr = fulfillment?.shippingAddress;

  return (
    <div style={{
      background: COLORS.card,
      border: `1px solid ${COLORS.border}`,
      borderRadius: 12,
      overflow: 'hidden',
      marginBottom: 16,
    }}>
      {/* Header strip */}
      <div style={{
        background: '#FDFAF7',
        borderBottom: `1px solid ${COLORS.border}`,
        padding: '12px 18px',
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 12,
      }}>
        <span style={{ fontFamily: 'monospace', fontSize: 13, color: COLORS.muted, flexShrink: 0 }}>
          #{_id?.slice(-8).toUpperCase()}
        </span>
        <span style={{ fontSize: 13, color: COLORS.muted, flexShrink: 0 }}>
          {formatDate(createdAt)}
        </span>
        <StatusBadge status={orderStatus} />
        <span style={{ marginLeft: 'auto', fontWeight: 800, fontSize: 16, color: COLORS.amber, flexShrink: 0 }}>
          {formatRupees(pricing?.totalAmount)}
        </span>
      </div>

      {/* Body */}
      <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* Customer info */}
        <div style={{ fontSize: 14, color: COLORS.secondary }}>
          <span style={{ fontWeight: 700 }}>{customer?.name || 'N/A'}</span>
          <span style={{ color: COLORS.muted, margin: '0 6px' }}>·</span>
          <span style={{ color: COLORS.muted }}>{customer?.email}</span>
          <span style={{ color: COLORS.muted, margin: '0 6px' }}>·</span>
          <span style={{ color: COLORS.muted }}>{customer?.phone}</span>
        </div>

        {/* Items */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {(items || []).map((item, i) => (
            <span key={i} style={{
              background: COLORS.bg,
              border: `1px solid ${COLORS.border}`,
              borderRadius: 20,
              padding: '3px 10px',
              fontSize: 13,
              color: COLORS.secondary,
            }}>
              {item.title} — {item.variantLabel} × {item.quantity} ({formatRupees(item.price * item.quantity)})
            </span>
          ))}
        </div>

        {/* Fulfillment */}
        <div style={{ fontSize: 13, color: COLORS.muted, lineHeight: 1.8 }}>
          <span style={{ fontWeight: 600, color: COLORS.secondary }}>
            {fulfillment?.method === 'delivery' ? '🚚 Delivery' : '🏪 Pickup'}
          </span>
          {fulfillment?.deliveryDate && (
            <> · {formatDate(fulfillment.deliveryDate)}</>
          )}
          {fulfillment?.timeSlot && (
            <> · {TIME_SLOT_LABELS[fulfillment.timeSlot] || fulfillment.timeSlot}</>
          )}
          {fulfillment?.method === 'delivery' && addr && (
            <div style={{ marginTop: 2 }}>
              📍 {addr.recipientName} ({addr.recipientPhone}) — {addr.street}, {addr.city} {addr.pincode}
            </div>
          )}
        </div>

        {/* Payment */}
        <div style={{ fontSize: 13, color: COLORS.muted }}>
          💳 {payment?.method?.toUpperCase() || 'N/A'}
          <span style={{
            marginLeft: 8,
            padding: '2px 8px',
            borderRadius: 12,
            fontSize: 11,
            fontWeight: 700,
            background: payment?.status === 'paid' ? '#E8F5E9' : '#FFF9C4',
            color: payment?.status === 'paid' ? '#2E7D32' : '#F57F17',
          }}>
            {payment?.status?.toUpperCase() || 'PENDING'}
          </span>
        </div>

        {/* Kitchen Alert */}
        {hasKitchenAlert && (
          <div style={{
            background: '#FFF8E1',
            border: '1px solid #FFD54F',
            borderRadius: 8,
            padding: '10px 14px',
            fontSize: 13,
            color: '#5D4037',
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}>
            <span style={{ fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#E65100', marginBottom: 2 }}>
              Kitchen Notes
            </span>
            {customizations?.cakeMessage && customizations.cakeMessage.trim() && (
              <span>🎂 Inscription: "{customizations.cakeMessage}"</span>
            )}
            {customizations?.dietaryNote && customizations.dietaryNote.trim() && (
              <span>🥗 Dietary: {customizations.dietaryNote}</span>
            )}
            {customizations?.greetingCardMessage && customizations.greetingCardMessage.trim() && (
              <span>💌 Card: "{customizations.greetingCardMessage}"</span>
            )}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', paddingTop: 4 }}>
          {!isDelivered && !isCancelled && nextStatus && (
            <button
              disabled={updating}
              onClick={() => onStatusAdvance(order, nextStatus)}
              style={{
                background: updating ? '#CCC' : COLORS.amber,
                color: '#FFF',
                border: 'none',
                borderRadius: 8,
                padding: '8px 18px',
                fontWeight: 700,
                fontSize: 14,
                cursor: updating ? 'not-allowed' : 'pointer',
                transition: 'opacity 0.15s',
              }}
            >
              {updating ? 'Updating…' : `→ Mark ${STATUS_LABELS[nextStatus]}`}
            </button>
          )}
          {canCancel && (
            <button
              disabled={updating}
              onClick={() => onCancel(order)}
              style={{
                background: 'transparent',
                color: '#C62828',
                border: '1.5px solid #C62828',
                borderRadius: 8,
                padding: '7px 16px',
                fontWeight: 700,
                fontSize: 14,
                cursor: updating ? 'not-allowed' : 'pointer',
              }}
            >
              Cancel Order
            </button>
          )}
          {isDelivered && (
            <span style={{ color: '#2E7D32', fontWeight: 700, fontSize: 14 }}>
              ✅ Order Complete
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Tab: Dashboard ───────────────────────────────────────────────────────────

function DashboardTab({ orders, products, loading }) {
  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 60, color: COLORS.muted, fontSize: 16 }}>
        Loading…
      </div>
    );
  }

  const totalOrders = orders.length;
  const awaitingCount = orders.filter(o => o.orderStatus === 'placed' || o.orderStatus === 'confirmed').length;
  const inKitchenCount = orders.filter(o => o.orderStatus === 'in_kitchen').length;
  const catalogCount = products.length;
  const onlineRevenue = orders
    .filter(o => o.payment?.status === 'paid')
    .reduce((sum, o) => sum + (o.pricing?.totalAmount || 0), 0);

  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* Stats grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
        gap: 16,
      }}>
        <StatCard icon="📦" label="Total Orders" value={totalOrders} />
        <StatCard icon="⏳" label="Awaiting Confirmation" value={awaitingCount} valueColor="#F57F17" />
        <StatCard icon="🍳" label="In Kitchen" value={inKitchenCount} valueColor="#E65100" />
        <StatCard icon="🏷️" label="Catalog Products" value={catalogCount} valueColor={COLORS.amber} />
        <StatCard icon="💰" label="Online Revenue" value={formatRupees(onlineRevenue)} valueColor="#2E7D32" />
      </div>

      {/* Recent orders */}
      <div>
        <h3 style={{ color: COLORS.dark, fontSize: 16, fontWeight: 700, margin: '0 0 14px' }}>
          Recent Orders
        </h3>
        {recentOrders.length === 0 ? (
          <div style={{
            background: COLORS.card,
            border: `1px solid ${COLORS.border}`,
            borderRadius: 12,
            padding: 40,
            textAlign: 'center',
            color: COLORS.muted,
          }}>
            📭 No orders yet.
          </div>
        ) : (
          <div style={{
            background: COLORS.card,
            border: `1px solid ${COLORS.border}`,
            borderRadius: 12,
            overflow: 'hidden',
          }}>
            {recentOrders.map((order, idx) => (
              <div key={order._id} style={{
                display: 'flex',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 12,
                padding: '12px 18px',
                borderBottom: idx < recentOrders.length - 1 ? `1px solid ${COLORS.border}` : 'none',
              }}>
                <span style={{ fontFamily: 'monospace', fontSize: 12, color: COLORS.muted, flexShrink: 0 }}>
                  #{order._id?.slice(-8).toUpperCase()}
                </span>
                <span style={{ fontWeight: 600, fontSize: 14, color: COLORS.secondary, flexShrink: 0 }}>
                  {order.customer?.name || 'N/A'}
                </span>
                <StatusBadge status={order.orderStatus} />
                <span style={{ marginLeft: 'auto', fontWeight: 700, color: COLORS.amber, flexShrink: 0 }}>
                  {formatRupees(order.pricing?.totalAmount)}
                </span>
                <span style={{ fontSize: 12, color: COLORS.muted, flexShrink: 0 }}>
                  {formatDate(order.createdAt)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Tab: Live Orders ─────────────────────────────────────────────────────────

function LiveOrdersTab({ orders, setOrders, loading }) {
  const [statusFilter, setStatusFilter] = useState('all');
  const [statusUpdating, setStatusUpdating] = useState({});

  const statusCounts = STATUS_SEQUENCE.reduce((acc, s) => {
    acc[s] = orders.filter(o => o.orderStatus === s).length;
    return acc;
  }, {});
  statusCounts['cancelled'] = orders.filter(o => o.orderStatus === 'cancelled').length;

  const filtered = statusFilter === 'all'
    ? orders
    : orders.filter(o => o.orderStatus === statusFilter);

  const handleAdvance = (order, nextStatus) => {
    const id = order._id;
    setStatusUpdating(prev => ({ ...prev, [id]: true }));

    // Optimistic update
    setOrders(prev => prev.map(o => o._id === id ? { ...o, orderStatus: nextStatus } : o));

    api.updateOrderStatus(id, nextStatus)
      .then(res => {
        if (res?.data) {
          setOrders(prev => prev.map(o => o._id === id ? res.data : o));
        }
      })
      .catch(() => {
        // Revert on error
        setOrders(prev => prev.map(o => o._id === id ? order : o));
      })
      .finally(() => {
        setStatusUpdating(prev => ({ ...prev, [id]: false }));
      });
  };

  const handleCancel = (order) => {
    const confirmed = window.confirm(
      `Cancel order #${order._id?.slice(-8).toUpperCase()} for ${order.customer?.name}? This cannot be undone.`
    );
    if (!confirmed) return;

    const reason = window.prompt('Enter cancellation reason (owner):') || 'Cancelled by owner';
    const id = order._id;

    setStatusUpdating(prev => ({ ...prev, [id]: true }));
    setOrders(prev => prev.map(o => o._id === id ? { ...o, orderStatus: 'cancelled', cancellationReason: reason } : o));

    api.cancelOrder(id, reason)
      .then(res => {
        if (res?.data) {
          setOrders(prev => prev.map(o => o._id === id ? res.data : o));
        }
      })
      .catch(() => {
        setOrders(prev => prev.map(o => o._id === id ? order : o));
      })
      .finally(() => {
        setStatusUpdating(prev => ({ ...prev, [id]: false }));
      });
  };

  const allStatuses = [...STATUS_SEQUENCE, 'cancelled'];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 60, color: COLORS.muted, fontSize: 16 }}>
        Loading…
      </div>
    );
  }

  return (
    <div>
      {/* Filter bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <h3 style={{ margin: 0, color: COLORS.dark, fontSize: 18, fontWeight: 700 }}>
          Live Orders
        </h3>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          style={{
            border: `1.5px solid ${COLORS.border}`,
            borderRadius: 8,
            padding: '8px 14px',
            fontSize: 14,
            background: COLORS.card,
            color: COLORS.dark,
            cursor: 'pointer',
            outline: 'none',
          }}
        >
          <option value="all">All Orders ({orders.length})</option>
          {allStatuses.map(s => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]} ({statusCounts[s] || 0})
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div style={{
          background: COLORS.card,
          border: `1px solid ${COLORS.border}`,
          borderRadius: 12,
          padding: 60,
          textAlign: 'center',
          color: COLORS.muted,
          fontSize: 15,
        }}>
          📭 No orders {statusFilter !== 'all' ? `with status "${STATUS_LABELS[statusFilter]}"` : ''}.
        </div>
      ) : (
        filtered
          .slice()
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .map(order => (
            <OrderCard
              key={order._id}
              order={order}
              onStatusAdvance={handleAdvance}
              onCancel={handleCancel}
              updating={!!statusUpdating[order._id]}
            />
          ))
      )}
    </div>
  );
}

// ─── Tab: Catalog ─────────────────────────────────────────────────────────────

function CatalogTab({ products, setProducts, loading }) {
  const [showForm, setShowForm] = useState(false);
  const [productForm, setProductForm] = useState(makeEmptyForm());
  const [formLoading, setFormLoading] = useState(false);
  const [formSuccess, setFormSuccess] = useState('');
  const [formError, setFormError] = useState('');

  const updateForm = (field, value) => {
    setProductForm(prev => ({ ...prev, [field]: value }));
  };

  const updateVariant = (index, field, value) => {
    setProductForm(prev => {
      const variants = [...prev.variants];
      variants[index] = { ...variants[index], [field]: value };
      return { ...prev, variants };
    });
  };

  const addVariant = () => {
    setProductForm(prev => ({
      ...prev,
      variants: [...prev.variants, makeEmptyVariant()],
    }));
  };

  const removeVariant = (index) => {
    setProductForm(prev => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index),
    }));
  };

  const toggleDietaryTag = (tag) => {
    setProductForm(prev => {
      const tags = prev.dietaryTags.includes(tag)
        ? prev.dietaryTags.filter(t => t !== tag)
        : [...prev.dietaryTags, tag];
      return { ...prev, dietaryTags: tags };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');
    setFormSuccess('');

    try {
      const payload = {
        title: productForm.title,
        category: productForm.category,
        subcategory: productForm.subcategory,
        description: productForm.description,
        shelfLife: productForm.shelfLife,
        leadTimeHours: Number(productForm.leadTimeHours) || 0,
        dietaryTags: productForm.dietaryTags,
        variants: productForm.variants.map(v => ({
          ...v,
          price: Number(v.price),
          stock: Number(v.stock),
        })),
      };

      if (productForm.badge) payload.badge = productForm.badge;
      if (productForm.category === 'chocolates' && productForm.cocoaPercentage !== '')
        payload.cocoaPercentage = Number(productForm.cocoaPercentage);
      if (productForm.category === 'cakes' && productForm.cakeLevels !== '')
        payload.cakeLevels = Number(productForm.cakeLevels);
      if (productForm.category === 'hampers') {
        if (productForm.packagingType) payload.packagingType = productForm.packagingType;
        if (productForm.itemsIncluded)
          payload.itemsIncluded = productForm.itemsIncluded.split(',').map(s => s.trim()).filter(Boolean);
      }

      const res = await api.createProduct(payload);
      if (res?.data) {
        setProducts(prev => [res.data, ...prev]);
      } else {
        // Re-fetch just in case
      }
      setFormSuccess('✅ Product added!');
      setShowForm(false);
      setProductForm(makeEmptyForm());
    } catch (err) {
      setFormError(err?.response?.data?.message || err?.message || 'Failed to create product.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleHide = (productId) => {
    api.deleteProduct(productId)
      .then(() => {
        setProducts(prev => prev.filter(p => p._id !== productId));
      })
      .catch(err => {
        alert('Failed to hide product: ' + (err?.message || 'Unknown error'));
      });
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 60, color: COLORS.muted, fontSize: 16 }}>
        Loading…
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <h3 style={{ margin: 0, color: COLORS.dark, fontSize: 18, fontWeight: 700 }}>
          Catalog Manager
        </h3>
        <button
          onClick={() => { setShowForm(prev => !prev); setFormError(''); setFormSuccess(''); }}
          style={{
            background: showForm ? COLORS.bg : COLORS.amber,
            color: showForm ? COLORS.amber : '#FFF',
            border: `1.5px solid ${COLORS.amber}`,
            borderRadius: 8,
            padding: '8px 18px',
            fontWeight: 700,
            fontSize: 14,
            cursor: 'pointer',
          }}
        >
          {showForm ? '✕ Close Form' : '+ Add Product'}
        </button>
      </div>

      {/* Success banner */}
      {formSuccess && !showForm && (
        <div style={{
          background: '#E8F5E9',
          border: '1px solid #A5D6A7',
          borderRadius: 8,
          padding: '10px 16px',
          color: '#2E7D32',
          fontWeight: 600,
          fontSize: 14,
        }}>
          {formSuccess}
        </div>
      )}

      {/* Add product form */}
      {showForm && (
        <div style={{
          background: COLORS.card,
          border: `1px solid ${COLORS.border}`,
          borderRadius: 12,
          padding: 24,
        }}>
          <h4 style={{ margin: '0 0 18px', color: COLORS.dark, fontSize: 16, fontWeight: 700 }}>
            New Product
          </h4>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Row 1: Title | Category | Subcategory */}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 2, minWidth: 180 }}>
                <label style={labelStyle}>Title *</label>
                <input
                  required
                  value={productForm.title}
                  onChange={e => updateForm('title', e.target.value)}
                  placeholder="e.g. Belgian Dark Truffle Cake"
                  style={inputStyle}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 130 }}>
                <label style={labelStyle}>Category *</label>
                <select
                  value={productForm.category}
                  onChange={e => updateForm('category', e.target.value)}
                  style={inputStyle}
                >
                  <option value="cakes">Cakes</option>
                  <option value="chocolates">Chocolates</option>
                  <option value="hampers">Hampers</option>
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 130 }}>
                <label style={labelStyle}>Subcategory *</label>
                <input
                  required
                  value={productForm.subcategory}
                  onChange={e => updateForm('subcategory', e.target.value)}
                  placeholder="e.g. birthday"
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Row 2: Description */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={labelStyle}>Description *</label>
              <textarea
                required
                rows={3}
                value={productForm.description}
                onChange={e => updateForm('description', e.target.value)}
                placeholder="Describe the product…"
                style={{ ...inputStyle, resize: 'vertical' }}
              />
            </div>

            {/* Row 3: Shelf Life | Badge | Lead Time | category-specific */}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 120 }}>
                <label style={labelStyle}>Shelf Life *</label>
                <input
                  required
                  value={productForm.shelfLife}
                  onChange={e => updateForm('shelfLife', e.target.value)}
                  placeholder="e.g. 3 days"
                  style={inputStyle}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 120 }}>
                <label style={labelStyle}>Badge</label>
                <input
                  value={productForm.badge}
                  onChange={e => updateForm('badge', e.target.value)}
                  placeholder="e.g. Bestseller"
                  style={inputStyle}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 110 }}>
                <label style={labelStyle}>Lead Time (hrs)</label>
                <input
                  type="number"
                  min={0}
                  value={productForm.leadTimeHours}
                  onChange={e => updateForm('leadTimeHours', e.target.value)}
                  style={inputStyle}
                />
              </div>
              {productForm.category === 'chocolates' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 110 }}>
                  <label style={labelStyle}>Cocoa %</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={productForm.cocoaPercentage}
                    onChange={e => updateForm('cocoaPercentage', e.target.value)}
                    placeholder="e.g. 72"
                    style={inputStyle}
                  />
                </div>
              )}
              {productForm.category === 'cakes' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 110 }}>
                  <label style={labelStyle}>Cake Levels</label>
                  <input
                    type="number"
                    min={1}
                    value={productForm.cakeLevels}
                    onChange={e => updateForm('cakeLevels', e.target.value)}
                    placeholder="e.g. 2"
                    style={inputStyle}
                  />
                </div>
              )}
              {productForm.category === 'hampers' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 130 }}>
                  <label style={labelStyle}>Packaging Type</label>
                  <input
                    value={productForm.packagingType}
                    onChange={e => updateForm('packagingType', e.target.value)}
                    placeholder="e.g. Luxury Box"
                    style={inputStyle}
                  />
                </div>
              )}
            </div>

            {/* Hampers: Items Included */}
            {productForm.category === 'hampers' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={labelStyle}>Items Included (comma-separated)</label>
                <input
                  value={productForm.itemsIncluded}
                  onChange={e => updateForm('itemsIncluded', e.target.value)}
                  placeholder="e.g. Dark Truffle, Milk Bar, Hazelnut Rocher"
                  style={inputStyle}
                />
              </div>
            )}

            {/* Dietary Tags */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={labelStyle}>Dietary Tags</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {DIETARY_OPTIONS.map(tag => {
                  const active = productForm.dietaryTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleDietaryTag(tag)}
                      style={{
                        padding: '5px 14px',
                        borderRadius: 20,
                        border: `1.5px solid ${active ? '#2E7D32' : '#CCC'}`,
                        background: active ? '#E8F5E9' : '#F5F5F5',
                        color: active ? '#2E7D32' : '#666',
                        fontWeight: 600,
                        fontSize: 13,
                        cursor: 'pointer',
                      }}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Variants */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label style={labelStyle}>Variants *</label>
                <button
                  type="button"
                  onClick={addVariant}
                  style={{
                    background: 'transparent',
                    border: `1.5px solid ${COLORS.amber}`,
                    color: COLORS.amber,
                    borderRadius: 8,
                    padding: '5px 12px',
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: 'pointer',
                  }}
                >
                  + Add Variant
                </button>
              </div>
              {productForm.variants.map((variant, idx) => (
                <div key={variant.variantId} style={{
                  background: COLORS.bg,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: 10,
                  padding: 14,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 700, fontSize: 13, color: COLORS.secondary }}>
                      Variant {idx + 1}
                    </span>
                    {productForm.variants.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeVariant(idx)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#C62828',
                          fontWeight: 700,
                          fontSize: 13,
                          cursor: 'pointer',
                        }}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  {/* Row 1: Subtype | Label | Weight | Servings */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      <label style={labelStyle}>Subtype *</label>
                      <input
                        required
                        value={variant.subtype}
                        onChange={e => updateVariant(idx, 'subtype', e.target.value)}
                        placeholder="e.g. standard"
                        style={inputStyle}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      <label style={labelStyle}>Label *</label>
                      <input
                        required
                        value={variant.label}
                        onChange={e => updateVariant(idx, 'label', e.target.value)}
                        placeholder="e.g. 500g Dark"
                        style={inputStyle}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      <label style={labelStyle}>Weight *</label>
                      <input
                        required
                        value={variant.weight}
                        onChange={e => updateVariant(idx, 'weight', e.target.value)}
                        placeholder="e.g. 500g"
                        style={inputStyle}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      <label style={labelStyle}>Servings</label>
                      <input
                        value={variant.servings}
                        onChange={e => updateVariant(idx, 'servings', e.target.value)}
                        placeholder="e.g. 4-6"
                        style={inputStyle}
                      />
                    </div>
                  </div>
                  {/* Row 2: Price | Stock | Image URL (span 2) */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      <label style={labelStyle}>Price (₹) *</label>
                      <input
                        required
                        type="number"
                        min={0}
                        value={variant.price}
                        onChange={e => updateVariant(idx, 'price', e.target.value)}
                        placeholder="e.g. 1200"
                        style={inputStyle}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      <label style={labelStyle}>Stock *</label>
                      <input
                        required
                        type="number"
                        min={0}
                        value={variant.stock}
                        onChange={e => updateVariant(idx, 'stock', e.target.value)}
                        placeholder="e.g. 20"
                        style={inputStyle}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, gridColumn: 'span 2' }}>
                      <label style={labelStyle}>Image URL *</label>
                      <input
                        required
                        type="url"
                        value={variant.imageUrl}
                        onChange={e => updateVariant(idx, 'imageUrl', e.target.value)}
                        placeholder="https://..."
                        style={inputStyle}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Error */}
            {formError && (
              <div style={{
                background: '#FFEBEE',
                border: '1px solid #EF9A9A',
                borderRadius: 8,
                padding: '10px 14px',
                color: '#C62828',
                fontSize: 14,
                fontWeight: 600,
              }}>
                {formError}
              </div>
            )}

            {/* Submit */}
            <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
              <button
                type="submit"
                disabled={formLoading}
                style={{
                  background: formLoading ? '#CCC' : COLORS.amber,
                  color: '#FFF',
                  border: 'none',
                  borderRadius: 8,
                  padding: '10px 24px',
                  fontWeight: 700,
                  fontSize: 15,
                  cursor: formLoading ? 'not-allowed' : 'pointer',
                }}
              >
                {formLoading ? 'Creating…' : 'Create Product'}
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setFormError(''); setProductForm(makeEmptyForm()); }}
                style={{
                  background: 'transparent',
                  color: COLORS.muted,
                  border: `1.5px solid ${COLORS.border}`,
                  borderRadius: 8,
                  padding: '10px 20px',
                  fontWeight: 600,
                  fontSize: 15,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Product Table */}
      <div style={{
        background: COLORS.card,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 12,
        overflow: 'hidden',
      }}>
        {products.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center', color: COLORS.muted, fontSize: 15 }}>
            🍰 No products yet. Add your first product above.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ background: COLORS.bg, borderBottom: `1.5px solid ${COLORS.border}` }}>
                {['Product', 'Category', 'Variants', 'Lead Time', 'Status', 'Action'].map(col => (
                  <th key={col} style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontWeight: 700,
                    fontSize: 11,
                    letterSpacing: '0.07em',
                    textTransform: 'uppercase',
                    color: COLORS.muted,
                    whiteSpace: 'nowrap',
                  }}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {products.map((product, idx) => (
                <tr key={product._id} style={{
                  borderBottom: idx < products.length - 1 ? `1px solid ${COLORS.border}` : 'none',
                }}>
                  {/* Product */}
                  <td style={{ padding: '14px 16px', verticalAlign: 'top', maxWidth: 240 }}>
                    <div style={{ fontWeight: 700, color: COLORS.dark, marginBottom: 2 }}>
                      {product.title}
                    </div>
                    <div style={{ fontSize: 12, color: COLORS.muted }}>{product.subcategory}</div>
                    {product.badge && (
                      <span style={{
                        display: 'inline-block',
                        marginTop: 4,
                        background: '#FFF8E1',
                        border: '1px solid #FFD54F',
                        borderRadius: 12,
                        padding: '2px 8px',
                        fontSize: 11,
                        fontWeight: 700,
                        color: COLORS.gold,
                      }}>
                        {product.badge}
                      </span>
                    )}
                  </td>
                  {/* Category */}
                  <td style={{ padding: '14px 16px', verticalAlign: 'top' }}>
                    <span style={{
                      background: COLORS.border,
                      borderRadius: 12,
                      padding: '3px 10px',
                      fontSize: 12,
                      fontWeight: 600,
                      color: COLORS.secondary,
                    }}>
                      {product.category}
                    </span>
                  </td>
                  {/* Variants */}
                  <td style={{ padding: '14px 16px', verticalAlign: 'top' }}>
                    <div style={{ fontSize: 13, color: COLORS.muted, marginBottom: 4 }}>
                      {product.variants?.length || 0} variant{product.variants?.length !== 1 ? 's' : ''}
                    </div>
                    {(product.variants || []).map((v, vi) => (
                      <div key={vi} style={{ fontSize: 12, color: COLORS.muted, marginBottom: 1 }}>
                        {v.label}: {formatRupees(v.price)} ({v.stock} left)
                      </div>
                    ))}
                  </td>
                  {/* Lead Time */}
                  <td style={{ padding: '14px 16px', verticalAlign: 'top', whiteSpace: 'nowrap' }}>
                    <span style={{ fontSize: 14, color: COLORS.secondary }}>
                      {product.leadTimeHours || 0}h
                    </span>
                  </td>
                  {/* Status */}
                  <td style={{ padding: '14px 16px', verticalAlign: 'top' }}>
                    <span style={{
                      padding: '3px 10px',
                      borderRadius: 12,
                      fontSize: 12,
                      fontWeight: 700,
                      background: product.isAvailable ? '#E8F5E9' : '#FFEBEE',
                      color: product.isAvailable ? '#2E7D32' : '#B71C1C',
                    }}>
                      {product.isAvailable ? 'Active' : 'Hidden'}
                    </span>
                  </td>
                  {/* Action */}
                  <td style={{ padding: '14px 16px', verticalAlign: 'top' }}>
                    {product.isAvailable && (
                      <button
                        onClick={() => {
                          if (window.confirm(`Hide "${product.title}"? It won't appear in the catalog.`)) {
                            handleHide(product._id);
                          }
                        }}
                        style={{
                          background: 'transparent',
                          color: '#C62828',
                          border: '1.5px solid #C62828',
                          borderRadius: 8,
                          padding: '5px 12px',
                          fontWeight: 700,
                          fontSize: 13,
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        Hide
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ─── Tab: Customers ───────────────────────────────────────────────────────────

function CustomersTab({ orders, loading }) {
  const customers = Object.values(
    orders.reduce((map, ord) => {
      const c = ord.customer;
      if (!c || !c._id) return map;
      if (!map[c._id]) {
        map[c._id] = { ...c, orderCount: 0, totalSpend: 0 };
      }
      map[c._id].orderCount += 1;
      map[c._id].totalSpend += ord.pricing?.totalAmount || 0;
      return map;
    }, {})
  );

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 60, color: COLORS.muted, fontSize: 16 }}>
        Loading…
      </div>
    );
  }

  return (
    <div>
      <h3 style={{ margin: '0 0 18px', color: COLORS.dark, fontSize: 18, fontWeight: 700 }}>
        Customers
      </h3>
      <div style={{
        background: COLORS.card,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 12,
        overflow: 'hidden',
      }}>
        {customers.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center', color: COLORS.muted, fontSize: 15 }}>
            👥 No customer data available yet.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ background: COLORS.bg, borderBottom: `1.5px solid ${COLORS.border}` }}>
                {['Customer Name', 'Email', 'Phone', 'Orders', 'Total Spend'].map(col => (
                  <th key={col} style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontWeight: 700,
                    fontSize: 11,
                    letterSpacing: '0.07em',
                    textTransform: 'uppercase',
                    color: COLORS.muted,
                    whiteSpace: 'nowrap',
                  }}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {customers
                .sort((a, b) => b.totalSpend - a.totalSpend)
                .map((customer, idx) => (
                <tr key={customer._id} style={{
                  borderBottom: idx < customers.length - 1 ? `1px solid ${COLORS.border}` : 'none',
                }}>
                  <td style={{ padding: '13px 16px', fontWeight: 700, color: COLORS.dark }}>
                    {customer.name || 'N/A'}
                  </td>
                  <td style={{ padding: '13px 16px', color: COLORS.muted }}>
                    {customer.email || '—'}
                  </td>
                  <td style={{ padding: '13px 16px', color: COLORS.muted }}>
                    {customer.phone || '—'}
                  </td>
                  <td style={{ padding: '13px 16px', textAlign: 'center', fontWeight: 600, color: COLORS.secondary }}>
                    {customer.orderCount}
                  </td>
                  <td style={{ padding: '13px 16px', fontWeight: 800, color: COLORS.amber }}>
                    {formatRupees(customer.totalSpend)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ─── Shared inline style helpers ─────────────────────────────────────────────

const labelStyle = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.07em',
  textTransform: 'uppercase',
  color: COLORS.muted,
};

const inputStyle = {
  border: `1.5px solid ${COLORS.border}`,
  borderRadius: 8,
  padding: '8px 12px',
  fontSize: 14,
  color: COLORS.dark,
  background: COLORS.card,
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
};

// ─── Main OwnerView Component ─────────────────────────────────────────────────

export default function OwnerView({ user }) {
  const [tab, setTab] = useState('dashboard');

  // Shared data
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);

  // Loading states per resource
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [productsLoading, setProductsLoading] = useState(false);

  // Track which data has been fetched
  const [ordersFetched, setOrdersFetched] = useState(false);
  const [productsFetched, setProductsFetched] = useState(false);

  const fetchOrders = () => {
    setOrdersLoading(true);
    api.getAllOrders()
      .then(res => {
        setOrders(res?.data || []);
        setOrdersFetched(true);
      })
      .catch(err => console.error('Failed to fetch orders:', err))
      .finally(() => setOrdersLoading(false));
  };

  const fetchProducts = () => {
    setProductsLoading(true);
    api.getProducts()
      .then(res => {
        setProducts(res?.data || []);
        setProductsFetched(true);
      })
      .catch(err => console.error('Failed to fetch products:', err))
      .finally(() => setProductsLoading(false));
  };

  useEffect(() => {
    if (tab === 'dashboard') {
      fetchOrders();
      fetchProducts();
    } else if (tab === 'orders') {
      fetchOrders();
    } else if (tab === 'catalog') {
      fetchProducts();
    } else if (tab === 'customers') {
      if (!ordersFetched) {
        fetchOrders();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const NAV_ITEMS = [
    { id: 'dashboard', label: '📊 Dashboard' },
    { id: 'orders',    label: '🚚 Live Orders' },
    { id: 'catalog',   label: '🍰 Catalog' },
    { id: 'customers', label: '👥 Customers' },
  ];

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      background: COLORS.bg,
      fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
    }}>
      {/* ── Sidebar ── */}
      <aside style={{
        width: 220,
        flexShrink: 0,
        background: COLORS.sidebar,
        display: 'flex',
        flexDirection: 'column',
        padding: '24px 0',
        gap: 0,
      }}>
        {/* Portal label */}
        <div style={{
          padding: '0 20px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          marginBottom: 12,
        }}>
          <span style={{
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: COLORS.gold,
          }}>
            Owner Portal
          </span>
        </div>

        {/* Nav items */}
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2, padding: '0 10px' }}>
          {NAV_ITEMS.map(item => {
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  background: active ? COLORS.amber : 'transparent',
                  color: active ? '#FFFFFF' : '#D7CCC8',
                  border: 'none',
                  borderRadius: 8,
                  padding: '10px 14px',
                  fontSize: 14,
                  fontWeight: active ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'background 0.15s, color 0.15s',
                }}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* User info at bottom */}
        <div style={{
          padding: '16px 20px 0',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          marginTop: 12,
        }}>
          <div style={{ fontSize: 11, color: 'rgba(215,204,200,0.5)', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Signed in as
          </div>
          <div style={{ fontSize: 13, color: '#D7CCC8', fontWeight: 600, wordBreak: 'break-word' }}>
            {user?.name || user?.email || 'Owner'}
          </div>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main style={{
        flex: 1,
        overflowY: 'auto',
        padding: '28px 32px',
        minWidth: 0,
      }}>
        {tab === 'dashboard' && (
          <DashboardTab
            orders={orders}
            products={products}
            loading={ordersLoading || productsLoading}
          />
        )}
        {tab === 'orders' && (
          <LiveOrdersTab
            orders={orders}
            setOrders={setOrders}
            loading={ordersLoading}
          />
        )}
        {tab === 'catalog' && (
          <CatalogTab
            products={products}
            setProducts={setProducts}
            loading={productsLoading}
          />
        )}
        {tab === 'customers' && (
          <CustomersTab
            orders={orders}
            loading={ordersLoading}
          />
        )}
      </main>
    </div>
  );
}
