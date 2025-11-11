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
    console.log(`Attempting to send email to: ${to}, subject: ${subject}`);
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ to, subject, html }),
    });

    const data = await response.json();
    if (!response.ok) {
      const errorMessage = data.error || 'Failed to send email';
      console.error(`Email sending failed: ${errorMessage}`, { to, subject, status: response.status });
      throw new Error(errorMessage);
    }

    console.log(`Email sent successfully to: ${to}`);
    return data;
  } catch (error) {
    // Don't throw the error, just log it and return null
    // This way the order status update can still proceed
    console.error('Error in sendEmail function:', error instanceof Error ? error.message : String(error), { to, subject });
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

  // Build items list with email-compatible formatting
  const itemsList = items.map(item => {
    let itemDetails = `<strong style="color: #1f2937; font-size: 14px;">${item.itemName}</strong> <span style="color: #6b7280; font-size: 12px;">x${item.quantity}</span>`;
    
    // Add customizations if available (email-safe formatting)
    if (item.customizations && item.customizations.length > 0) {
      const customizationLines = item.customizations
        .flatMap(custom => 
          custom.options.map(option => `&nbsp;&nbsp;• ${option.name}${option.price > 0 ? ` (+${option.price.toFixed(2)} kr)` : ''}`)
        );
      if (customizationLines.length > 0) {
        itemDetails += `<br/><span style="font-size: 12px; color: #6b7280; line-height: 1.8;">${customizationLines.join('<br/>')}</span>`;
      }
    }
    
    // Add special instructions if available
    if (item.specialInstructions && item.specialInstructions.text) {
      itemDetails += `<br/><span style="font-size: 12px; color: #3b82f6; font-style: italic; line-height: 1.8;">Spesielt: ${item.specialInstructions.text}</span>`;
    }
    
    return `
    <tr>
      <td style="padding: 15px 20px; border-bottom: 1px solid #e5e7eb; vertical-align: top; color: #1f2937; font-size: 14px; line-height: 1.6;">${itemDetails}</td>
      <td style="padding: 15px 20px; border-bottom: 1px solid #e5e7eb; text-align: right; vertical-align: top; white-space: nowrap; color: #1f2937; font-size: 14px; font-weight: 600;">${(item.itemPrice * item.quantity).toFixed(2)} kr</td>
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
  
  // Build restaurant info section with email-compatible table structure
  const restaurantInfo = restaurantData ? `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 25px 0; background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px;">
      <tr>
        <td style="padding: 20px;">
          <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 18px; font-weight: 600;">📍 Hentested</h3>
          <p style="margin: 8px 0; font-size: 16px; font-weight: 600; color: #1f2937; line-height: 1.5;"><strong>${restaurantData.name}</strong></p>
          <p style="margin: 4px 0; color: #4b5563; font-size: 14px; line-height: 1.6;">${restaurantData.streetName}</p>
          <p style="margin: 4px 0; color: #4b5563; font-size: 14px; line-height: 1.6;">${restaurantData.zipCode} ${restaurantData.city}</p>
        </td>
      </tr>
    </table>
  ` : '';

  // Build contact info section with email-compatible table structure
  const contactInfo = restaurantData ? `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 25px 0; background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 8px;">
      <tr>
        <td style="padding: 20px;">
          <h3 style="color: #1f2937; margin: 0 0 10px 0; font-size: 16px; font-weight: 600;">💡 Trenger du hjelp?</h3>
          <p style="margin: 8px 0; color: #4b5563; font-size: 14px; line-height: 1.6;">Hvis du har spørsmål eller trenger å gjøre endringer i bestillingen din, vennligst ikke nøl med å kontakte oss:</p>
          <p style="margin: 12px 0 0 0; color: #1f2937; font-size: 14px; line-height: 1.8;">
            <strong>📞 Telefon:</strong> <a href="tel:${restaurantData.phoneNumber}" style="color: #ea580c; text-decoration: none; font-weight: 500;">${restaurantData.phoneNumber}</a><br/>
            <strong>🌐 Nettside:</strong> <a href="https://${restaurantData.domain}" style="color: #ea580c; text-decoration: none; font-weight: 500;">https://${restaurantData.domain}</a>
          </p>
        </td>
      </tr>
    </table>
  ` : '';

  const html = `
    <!DOCTYPE html>
    <html lang="no">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Bestilling Bekreftet - ${restaurantData?.name || 'Restaurant'}</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f5f5f5;">
        <tr>
          <td align="center" style="padding: 20px 0;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              <!-- Header with Restaurant Branding -->
              <tr>
                <td style="background: linear-gradient(135deg, #f97316 0%, #ef4444 100%); padding: 40px 30px; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">${order.status === 'pending' ? '✅ Bestilling Mottatt!' : '✅ Bestilling Bekreftet!'}</h1>
                  <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px; opacity: 0.95;">${restaurantData?.name || 'Restaurant'}</p>
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td style="padding: 30px;">
                  <p style="font-size: 16px; color: #1f2937; margin: 0 0 10px 0; line-height: 1.5;">Hei <strong>${customerDetails.name}</strong>,</p>
                  <p style="font-size: 15px; color: #4b5563; margin: 0 0 25px 0; line-height: 1.6;">${order.status === 'pending' 
                    ? 'Tusen takk for bestillingen din! Vi har mottatt bestillingen din og vil behandle den snart. Nedenfor er alle bestillingsdetaljer:' 
                    : 'Tusen takk for bestillingen din! Vi har bekreftet bestillingen din og forbereder den med omsorg. Nedenfor er alle bestillingsdetaljer:'}</p>
                  
                  <!-- Order Details Table -->
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 25px 0; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
                    <tr>
                      <td style="padding: 20px; background-color: #fff7ed; border-bottom: 2px solid #f97316;">
                        <h2 style="color: #1f2937; margin: 0; font-size: 18px; font-weight: 600;">🛒 Bestillingsdetaljer</h2>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 0;">
                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                          ${itemsList}
                          <tr>
                            <td style="padding: 15px 20px; background-color: #f9fafb; border-top: 1px solid #e5e7eb;">
                              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                <tr>
                                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Delsum:</td>
                                  <td style="padding: 8px 0; text-align: right; color: #1f2937; font-size: 14px; font-weight: 500; white-space: nowrap;">${subtotal.toFixed(2)} kr</td>
                                </tr>
                                <tr>
                                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">MVA (15%):</td>
                                  <td style="padding: 8px 0; text-align: right; color: #1f2937; font-size: 14px; font-weight: 500; white-space: nowrap;">${vatAmount.toFixed(2)} kr</td>
                                </tr>
                                <tr>
                                  <td style="padding: 15px 0 8px 0; color: #1f2937; font-size: 18px; font-weight: 700; border-top: 2px solid #e5e7eb;">Totalt:</td>
                                  <td style="padding: 15px 0 8px 0; text-align: right; color: #f97316; font-size: 20px; font-weight: 700; border-top: 2px solid #e5e7eb; white-space: nowrap;">${totalWithVAT.toFixed(2)} kr</td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>

                  <!-- Pickup Information -->
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 25px 0; background-color: #fff7ed; border-left: 4px solid #f97316; border-radius: 8px;">
                    <tr>
                      <td style="padding: 20px;">
                        <h3 style="color: #1f2937; margin: 0 0 10px 0; font-size: 18px; font-weight: 600;">⏰ Hentetid</h3>
                        <p style="margin: 0; font-size: 20px; color: #ea580c; font-weight: 700;">${displayPickupTime}</p>
                        ${order.status === 'pending' ? `
                        <p style="margin: 10px 0 0 0; font-size: 13px; color: #6b7280; line-height: 1.5;">
                          Restauranten vil bekrefte bestillingen din og gi deg en oppdatert hentetid. Du vil motta en e-post når bestillingen er bekreftet.
                        </p>
                        ` : ''}
                      </td>
                    </tr>
                  </table>

                  ${restaurantInfo}

                  <!-- Payment Method -->
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 20px 0; background-color: #f0fdf4; border-left: 4px solid #22c55e; border-radius: 8px;">
                    <tr>
                      <td style="padding: 15px 20px;">
                        <p style="margin: 0; color: #166534; font-size: 14px; font-weight: 500;">💳 <strong>Betalingsmetode:</strong> Betal ved henting (kontant eller kort)</p>
                      </td>
                    </tr>
                  </table>

                  ${contactInfo}

                  <!-- Thank You Message -->
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 30px 0 0 0; background-color: #fff7ed; border-radius: 8px;">
                    <tr>
                      <td style="padding: 25px; text-align: center;">
                        <p style="color: #1f2937; font-size: 16px; margin: 0 0 10px 0; font-weight: 600;">Vi gleder oss til å betjene deg!</p>
                        <p style="color: #6b7280; font-size: 14px; margin: 0;">Takk for at du valgte ${restaurantData?.name || 'oss'}! 🙏</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="padding: 20px 30px; background-color: #f9fafb; text-align: center; border-top: 1px solid #e5e7eb;">
                  <p style="color: #9ca3af; font-size: 12px; margin: 0; line-height: 1.5;">
                    Dette er en automatisk e-postbekreftelse. Vennligst ikke svar på denne e-posten.<br>
                    Hvis du har spørsmål, kontakt restauranten direkte.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const restaurantName = restaurantData?.name || 'AI Eat Easy';
  // Determine subject based on order status
  const subject = order.status === 'pending' 
    ? `Bestilling Mottatt - ${restaurantName}` 
    : `Bestilling Bekreftet - ${restaurantName}`;
  
  return sendEmail({
    to: customerDetails.email,
    subject,
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

  // Build items list with email-compatible formatting
  const itemsList = items.map(item => {
    let itemDetails = `<strong style="color: #1f2937; font-size: 14px;">${item.itemName}</strong> <span style="color: #6b7280; font-size: 12px;">x${item.quantity}</span>`;
    
    // Add customizations if available (email-safe formatting)
    if (item.customizations && item.customizations.length > 0) {
      const customizationLines = item.customizations
        .flatMap(custom => 
          custom.options.map(option => `&nbsp;&nbsp;• ${option.name}${option.price > 0 ? ` (+${option.price.toFixed(2)} kr)` : ''}`)
        );
      if (customizationLines.length > 0) {
        itemDetails += `<br/><span style="font-size: 12px; color: #6b7280; line-height: 1.8;">${customizationLines.join('<br/>')}</span>`;
      }
    }
    
    // Add special instructions if available
    if (item.specialInstructions && item.specialInstructions.text) {
      itemDetails += `<br/><span style="font-size: 12px; color: #3b82f6; font-style: italic; line-height: 1.8;">Spesielt: ${item.specialInstructions.text}</span>`;
    }
    
    return `
    <tr>
      <td style="padding: 15px 20px; border-bottom: 1px solid #e5e7eb; vertical-align: top; color: #1f2937; font-size: 14px; line-height: 1.6;">${itemDetails}</td>
      <td style="padding: 15px 20px; border-bottom: 1px solid #e5e7eb; text-align: right; vertical-align: top; white-space: nowrap; color: #1f2937; font-size: 14px; font-weight: 600;">${(item.itemPrice * item.quantity).toFixed(2)} kr</td>
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

// Send reservation rejection/cancellation email
export const sendReservationRejectionEmail = async (reservation: any) => {
  const { customerDetails, reservationDetails, restaurantId, notes } = reservation;
  
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

  const contactInfo = restaurantData ? `
    <div style="background-color: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2196F3;">
      <h3 style="color: #333; margin-top: 0; font-size: 16px;">📞 Kontakt Oss</h3>
      <p style="margin: 8px 0; color: #555;">For mer informasjon eller for å legge inn en ny reservasjon, vennligst kontakt oss:</p>
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
        <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">⚠️ Reservasjonsoppdatering</h1>
      </div>
      
      <!-- Content -->
      <div style="padding: 30px; background-color: #ffffff; border: 1px solid #e9ecef; border-top: none; border-radius: 0 0 12px 12px;">
        <p style="font-size: 16px; color: #333; margin-bottom: 10px;">Kjære <strong>${customerDetails.name}</strong>,</p>
        <p style="font-size: 15px; color: #555; line-height: 1.6;">Vi beklager å måtte informere deg om at reservasjonen din ikke kunne bekreftes for øyeblikket. Vi beklager oppriktig for eventuelle ulemper dette kan forårsake.</p>
        
        ${notes ? `
        <div style="background-color: #ffebee; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f44336;">
          <h4 style="color: #333; margin: 0 0 10px 0; font-size: 16px;">📝 Grunn til avbestilling:</h4>
          <p style="margin: 0; color: #555; font-size: 14px;">${notes}</p>
        </div>
        ` : ''}
        
        <!-- Reservation Details -->
        <div style="margin: 25px 0;">
          <h3 style="color: #333; font-size: 18px; margin-bottom: 15px; border-bottom: 2px solid #f44336; padding-bottom: 8px;">📅 Reservasjonsdetaljer</h3>
          
          <div style="background-color: #ffebee; padding: 20px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #f44336;">
            <div style="display: flex; align-items: center; margin-bottom: 12px;">
              <span style="font-size: 24px; margin-right: 12px;">📅</span>
              <div>
                <p style="margin: 0; font-size: 18px; font-weight: bold; color: #f44336;">${reservationDate}</p>
                <p style="margin: 0; font-size: 16px; color: #333;">${reservationTime}</p>
              </div>
            </div>
            
            <div style="display: flex; align-items: center; margin-bottom: 12px;">
              <span style="font-size: 24px; margin-right: 12px;">👥</span>
              <div>
                <p style="margin: 0; font-size: 16px; color: #333;"><strong>Antall Personer:</strong> ${partySize} ${partySize === 1 ? 'person' : 'personer'}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Important Notice -->
        <div style="background-color: #fff3e0; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ff9800;">
          <p style="margin: 0; color: #555; font-size: 14px;"><strong>💡 Viktig:</strong> Du er velkommen til å legge inn en ny reservasjon når det passer deg. Vi håper å kunne betjene deg i fremtiden.</p>
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

  return sendEmail({
    to: customerDetails.email,
    subject: `Reservasjonsoppdatering - ${restaurantName}`,
    html,
  });
};