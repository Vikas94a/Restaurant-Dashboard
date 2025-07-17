import { Order } from '@/types/checkout';

interface EmailData {
  to: string;
  subject: string;
  html: string;
}

export const sendEmail = async ({ to, subject, html }: EmailData) => {
  try {
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ to, subject, html }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to send email');
    }

    return data;
  } catch (error) {
    // Don't throw the error, just log it and return null
    // This way the order status update can still proceed
    return null;
  }
};

export const sendOrderConfirmationEmail = async (order: Order) => {
  const { customerDetails, items, total, estimatedPickupTime } = order;
  
  const itemsList = items.map(item => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.itemName} x ${item.quantity}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${(item.itemPrice * item.quantity).toFixed(2)} kr</td>
    </tr>
  `).join('');

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #333;">Order Confirmed!</h2>
      <p>Dear ${customerDetails.name},</p>
      <p>Your order has been confirmed. Here are your order details:</p>
      
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        ${itemsList}
        <tr>
          <td style="padding: 8px; font-weight: bold;">Total</td>
          <td style="padding: 8px; text-align: right; font-weight: bold;">${total.toFixed(2)} kr</td>
        </tr>
      </table>

      <p><strong>Estimated Pickup Time:</strong> ${estimatedPickupTime || 'To be determined'}</p>
      
      <p>Thank you for choosing AI Eat Easy!</p>
    </div>
  `;

  return sendEmail({
    to: customerDetails.email,
    subject: 'Order Confirmed - AI Eat Easy',
    html,
  });
};

export const sendOrderRejectionEmail = async (order: Order) => {
  const { customerDetails, items, total } = order;
  
  const itemsList = items.map(item => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.itemName} x ${item.quantity}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${(item.itemPrice * item.quantity).toFixed(2)} kr</td>
    </tr>
  `).join('');

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #333;">Order Update</h2>
      <p>Dear ${customerDetails.name},</p>
      <p>We regret to inform you that your order could not be processed at this time.</p>
      
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        ${itemsList}
        <tr>
          <td style="padding: 8px; font-weight: bold;">Total</td>
          <td style="padding: 8px; text-align: right; font-weight: bold;">${total.toFixed(2)} kr</td>
        </tr>
      </table>

      <p>Please contact the restaurant directly for more information.</p>
      <p>We apologize for any inconvenience caused.</p>
    </div>
  `;

  return sendEmail({
    to: customerDetails.email,
    subject: 'Order Update - AI Eat Easy',
    html,
  });
}; 