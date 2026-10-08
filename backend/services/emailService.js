// services/emailService.js
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT, 10) || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Helper: Customer Receipt Template
const generateReceiptHtml = (order) => {
  const items = Array.isArray(order.items) ? order.items : [];
  
  const itemsRows = items
    .map(
      (item) => `
      <tr style="border-bottom: 1px solid #f0e6df;">
        <td style="padding: 10px 0;">
          <strong>${item.title || 'Item'}</strong><br/>
          <small style="color: #666;">Variant: ${item.variantLabel || 'Standard'} (${item.weight || 'Std'})</small>
        </td>
        <td style="padding: 10px; text-align: center;">${item.quantity || 1}</td>
        <td style="padding: 10px 0; text-align: right;">₹${(item.price || 0) * (item.quantity || 1)}</td>
      </tr>
    `
    )
    .join('');

  const formattedSlot = order.fulfillment?.timeSlot
    ? order.fulfillment.timeSlot.replace(/_/g, ' ')
    : 'Standard Delivery';

  const orderNumber = order._id ? order._id.toString().slice(-8).toUpperCase() : 'NEW';

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0d4cc; border-radius: 8px; overflow: hidden;">
      <div style="background-color: #3b2314; color: #ffffff; padding: 20px; text-align: center;">
        <h2 style="margin: 0;">M Chocolates & Cakes</h2>
        <p style="margin: 5px 0 0; font-size: 14px;">Order Confirmed & In Preparation</p>
      </div>

      <div style="padding: 24px; background-color: #fffaf5;">
        <p>Dear Customer,</p>
        <p>Thank you for choosing artisanal craftsmanship! Your order <strong>#${orderNumber}</strong> has been confirmed.</p>

        <h3 style="color: #3b2314; border-bottom: 2px solid #3b2314; padding-bottom: 5px;">Order Summary</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="text-align: left; color: #777; font-size: 13px;">
              <th>Item</th>
              <th style="text-align: center;">Qty</th>
              <th style="text-align: right;">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${itemsRows}
          </tbody>
        </table>

        <div style="margin-top: 15px; text-align: right; border-top: 1px solid #e0d4cc; padding-top: 10px;">
          <p style="margin: 3px 0;">Items Subtotal: <strong>₹${order.pricing?.itemsTotal || 0}</strong></p>
          <p style="margin: 3px 0;">Delivery Fee: <strong>₹${order.pricing?.deliveryFee || 0}</strong></p>
          <h3 style="margin: 8px 0; color: #3b2314;">Total: ₹${order.pricing?.totalAmount || 0}</h3>
        </div>

        <div style="background-color: #f7ede2; padding: 15px; border-radius: 6px; margin-top: 20px;">
          <h4 style="margin: 0 0 10px; color: #3b2314;">Fulfillment & Customization Details</h4>
          <p style="margin: 4px 0;"><strong>Method:</strong> ${(order.fulfillment?.method || 'delivery').toUpperCase()}</p>
          <p style="margin: 4px 0;"><strong>Delivery Slot:</strong> ${formattedSlot}</p>
          <p style="margin: 4px 0;"><strong>Cake Inscription:</strong> ${order.customizations?.cakeMessage || 'None'}</p>
          <p style="margin: 4px 0;"><strong>Gift Card Note:</strong> ${order.customizations?.greetingCardMessage || 'None'}</p>
          <p style="margin: 4px 0;"><strong>Dietary Note:</strong> ${order.customizations?.dietaryNote || 'Standard'}</p>
        </div>
      </div>
    </div>
  `;
};

// Helper: Kitchen Operational Alert Template
const generateKitchenTicketHtml = (order) => {
  const itemsList = order.items
    .map(
      (item) => `
      <li style="margin-bottom: 8px;">
        <strong>${item.title}</strong> — ${item.variantLabel} (${item.weight || 'Std'}) 
        <span style="color: #d9534f; font-weight: bold;">[x${item.quantity}]</span>
      </li>
    `
    )
    .join('');

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 2px solid #d9534f; border-radius: 8px; overflow: hidden;">
      <div style="background-color: #d9534f; color: #ffffff; padding: 15px; text-align: center;">
        <h2 style="margin: 0;">🎂 NEW KITCHEN BAKING TICKET</h2>
        <p style="margin: 4px 0 0; font-size: 14px;">Order #${order._id.toString().slice(-8).toUpperCase()} | ${order.fulfillment.method.toUpperCase()}</p>
      </div>

      <div style="padding: 20px; background-color: #ffffff;">
        <div style="background-color: #fff3cd; border-left: 4px solid #ffeeba; padding: 12px; margin-bottom: 18px;">
          <h4 style="margin: 0 0 6px; color: #856404;">⚠️ DOMAIN CUSTOMIZATIONS</h4>
          <p style="margin: 3px 0;"><strong>Cake Inscription:</strong> "${order.customizations?.cakeMessage || 'None'}"</p>
          <p style="margin: 3px 0;"><strong>Card Message:</strong> "${order.customizations?.greetingCardMessage || 'None'}"</p>
          <p style="margin: 3px 0; color: #b71c1c;"><strong>Dietary Requirements:</strong> ${order.customizations?.dietaryNote || 'None (Standard)'}</p>
        </div>

        <h4 style="margin: 0 0 8px; color: #333;">Items to Bake / Prepare:</h4>
        <ul style="padding-left: 20px; color: #333;">
          ${itemsList}
        </ul>

        <div style="background-color: #f8f9fa; border: 1px solid #e9ecef; padding: 12px; border-radius: 4px; margin-top: 15px;">
          <p style="margin: 3px 0;"><strong>Delivery Slot:</strong> ${order.fulfillment.timeSlot.replace(/_/g, ' ')}</p>
          <p style="margin: 3px 0;"><strong>Fulfillment Date:</strong> ${new Date(order.fulfillment.deliveryDate).toLocaleDateString()}</p>
          ${
            order.fulfillment.method === 'delivery'
              ? `<p style="margin: 3px 0;"><strong>Recipient:</strong> ${order.fulfillment.shippingAddress?.recipientName} (${order.fulfillment.shippingAddress?.recipientPhone})</p>
                 <p style="margin: 3px 0;"><strong>Address:</strong> ${order.fulfillment.shippingAddress?.street}, ${order.fulfillment.shippingAddress?.city}</p>`
              : '<p style="margin: 3px 0;"><strong>Pickup:</strong> Customer picking up in store.</p>'
          }
          <p style="margin: 3px 0;"><strong>Payment Status:</strong> ${order.payment.status.toUpperCase()} (${order.payment.method})</p>
        </div>
      </div>
    </div>
  `;
};

