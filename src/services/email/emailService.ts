import { Order } from '@/types/checkout';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

interface EmailData {
  to: string;
  subject: string;
  html: string;
}

interface RestaurantData {
  name: string;
  streetName: string;
  zipCode: string;
  city: string;
  phoneNumber: string;
  domain: string;
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
  const { customerDetails, items, total, estimatedPickupTime, pickupTime, restaurantId, pickupOption } = order;
  
  // Fetch restaurant details
  let restaurantData: RestaurantData | null = null;
  try {
    const restaurantRef = doc(db, 'restaurants', restaurantId);
    const restaurantSnap = await getDoc(restaurantRef);
    if (restaurantSnap.exists()) {
      restaurantData = restaurantSnap.data() as RestaurantData;
    }
  } catch (error) {
    console.error('Error fetching restaurant data:', error);
  }

  // Calculate subtotal from all items (including extras/customizations)
  const subtotal = items.reduce((sum, item) => {
    return sum + (item.itemPrice * item.quantity);
  }, 0);

  // Calculate VAT (15% MVA - Norwegian VAT)
  const VAT_RATE = 0.15;
  const vatAmount = subtotal * VAT_RATE;
  const totalWithVAT = subtotal + vatAmount;

  const itemsList = items.map(item => {
    let itemDetails = `${item.itemName} x ${item.quantity}`;
    
    // Add customizations if available
    if (item.customizations && item.customizations.length > 0) {
      const customizationText = item.customizations
        .flatMap(custom => 
          custom.options.map(option => `  • ${option.name} (+${option.price.toFixed(2)} kr)`)
        )
        .join('<br/>');
      if (customizationText) {
        itemDetails += `<br/><span style="font-size: 12px; color: #666;">${customizationText}</span>`;
      }
    }
    
    return `
    <tr>
      <td style="padding: 12px 8px; border-bottom: 1px solid #eee; vertical-align: top;">${itemDetails}</td>
      <td style="padding: 12px 8px; border-bottom: 1px solid #eee; text-align: right; vertical-align: top; white-space: nowrap;">${(item.itemPrice * item.quantity).toFixed(2)} kr</td>
    </tr>
  `}).join('');

  // Determine pickup time display
  let displayPickupTime;
  
  if (pickupOption === 'asap') {
    // For ASAP orders, show the estimated pickup time the restaurant set
    if (estimatedPickupTime) {
      // Check if "minutes" or "minutter" is already in the text
      const hasTimeUnit = estimatedPickupTime.toLowerCase().includes('minute') || 
                          estimatedPickupTime.toLowerCase().includes('min');
      if (hasTimeUnit) {
        displayPickupTime = `Ready in ${estimatedPickupTime}`;
      } else {
        displayPickupTime = `Ready in ${estimatedPickupTime} minutes`;
      }
    } else {
      displayPickupTime = 'To be determined - restaurant will confirm soon';
    }
  } else {
    // For scheduled orders, show the scheduled time
    displayPickupTime = pickupTime || 'To be determined';
  }
  
  // Build restaurant info section
  const restaurantInfo = restaurantData ? `
    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="color: #333; margin-top: 0; font-size: 18px;">📍 Pickup Location</h3>
      <p style="margin: 8px 0; font-size: 15px;"><strong>${restaurantData.name}</strong></p>
      <p style="margin: 4px 0; color: #555;">${restaurantData.streetName}</p>
      <p style="margin: 4px 0; color: #555;">${restaurantData.zipCode} ${restaurantData.city}</p>
    </div>
  ` : '';

  const contactInfo = restaurantData ? `
    <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
      <h3 style="color: #333; margin-top: 0; font-size: 16px;">💡 Need Help?</h3>
      <p style="margin: 8px 0; color: #555;">If you have any questions or need to make changes to your order, please don't hesitate to contact us:</p>
      <p style="margin: 8px 0; color: #333;">
        <strong>📞 Phone:</strong> ${restaurantData.phoneNumber}<br/>
        <strong>🌐 Website:</strong> <a href="https://${restaurantData.domain}" style="color: #007bff; text-decoration: none;">https://${restaurantData.domain}</a>
      </p>
    </div>
  ` : '';

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff;">
      <!-- Header -->
      <div style="text-align: center; padding: 30px 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px 12px 0 0;">
        <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">✅ Order Confirmed!</h1>
      </div>
      
