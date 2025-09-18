import { onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import { Resend } from 'resend';

admin.initializeApp();

// Get configuration from Firebase functions config
const resend = new Resend(functions.config().resend.api_key);
const appUrl = functions.config().app.url;

interface Order {
  id: string;
  restaurantId: string;
  customerDetails: {
    name: string;
    email: string;
    pickupDate: string;
  };
  items: Array<{
    itemName: string;
    quantity: number;
  }>;
  pickupTime: string;
  status: string;
  estimatedPickupTime?: string;
}

const generateFeedbackLink = (orderId: string): string => {
  return `${appUrl}/feedback/${orderId}`;
};

const generateFeedbackEmailTemplate = (data: {
  customerName: string;
  orderId: string;
  orderItems: Array<{ name: string; quantity: number }>;
  pickupTime: string;
  feedbackLink: string;
}): string => {
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

export const onOrderAccepted = onDocumentUpdated('restaurants/{restaurantId}/orders/{orderId}', async (event) => {
    const newData = event.data?.after?.data() as Order;
    const previousData = event.data?.before?.data() as Order;

    // Only proceed if the order was just accepted
    if (previousData.status !== 'accepted' && newData.status === 'accepted') {
      try {
        console.log(`Processing order acceptance for order ${newData.id}, pickupTime: ${newData.pickupTime}, estimatedPickupTime: ${newData.estimatedPickupTime}`);
        
        let pickupTime: Date;
        
        if (newData.pickupTime === 'asap') {
          // For ASAP orders, use the estimatedPickupTime (in minutes) from current time
          if (newData.estimatedPickupTime) {
            const minutesToAdd = parseInt(newData.estimatedPickupTime, 10);
            if (!isNaN(minutesToAdd)) {
              pickupTime = new Date();
              pickupTime.setMinutes(pickupTime.getMinutes() + minutesToAdd);
            } else {
              // If estimatedPickupTime is not a number, try parsing as time format
              try {
                const [time, period] = newData.estimatedPickupTime.split(' ');
                const [hours, minutes] = time.split(':').map(Number);
                
                let hour24 = hours;
                if (period === 'PM' && hours !== 12) hour24 += 12;
                if (period === 'AM' && hours === 12) hour24 = 0;
                
                pickupTime = new Date();
                pickupTime.setHours(hour24, minutes, 0, 0);
                
                // If pickup time is in the past, it means it's for tomorrow
                if (pickupTime < new Date()) {
                  pickupTime.setDate(pickupTime.getDate() + 1);
                }
              } catch (parseError) {
                // Fallback: current time + 15 minutes
                pickupTime = new Date();
                pickupTime.setMinutes(pickupTime.getMinutes() + 15);
              }
            }
          } else {
            // Fallback: current time + 15 minutes
            pickupTime = new Date();
            pickupTime.setMinutes(pickupTime.getMinutes() + 15);
          }
        } else {
          // For scheduled orders, combine pickupDate with pickupTime
          const pickupDate = new Date(newData.customerDetails.pickupDate);
          const [time, period] = newData.pickupTime.split(' ');
          const [hours, minutes] = time.split(':').map(Number);
          
          // Convert to 24-hour format
          let hour24 = hours;
          if (period === 'PM' && hours !== 12) hour24 += 12;
          if (period === 'AM' && hours === 12) hour24 = 0;
          
          // Set the time on the pickup date
          pickupTime = new Date(pickupDate);
          pickupTime.setHours(hour24, minutes, 0, 0);
        }

        // Validate pickup time
        if (isNaN(pickupTime.getTime())) {
          throw new Error(`Invalid pickup time calculated: ${pickupTime}`);
        }

        // Schedule the feedback email for 2 minutes after pickup
        const feedbackTime = new Date(pickupTime.getTime() + 2 * 60000);
        
        // Validate feedback time
        if (isNaN(feedbackTime.getTime())) {
          throw new Error(`Invalid feedback time calculated: ${feedbackTime}`);
        }

        console.log(`Calculated pickup time: ${pickupTime.toISOString()}, feedback time: ${feedbackTime.toISOString()}`);
        
        // Create a scheduled task
        await admin.firestore().collection('scheduledTasks').add({
          type: 'feedbackEmail',
          orderId: newData.id,
          restaurantId: newData.restaurantId,
          scheduledFor: admin.firestore.Timestamp.fromDate(feedbackTime),
          status: 'pending',
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        console.log(`Scheduled feedback email for order ${newData.id} at ${feedbackTime.toISOString()}`);
      } catch (error) {
        console.error('Error scheduling feedback email:', error);
      }
    }
  });

export const processScheduledTasks = onSchedule('every 1 minutes', async (event) => {
    const now = admin.firestore.Timestamp.now();
    const tasksRef = admin.firestore().collection('scheduledTasks');
    
    // Get all pending tasks that are due
    const tasks = await tasksRef
      .where('status', '==', 'pending')
      .where('scheduledFor', '<=', now)
      .get();

    for (const task of tasks.docs) {
      const taskData = task.data();
      
      if (taskData.type === 'feedbackEmail') {
        try {
          // Get the order data
          const orderRef = admin.firestore()
            .collection('restaurants')
            .doc(taskData.restaurantId)
            .collection('orders')
            .doc(taskData.orderId);
          
          const orderDoc = await orderRef.get();
          if (!orderDoc.exists) {
            throw new Error('Order not found');
          }

          const order = orderDoc.data() as Order;
          const feedbackLink = generateFeedbackLink(order.id);

          // Send the feedback email
          console.log(`Attempting to send feedback email to: ${order.customerDetails.email}`);
          
          const emailResult = await resend.emails.send({
            from: 'AI Eat Easy <noreply@aieateasy.no>',
            to: order.customerDetails.email,
            subject: 'How was your meal? Share your feedback!',
            html: generateFeedbackEmailTemplate({
              customerName: order.customerDetails.name,
              orderId: order.id,
              orderItems: order.items.map(item => ({ name: item.itemName, quantity: item.quantity })),
              pickupTime: order.pickupTime === 'asap' ? (order.estimatedPickupTime || 'ASAP') : order.pickupTime,
              feedbackLink
            })
          });

          console.log(`Resend API response for order ${order.id}:`, JSON.stringify(emailResult, null, 2));

          // Mark the task as completed
          await task.ref.update({
            status: 'completed',
            completedAt: admin.firestore.FieldValue.serverTimestamp()
          });

          console.log(`Sent feedback email for order ${order.id}`);
        } catch (error) {
          console.error('Error processing feedback email task:', error);
          // Mark the task as failed
          await task.ref.update({
            status: 'failed',
            error: error instanceof Error ? error.message : 'Unknown error occurred',
            failedAt: admin.firestore.FieldValue.serverTimestamp()
          });
        }
      }
    }
  });