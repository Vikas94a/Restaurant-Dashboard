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
  // Generate secure feedback link using order ID
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return `${baseUrl}/feedback/${orderId}`;
};

const generateFeedbackEmailTemplate = (data: FeedbackEmailData): string => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa; padding: 20px;">
      <div style="background-color: white; border-radius: 12px; padding: 30px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2c3e50; margin: 0; font-size: 28px;">🍽️ How was your experience?</h1>
        </div>
        
        <p style="color: #34495e; font-size: 16px; line-height: 1.6;">Hi <strong>${data.customerName}</strong>,</p>
        <p style="color: #34495e; font-size: 16px; line-height: 1.6;">Thank you for choosing our restaurant! We hope you enjoyed your meal and had a great experience.</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #3498db;">
          <h3 style="color: #2c3e50; margin-top: 0; margin-bottom: 15px;">📋 Your Order Summary:</h3>
          <p style="margin: 8px 0; color: #34495e;"><strong>Order ID:</strong> <code style="background-color: #ecf0f1; padding: 2px 6px; border-radius: 4px;">${data.orderId}</code></p>
          <p style="margin: 8px 0; color: #34495e;"><strong>Pickup Time:</strong> ${data.pickupTime}</p>
          <div style="margin-top: 15px;">
            <strong style="color: #2c3e50;">Items Ordered:</strong>
            <ul style="list-style: none; padding: 0; margin: 10px 0;">
              ${data.orderItems.map(item => `
                <li style="margin: 5px 0; padding: 5px 10px; background-color: white; border-radius: 4px; color: #34495e;">
                  ${item.quantity}x ${item.name}
                </li>
              `).join('')}
            </ul>
          </div>
        </div>

        <p style="color: #34495e; font-size: 16px; line-height: 1.6; margin: 25px 0;">
          We'd love to hear about your experience! Your feedback helps us improve and provide better service for everyone.
        </p>
        
        <div style="text-align: center; margin: 35px 0;">
          <a href="${data.feedbackLink}" 
             style="background: linear-gradient(135deg, #4CAF50, #45a049); color: white; padding: 15px 30px; 
                    text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px;
                    box-shadow: 0 4px 8px rgba(76, 175, 80, 0.3); transition: all 0.3s ease;">
            ⭐ Share Your Feedback
          </a>
        </div>

        <div style="background-color: #e8f5e8; padding: 15px; border-radius: 8px; margin: 25px 0; border: 1px solid #c8e6c9;">
          <p style="color: #2e7d32; font-size: 14px; margin: 0; text-align: center;">
            💡 <strong>Quick & Easy:</strong> Just click the button above and rate your experience. No need to enter your details again!
          </p>
        </div>

        <p style="color: #7f8c8d; font-size: 14px; text-align: center; margin: 30px 0 0 0;">
          Your feedback is valuable to us and helps us serve you better. Thank you for taking the time to share your experience!
        </p>
        
        <hr style="border: none; border-top: 1px solid #ecf0f1; margin: 25px 0;">
        <p style="color: #95a5a6; font-size: 12px; text-align: center; margin: 0;">
          This feedback link is unique to your order and can only be used once.
        </p>
      </div>
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

    } catch (error) {
    throw error;
  }
}; 