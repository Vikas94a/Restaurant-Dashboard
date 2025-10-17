import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

// Force dynamic rendering - don't pre-render at build time
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const { orderId, feedback } = await request.json();

    // Validate the request
    if (!orderId || !feedback) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Find the order in restaurants collection
    const restaurantsSnapshot = await adminDb.collection('restaurants').get();
    
    let orderData: any = null;
    let restaurantId = '';
    
    for (const restaurantDoc of restaurantsSnapshot.docs) {
      const orderSnapshot = await adminDb
        .collection('restaurants')
        .doc(restaurantDoc.id)
        .collection('orders')
        .doc(orderId)
        .get();
      
      if (orderSnapshot.exists) {
        orderData = orderSnapshot.data();
        restaurantId = restaurantDoc.id;
        break;
      }
    }

    if (!orderData) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Update the order with feedback
    const orderRef = adminDb.collection('restaurants').doc(restaurantId).collection('orders').doc(orderId);
    await orderRef.update({
      feedback: {
        ...feedback,
        submittedAt: new Date().toISOString()
      },
      feedbackSubmitted: true
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to submit feedback' },
      { status: 500 }
    );
  }
} 