      <!-- Content -->
      <div style="padding: 30px; background-color: #ffffff; border: 1px solid #e9ecef; border-top: none; border-radius: 0 0 12px 12px;">
        <p style="font-size: 16px; color: #333; margin-bottom: 10px;">Dear <strong>${customerDetails.name}</strong>,</p>
        <p style="font-size: 15px; color: #555; line-height: 1.6;">Thank you for your order! We're preparing it with care. Below are your order details:</p>
        
        <!-- Order Details -->
        <div style="margin: 25px 0;">
          <h3 style="color: #333; font-size: 18px; margin-bottom: 15px; border-bottom: 2px solid #667eea; padding-bottom: 8px;">🛒 Order Details</h3>
          <table style="width: 100%; border-collapse: collapse; margin: 15px 0; background-color: #fff;">
            ${itemsList}
            <tr>
              <td style="padding: 12px 8px; padding-top: 15px; color: #666; font-size: 14px;">Subtotal</td>
              <td style="padding: 12px 8px; padding-top: 15px; text-align: right; color: #666; font-size: 14px; white-space: nowrap;">${subtotal.toFixed(2)} kr</td>
            </tr>
            <tr>
              <td style="padding: 8px; color: #666; font-size: 14px;">MVA (15%)</td>
              <td style="padding: 8px; text-align: right; color: #666; font-size: 14px; white-space: nowrap;">${vatAmount.toFixed(2)} kr</td>
            </tr>
            <tr>
              <td style="padding: 15px 8px; font-weight: bold; font-size: 16px; border-top: 2px solid #333;">Total Amount</td>
              <td style="padding: 15px 8px; text-align: right; font-weight: bold; font-size: 16px; border-top: 2px solid #333; white-space: nowrap;">${totalWithVAT.toFixed(2)} kr</td>
            </tr>
          </table>
        </div>

        <!-- Pickup Information -->
        <div style="background-color: #e7f3ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2196F3;">
          <h3 style="color: #333; margin-top: 0; font-size: 18px;">⏰ Pickup Time</h3>
          <p style="margin: 0; font-size: 20px; color: #2196F3; font-weight: bold;">${displayPickupTime}</p>
        </div>

        ${restaurantInfo}

        <!-- Payment Method -->
        <div style="margin: 20px 0;">
          <p style="color: #555; font-size: 14px; margin: 5px 0;"><strong>💳 Payment Method:</strong> Pay at pickup</p>
        </div>

        ${contactInfo}

