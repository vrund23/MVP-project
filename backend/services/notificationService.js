// services/notificationService.js
const User = require('../models/User');
const { sendCustomerOrderReceipt, sendKitchenOrderAlert } = require('./emailService');

exports.dispatchOrderConfirmationAlerts = (customerEmailOrId, order) => {
  setImmediate(async () => {
    try {
      let recipientEmail = customerEmailOrId;

      // If email was not passed or is an ObjectId, fetch the real email from DB
      if (!recipientEmail || recipientEmail.includes('@') === false) {
        const customer = await User.findById(order.customer).select('email');
        recipientEmail = customer?.email;
      }

      if (!recipientEmail) {
        console.error('Email dispatch aborted: No valid customer email found.');
        return;
      }

      await Promise.allSettled([
        sendCustomerOrderReceipt(recipientEmail, order),
        sendKitchenOrderAlert(order)
      ]);
    } catch (err) {
      console.error('Notification Orchestrator error:', err.message);
    }
  });
};