// Send Customer Email
exports.sendCustomerOrderReceipt = async (customerEmail, order) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: customerEmail,
      subject: `Order Confirmed: #${order._id.toString().slice(-8).toUpperCase()} - M Chocolates & Cakes`,
      html: generateReceiptHtml(order)
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Receipt dispatched to customer (${customerEmail}): ${info.messageId}`);
    return true;
  } catch (error) {
    console.error('Customer receipt failed:', error.message);
    return false;
  }
};

// Send Kitchen Owner Alert Email
exports.sendKitchenOrderAlert = async (order) => {
  try {
    const kitchenRecipient = process.env.KITCHEN_NOTIFICATION_EMAIL || process.env.EMAIL_USER;

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: kitchenRecipient,
      subject: `[KITCHEN TICKET] Order #${order._id.toString().slice(-8).toUpperCase()} - ${order.fulfillment.timeSlot.replace(/_/g, ' ')}`,
      html: generateKitchenTicketHtml(order)
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Kitchen baking ticket dispatched to owner (${kitchenRecipient}): ${info.messageId}`);
    return true;
  } catch (error) {
    console.error('Kitchen alert failed:', error.message);
    return false;
  }
};

// Append to services/emailService.js

// Send Status Update Email to Customer
exports.sendStatusUpdateEmail = async (customerEmail, order) => {
  try {
    const statusMessages = {
      in_kitchen: 'Your treats are now being freshly prepared and baked in our kitchen!',
      ready_for_pickup: 'Your order is freshly packed and ready for store pickup!',
      out_for_delivery: 'Your bakery treats are out for delivery! Please keep your phone handy.',
      delivered: 'Your order has been delivered. Enjoy your sweet treats!'
    };

    const currentMsg = statusMessages[order.orderStatus] || `Your order status is now: ${order.orderStatus}`;

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: customerEmail,
      subject: `Order Update: #${order._id.toString().slice(-8).toUpperCase()} is now ${order.orderStatus.replace(/_/g, ' ').toUpperCase()}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e0d4cc; border-radius: 6px;">
          <h3 style="color: #3b2314;">M Chocolates & Cakes</h3>
          <p>Hi,</p>
          <p><strong>${currentMsg}</strong></p>
          <p>Order ID: <strong>#${order._id.toString().slice(-8).toUpperCase()}</strong></p>
          <p>Delivery Slot: <strong>${order.fulfillment.timeSlot.replace(/_/g, ' ')}</strong></p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Status email dispatch failed:', error.message);
  }
};

// Send Cancellation Confirmation Email
exports.sendCancellationEmail = async (customerEmail, order) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: customerEmail,
      subject: `Order Cancelled: #${order._id.toString().slice(-8).toUpperCase()}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #f5c6cb; border-radius: 6px;">
          <h3 style="color: #721c24;">Order Cancelled</h3>
          <p>Your order <strong>#${order._id.toString().slice(-8).toUpperCase()}</strong> has been cancelled.</p>
          <p>Reason: <em>${order.cancellationReason || 'Requested by customer/bakery'}</em></p>
          <p>If you were charged online, our team will initiate your refund within 3–5 business days.</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Cancellation email dispatch failed:', error.message);
  }
};