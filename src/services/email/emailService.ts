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
        displayPickupTime = `Klar om ${estimatedPickupTime}`;
      } else {
        displayPickupTime = `Klar om ${estimatedPickupTime} minutter`;
      }
    } else {
      displayPickupTime = 'Skal bestemmes - restauranten vil bekrefte snart';
    }
  } else {
    // For scheduled orders, show the scheduled time
    displayPickupTime = pickupTime || 'To be determined';
  }
  
  // Build restaurant info section
  const restaurantInfo = restaurantData ? `
    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="color: #333; margin-top: 0; font-size: 18px;">📍 Hentested</h3>
      <p style="margin: 8px 0; font-size: 15px;"><strong>${restaurantData.name}</strong></p>
      <p style="margin: 4px 0; color: #555;">${restaurantData.streetName}</p>
      <p style="margin: 4px 0; color: #555;">${restaurantData.zipCode} ${restaurantData.city}</p>
    </div>
  ` : '';

  const contactInfo = restaurantData ? `
    <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
      <h3 style="color: #333; margin-top: 0; font-size: 16px;">💡 Trenger du hjelp?</h3>
      <p style="margin: 8px 0; color: #555;">Hvis du har spørsmål eller trenger å gjøre endringer i bestillingen din, vennligst ikke nøl med å kontakte oss:</p>
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
        <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">✅ Bestilling Bekreftet!</h1>
      </div>
      
      <!-- Content -->
      <div style="padding: 30px; background-color: #ffffff; border: 1px solid #e9ecef; border-top: none; border-radius: 0 0 12px 12px;">
        <p style="font-size: 16px; color: #333; margin-bottom: 10px;">Kjære <strong>${customerDetails.name}</strong>,</p>
        <p style="font-size: 15px; color: #555; line-height: 1.6;">Takk for bestillingen din! Vi forbereder den med omsorg. Nedenfor er dine bestillingsdetaljer:</p>
        
        <!-- Order Details -->
        <div style="margin: 25px 0;">
          <h3 style="color: #333; font-size: 18px; margin-bottom: 15px; border-bottom: 2px solid #667eea; padding-bottom: 8px;">🛒 Bestillingsdetaljer</h3>
          <table style="width: 100%; border-collapse: collapse; margin: 15px 0; background-color: #fff;">
            ${itemsList}
            <tr>
              <td style="padding: 12px 8px; padding-top: 15px; color: #666; font-size: 14px;">Delsum</td>
              <td style="padding: 12px 8px; padding-top: 15px; text-align: right; color: #666; font-size: 14px; white-space: nowrap;">${subtotal.toFixed(2)} kr</td>
            </tr>
            <tr>
              <td style="padding: 8px; color: #666; font-size: 14px;">MVA (15%)</td>
              <td style="padding: 8px; text-align: right; color: #666; font-size: 14px; white-space: nowrap;">${vatAmount.toFixed(2)} kr</td>
            </tr>
            <tr>
              <td style="padding: 15px 8px; font-weight: bold; font-size: 16px; border-top: 2px solid #333;">Totalt Beløp</td>
              <td style="padding: 15px 8px; text-align: right; font-weight: bold; font-size: 16px; border-top: 2px solid #333; white-space: nowrap;">${totalWithVAT.toFixed(2)} kr</td>
            </tr>
          </table>
        </div>

        <!-- Pickup Information -->
        <div style="background-color: #e7f3ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2196F3;">
          <h3 style="color: #333; margin-top: 0; font-size: 18px;">⏰ Hentetid</h3>
          <p style="margin: 0; font-size: 20px; color: #2196F3; font-weight: bold;">${displayPickupTime}</p>
        </div>

        ${restaurantInfo}

        <!-- Payment Method -->
        <div style="margin: 20px 0;">
          <p style="color: #555; font-size: 14px; margin: 5px 0;"><strong>💳 Betalingsmetode:</strong> Betal ved henting</p>
        </div>

        ${contactInfo}

        <!-- Footer -->
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6;">
          <p style="color: #6c757d; font-size: 14px; margin: 5px 0;">Vi gleder oss til å betjene deg!</p>
          <p style="color: #6c757d; font-size: 14px; margin: 5px 0;">Takk for at du valgte ${restaurantData?.name || 'oss'}! 🙏</p>
        </div>
      </div>
    </div>
  `;

  const restaurantName = restaurantData?.name || 'AI Eat Easy';
  return sendEmail({
    to: customerDetails.email,
    subject: `Bestilling Bekreftet - ${restaurantName}`,
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
      <h3 style="color: #333; margin-top: 0; font-size: 16px;">📞 Kontakt Oss</h3>
      <p style="margin: 8px 0; color: #555;">For mer informasjon eller for å legge inn en ny bestilling, vennligst kontakt oss:</p>
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
        <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">⚠️ Bestillingsoppdatering</h1>
      </div>
      
      <!-- Content -->
      <div style="padding: 30px; background-color: #ffffff; border: 1px solid #e9ecef; border-top: none; border-radius: 0 0 12px 12px;">
        <p style="font-size: 16px; color: #333; margin-bottom: 10px;">Kjære <strong>${customerDetails.name}</strong>,</p>
        <p style="font-size: 15px; color: #555; line-height: 1.6;">Vi beklager å måtte informere deg om at bestillingen din ikke kunne behandles for øyeblikket. Vi beklager oppriktig for eventuelle ulemper dette kan forårsake.</p>
        
        ${order.cancellationReason ? `
        <div style="background-color: #ffebee; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f44336;">
          <h4 style="color: #333; margin: 0 0 10px 0; font-size: 16px;">📝 Grunn til avbestilling:</h4>
          <p style="margin: 0; color: #555; font-size: 14px;">${order.cancellationReason}</p>
        </div>
        ` : ''}
        
        <!-- Order Details -->
        <div style="margin: 25px 0;">
          <h3 style="color: #333; font-size: 18px; margin-bottom: 15px; border-bottom: 2px solid #f44336; padding-bottom: 8px;">🛒 Bestillingsdetaljer</h3>
          <table style="width: 100%; border-collapse: collapse; margin: 15px 0; background-color: #fff;">
            ${itemsList}
            <tr>
              <td style="padding: 12px 8px; padding-top: 15px; color: #666; font-size: 14px;">Delsum</td>
              <td style="padding: 12px 8px; padding-top: 15px; text-align: right; color: #666; font-size: 14px; white-space: nowrap;">${subtotal.toFixed(2)} kr</td>
            </tr>
            <tr>
              <td style="padding: 8px; color: #666; font-size: 14px;">MVA (15%)</td>
              <td style="padding: 8px; text-align: right; color: #666; font-size: 14px; white-space: nowrap;">${vatAmount.toFixed(2)} kr</td>
            </tr>
            <tr>
              <td style="padding: 15px 8px; font-weight: bold; font-size: 16px; border-top: 2px solid #333;">Totalt Beløp</td>
              <td style="padding: 15px 8px; text-align: right; font-weight: bold; font-size: 16px; border-top: 2px solid #333; white-space: nowrap;">${totalWithVAT.toFixed(2)} kr</td>
            </tr>
          </table>
        </div>

        <!-- Important Notice -->
        <div style="background-color: #fff3e0; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ff9800;">
          <p style="margin: 0; color: #555; font-size: 14px;"><strong>⚡ Viktig:</strong> Ingen gebyrer vil bli belastet for denne bestillingen. Du kan legge inn en ny bestilling når det passer deg.</p>
        </div>

        ${contactInfo}

        <!-- Footer -->
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6;">
          <p style="color: #6c757d; font-size: 14px; margin: 5px 0;">Vi beklager eventuelle ulemper og håper å betjene deg snart.</p>
          <p style="color: #6c757d; font-size: 14px; margin: 5px 0;">Takk for din forståelse. 🙏</p>
        </div>
      </div>
    </div>
  `;

  const restaurantName = restaurantData?.name || 'AI Eat Easy';
  return sendEmail({
    to: customerDetails.email,
    subject: `Bestillingsoppdatering - ${restaurantName}`,
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

// Send reservation confirmation email
export const sendReservationConfirmationEmail = async (reservation: any) => {
  const { customerDetails, reservationDetails, restaurantId } = reservation;
  
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
  
  // Format date and time
  const reservationDate = new Date(reservationDetails.date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  const reservationTime = reservationDetails.time;
  const partySize = reservationDetails.partySize;
  const duration = reservationDetails.duration || 90;

  // Build restaurant info section
  const restaurantInfo = restaurantData ? `
    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="color: #333; margin-top: 0; font-size: 18px;">📍 Restaurantlokasjon</h3>
      <p style="margin: 8px 0; font-size: 15px;"><strong>${restaurantData.name}</strong></p>
      <p style="margin: 4px 0; color: #555;">${restaurantData.streetName}</p>
      <p style="margin: 4px 0; color: #555;">${restaurantData.zipCode} ${restaurantData.city}</p>
    </div>
  ` : '';

  const contactInfo = restaurantData ? `
    <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
      <h3 style="color: #333; margin-top: 0; font-size: 16px;">💡 Trenger du å gjøre endringer?</h3>
      <p style="margin: 8px 0; color: #555;">Hvis du trenger å endre eller avbestille reservasjonen din, vennligst kontakt oss:</p>
      <p style="margin: 8px 0; color: #333;">
        <strong>📞 Phone:</strong> ${restaurantData.phoneNumber}<br/>
        <strong>🌐 Website:</strong> <a href="https://${restaurantData.domain}" style="color: #007bff; text-decoration: none;">https://${restaurantData.domain}</a>
      </p>
    </div>
  ` : '';

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff;">
      <!-- Header -->
      <div style="text-align: center; padding: 30px 0; background: linear-gradient(135deg, #28a745 0%, #20c997 100%); border-radius: 12px 12px 0 0;">
        <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">🎉 Reservasjon Bekreftet!</h1>
        <p style="color: #ffffff; margin: 8px 0 0 0; font-size: 16px; opacity: 0.9;">Vi gleder oss til å velkomme deg!</p>
      </div>
      
      <!-- Content -->
      <div style="padding: 30px; background-color: #ffffff; border: 1px solid #e9ecef; border-top: none; border-radius: 0 0 12px 12px;">
        <p style="font-size: 16px; color: #333; margin-bottom: 10px;">Kjære <strong>${customerDetails.name}</strong>,</p>
        <p style="font-size: 15px; color: #555; line-height: 1.6;">Gode nyheter! Din bordreservasjon har blitt bekreftet. Vi gleder oss til å velkomme deg og ditt selskap til ${restaurantName}.</p>
        
        <!-- Reservation Details -->
        <div style="margin: 25px 0;">
          <h3 style="color: #333; font-size: 18px; margin-bottom: 15px; border-bottom: 2px solid #28a745; padding-bottom: 8px;">📅 Reservasjonsdetaljer</h3>
          
          <div style="background-color: #e8f5e8; padding: 20px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #28a745;">
            <div style="display: flex; align-items: center; margin-bottom: 12px;">
              <span style="font-size: 24px; margin-right: 12px;">📅</span>
              <div>
                <p style="margin: 0; font-size: 18px; font-weight: bold; color: #28a745;">${reservationDate}</p>
                <p style="margin: 0; font-size: 16px; color: #333;">${reservationTime}</p>
              </div>
            </div>
            
            <div style="display: flex; align-items: center; margin-bottom: 12px;">
              <span style="font-size: 24px; margin-right: 12px;">👥</span>
              <div>
                <p style="margin: 0; font-size: 16px; color: #333;"><strong>Antall Personer:</strong> ${partySize} ${partySize === 1 ? 'person' : 'personer'}</p>
                <p style="margin: 0; font-size: 14px; color: #666;">Estimert varighet: ${duration} minutter</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Special Requests -->
        ${customerDetails.specialRequests ? `
        <div style="margin: 20px 0;">
          <h3 style="color: #333; font-size: 16px; margin-bottom: 10px;">📝 Spesielle Ønsker</h3>
          <div style="background-color: #fff3cd; padding: 15px; border-radius: 8px; border-left: 4px solid #ffc107;">
            <p style="margin: 0; color: #555; font-style: italic;">"${customerDetails.specialRequests}"</p>
          </div>
        </div>
        ` : ''}

        ${restaurantInfo}

        <!-- Important Reminders -->
        <div style="background-color: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2196F3;">
          <h3 style="color: #333; margin-top: 0; font-size: 16px;">💡 Viktige Påminnelser</h3>
          <ul style="margin: 10px 0; padding-left: 20px; color: #555; font-size: 14px;">
            <li style="margin-bottom: 5px;">Vennligst kom i tide til reservasjonen din</li>
            <li style="margin-bottom: 5px;">Hvis du kommer for sent, vennligst ring oss for å gi beskjed</li>
            <li style="margin-bottom: 5px;">Avbestillinger bør gjøres minst 2 timer i forveien</li>
            <li style="margin-bottom: 5px;">Ta med gyldig ID hvis du planlegger å bestille alkoholholdige drikker</li>
          </ul>
        </div>

        ${contactInfo}

        <!-- Footer -->
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6;">
          <p style="color: #6c757d; font-size: 14px; margin: 5px 0;">Vi gleder oss til å gi deg en eksepsjonell spisopplevelse!</p>
          <p style="color: #6c757d; font-size: 14px; margin: 5px 0;">Takk for at du valgte ${restaurantName}! 🍽️</p>
        </div>
      </div>
    </div>
  `;

  return sendEmail({
    to: customerDetails.email,
    subject: `Reservasjon Bekreftet - ${restaurantName} - ${reservationDate}`,
    html,
  });
};