import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';

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

    // Get the order document to find the restaurant ID
    const ordersRef = doc(db, 'orders', orderId);
    const orderDoc = await getDoc(ordersRef);

    if (!orderDoc.exists()) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    const orderData = orderDoc.data();
    const restaurantId = orderData.restaurantId;

    // Update the order with feedback
    const orderRef = doc(db, 'restaurants', restaurantId, 'orders', orderId);
    await updateDoc(orderRef, {
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