        <!-- Footer -->
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6;">
          <p style="color: #6c757d; font-size: 14px; margin: 5px 0;">We look forward to serving you!</p>
          <p style="color: #6c757d; font-size: 14px; margin: 5px 0;">Thank you for choosing ${restaurantData?.name || 'us'}! 🙏</p>
        </div>
      </div>
    </div>
  `;

  const restaurantName = restaurantData?.name || 'AI Eat Easy';
  return sendEmail({
    to: customerDetails.email,
    subject: `Order Confirmed - ${restaurantName}`,
    html,
  });
};

export const sendOrderRejectionEmail = async (order: Order) => {
  const { customerDetails, items, total, restaurantId } = order;
  
  // Fetch restaurant details
  let restaurantData: RestaurantData | null = null;
  try {
    const restaurantRef = doc(db, 'restaurants', restaurantId);
    const restaurantSnap = await getDoc(restaurantRef);
    if (restaurantSnap.exists()) {
      restaurantData = restaurantSnap.data() as RestaurantData;
    }
  } catch (error) {
    console.error('Error fetching restaurant data:', error);
  }

  // Calculate subtotal from all items (including extras/customizations)
  const subtotal = items.reduce((sum, item) => {
    return sum + (item.itemPrice * item.quantity);
  }, 0);

  // Calculate VAT (15% MVA - Norwegian VAT)
  const VAT_RATE = 0.15;
  const vatAmount = subtotal * VAT_RATE;
  const totalWithVAT = subtotal + vatAmount;

  const itemsList = items.map(item => {
    let itemDetails = `${item.itemName} x ${item.quantity}`;
    
    // Add customizations if available
    if (item.customizations && item.customizations.length > 0) {
      const customizationText = item.customizations
        .flatMap(custom => 
          custom.options.map(option => `  • ${option.name} (+${option.price.toFixed(2)} kr)`)
        )
        .join('<br/>');
      if (customizationText) {
        itemDetails += `<br/><span style="font-size: 12px; color: #666;">${customizationText}</span>`;
      }
    }
    
    return `
    <tr>
      <td style="padding: 12px 8px; border-bottom: 1px solid #eee; vertical-align: top;">${itemDetails}</td>
      <td style="padding: 12px 8px; border-bottom: 1px solid #eee; text-align: right; vertical-align: top; white-space: nowrap;">${(item.itemPrice * item.quantity).toFixed(2)} kr</td>
    </tr>
  `}).join('');

  const contactInfo = restaurantData ? `
    <div style="background-color: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2196F3;">
      <h3 style="color: #333; margin-top: 0; font-size: 16px;">📞 Contact Us</h3>
      <p style="margin: 8px 0; color: #555;">For more information or to place a new order, please contact us:</p>
      <p style="margin: 8px 0; color: #333;">
        <strong>📞 Phone:</strong> ${restaurantData.phoneNumber}<br/>
        <strong>🌐 Website:</strong> <a href="https://${restaurantData.domain}" style="color: #007bff; text-decoration: none;">https://${restaurantData.domain}</a>
      </p>
      ${restaurantData.name ? `<p style="margin: 8px 0; color: #333;"><strong>Restaurant:</strong> ${restaurantData.name}</p>` : ''}
    </div>
  ` : '';

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff;">
      <!-- Header -->
      <div style="text-align: center; padding: 30px 0; background: linear-gradient(135deg, #f44336 0%, #e91e63 100%); border-radius: 12px 12px 0 0;">
        <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">⚠️ Order Update</h1>
      </div>
      
      <!-- Content -->
      <div style="padding: 30px; background-color: #ffffff; border: 1px solid #e9ecef; border-top: none; border-radius: 0 0 12px 12px;">
        <p style="font-size: 16px; color: #333; margin-bottom: 10px;">Dear <strong>${customerDetails.name}</strong>,</p>
        <p style="font-size: 15px; color: #555; line-height: 1.6;">We regret to inform you that your order could not be processed at this time. We sincerely apologize for any inconvenience this may cause.</p>
        
        ${order.cancellationReason ? `
        <div style="background-color: #ffebee; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f44336;">
          <h4 style="color: #333; margin: 0 0 10px 0; font-size: 16px;">📝 Reason for Cancellation:</h4>
          <p style="margin: 0; color: #555; font-size: 14px;">${order.cancellationReason}</p>
        </div>
        ` : ''}
        
        <!-- Order Details -->
        <div style="margin: 25px 0;">
          <h3 style="color: #333; font-size: 18px; margin-bottom: 15px; border-bottom: 2px solid #f44336; padding-bottom: 8px;">🛒 Order Details</h3>
          <table style="width: 100%; border-collapse: collapse; margin: 15px 0; background-color: #fff;">
            ${itemsList}
            <tr>
              <td style="padding: 12px 8px; padding-top: 15px; color: #666; font-size: 14px;">Subtotal</td>
              <td style="padding: 12px 8px; padding-top: 15px; text-align: right; color: #666; font-size: 14px; white-space: nowrap;">${subtotal.toFixed(2)} kr</td>
            </tr>
            <tr>
              <td style="padding: 8px; color: #666; font-size: 14px;">MVA (15%)</td>
              <td style="padding: 8px; text-align: right; color: #666; font-size: 14px; white-space: nowrap;">${vatAmount.toFixed(2)} kr</td>
            </tr>
            <tr>
              <td style="padding: 15px 8px; font-weight: bold; font-size: 16px; border-top: 2px solid #333;">Total Amount</td>
              <td style="padding: 15px 8px; text-align: right; font-weight: bold; font-size: 16px; border-top: 2px solid #333; white-space: nowrap;">${totalWithVAT.toFixed(2)} kr</td>
            </tr>
          </table>
        </div>

        <!-- Important Notice -->
        <div style="background-color: #fff3e0; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ff9800;">
          <p style="margin: 0; color: #555; font-size: 14px;"><strong>⚡ Important:</strong> No charges will be made for this order. You may place a new order at your convenience.</p>
        </div>

        ${contactInfo}

        <!-- Footer -->
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6;">
          <p style="color: #6c757d; font-size: 14px; margin: 5px 0;">We apologize for any inconvenience and hope to serve you soon.</p>
          <p style="color: #6c757d; font-size: 14px; margin: 5px 0;">Thank you for your understanding. 🙏</p>
        </div>
      </div>
    </div>
  `;

