import { Order } from "@/types/checkout";
import { CartItem } from "@/types/cart";

interface FeedbackEmailData {
  customerName: string;
  orderId: string;
  orderItems: Array<{
    name: string;
    quantity: number;
  }>;
  pickupTime: string;
  feedbackLink: string;
}

const generateFeedbackLink = (orderId: string): string => {
  // In production, this should be a proper URL with a secure token
  return `${process.env.NEXT_PUBLIC_APP_URL}/feedback/${orderId}`;
};

const generateFeedbackEmailTemplate = (data: FeedbackEmailData): string => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">How was your experience?</h2>
      <p>Hi ${data.customerName},</p>
      <p>Thank you for choosing our restaurant! We hope you enjoyed your meal.</p>
      
      <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #444;">Your Order Details:</h3>
        <p><strong>Order ID:</strong> ${data.orderId}</p>
        <p><strong>Pickup Time:</strong> ${data.pickupTime}</p>
        <ul style="list-style: none; padding: 0;">
          ${data.orderItems.map(item => `
            <li style="margin: 5px 0;">${item.quantity}x ${item.name}</li>
          `).join('')}
        </ul>
      </div>

      <p>We'd love to hear your feedback! Please take a moment to rate your experience:</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${data.feedbackLink}" 
           style="background-color: #4CAF50; color: white; padding: 12px 24px; 
                  text-decoration: none; border-radius: 4px; display: inline-block;">
          Share Your Feedback
        </a>
      </div>

      <p style="color: #666; font-size: 14px;">
        Your feedback helps us improve our service and provide a better experience for all our customers.
      </p>
    </div>
  `;
};

export const sendFeedbackEmail = async (order: Order): Promise<void> => {
  try {
    const feedbackLink = generateFeedbackLink(order.id);
    
    const emailData: FeedbackEmailData = {
      customerName: order.customerDetails.name,
      orderId: order.id,
      orderItems: order.items.map((item: CartItem) => ({
        name: item.itemName,
        quantity: item.quantity
      })),
      pickupTime: order.pickupTime,
      feedbackLink
    };

    const emailHtml = generateFeedbackEmailTemplate(emailData);

    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: order.customerDetails.email,
        subject: 'How was your meal? Share your feedback!',
        html: emailHtml
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to send feedback email');
    }

    console.log(`Feedback email sent for order ${order.id}`);
  } catch (error) {
    console.error('Error sending feedback email:', error);
    throw error;
  }
}; 