  const restaurantName = restaurantData?.name || 'AI Eat Easy';
  return sendEmail({
    to: customerDetails.email,
    subject: `Order Update - ${restaurantName}`,
    html,
  });
};

// Send feedback request email after order completion
export const sendFeedbackEmail = async (order: Order) => {
  const { id: orderId, customerDetails, restaurantId } = order;
  
  // Fetch restaurant details
  let restaurantData: RestaurantData | null = null;
  try {
    const restaurantRef = doc(db, 'restaurants', restaurantId);
    const restaurantSnap = await getDoc(restaurantRef);
    if (restaurantSnap.exists()) {
      restaurantData = restaurantSnap.data() as RestaurantData;
    }
  } catch (error) {
    console.error('Error fetching restaurant data:', error);
  }

  const restaurantName = restaurantData?.name || 'AI Eat Easy';
  const feedbackUrl = `https://aieateasy.no/feedback/${orderId}`;

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff;">
      <!-- Header -->
      <div style="text-align: center; padding: 30px 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px 12px 0 0;">
        <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">🍽️ Thank You!</h1>
      </div>
      
      <!-- Content -->
      <div style="padding: 30px; background-color: #ffffff; border: 1px solid #e9ecef; border-top: none; border-radius: 0 0 12px 12px;">
        <p style="font-size: 16px; color: #333; margin-bottom: 10px;">Dear <strong>${customerDetails.name}</strong>,</p>
        <p style="font-size: 15px; color: #555; line-height: 1.6;">
          Thank you for choosing ${restaurantName}! We hope you enjoyed your meal. 
        </p>
        
        <!-- Feedback Request -->
        <div style="background-color: #f8f9fa; padding: 25px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #667eea;">
          <h3 style="color: #333; margin-top: 0; font-size: 18px; margin-bottom: 15px;">⭐ We'd Love Your Feedback!</h3>
          <p style="margin: 10px 0; color: #555; font-size: 14px;">
            Your opinion matters to us! Please take a moment to rate your experience and let us know how we did.
          </p>
          <p style="margin: 15px 0; color: #555; font-size: 14px;">
            Your feedback helps us improve and serve you better.
          </p>
        </div>

        <!-- CTA Button -->
        <div style="text-align: center; margin: 30px 0;">
          <a href="${feedbackUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(102, 126, 234, 0.3);">
            Share Your Feedback
          </a>
        </div>

        <!-- Alternative Link -->
        <div style="text-align: center; margin: 20px 0;">
          <p style="font-size: 12px; color: #999; margin-bottom: 5px;">Or copy this link:</p>
          <p style="font-size: 12px; color: #667eea; word-break: break-all;">${feedbackUrl}</p>
        </div>

        ${restaurantData ? `
        <!-- Restaurant Contact -->
        <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
          <h3 style="color: #333; margin-top: 0; font-size: 16px;">📞 Questions?</h3>
          <p style="margin: 8px 0; color: #555; font-size: 14px;">Feel free to reach out to us:</p>
          <p style="margin: 8px 0; color: #333; font-size: 14px;">
            <strong>Phone:</strong> ${restaurantData.phoneNumber}<br/>
            <strong>Website:</strong> <a href="https://${restaurantData.domain}" style="color: #007bff; text-decoration: none;">https://${restaurantData.domain}</a>
          </p>
        </div>
        ` : ''}

        <!-- Footer -->
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6;">
          <p style="color: #6c757d; font-size: 14px; margin: 5px 0;">
            We look forward to serving you again soon!
          </p>
          <p style="color: #6c757d; font-size: 14px; margin: 5px 0;">
            - ${restaurantName} Team 🙏
          </p>
        </div>
      </div>
    </div>
  `;

  return sendEmail({
    to: customerDetails.email,
    subject: `Thank you for choosing ${restaurantName}! We'd love your feedback 🍽️`,
    html,
  });
};