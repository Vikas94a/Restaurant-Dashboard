import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { Feedback } from '@/types/feedback';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, rating, comment } = body;

    if (!orderId || !rating) {
      return NextResponse.json(
        { error: 'Order ID and rating are required' },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    // Check if feedback already exists
    const feedbackRef = doc(db, 'feedbacks', orderId);
    const existingFeedback = await getDoc(feedbackRef);

    if (existingFeedback.exists()) {
      return NextResponse.json(
        { error: 'Feedback already submitted for this order' },
        { status: 400 }
      );
    }

    // Find the order to get customer and restaurant details
    const restaurantsRef = collection(db, 'restaurants');
    const restaurantsSnapshot = await getDocs(restaurantsRef);
    
    let orderData: any = null;
    let restaurantId = '';
    
    for (const restaurantDoc of restaurantsSnapshot.docs) {
      const ordersRef = collection(db, 'restaurants', restaurantDoc.id, 'orders');
      const orderQuery = query(ordersRef, where('__name__', '==', orderId));
      const orderSnapshot = await getDocs(orderQuery);
      
      if (!orderSnapshot.empty) {
        orderData = orderSnapshot.docs[0].data();
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

    // Create feedback document
    const feedback: Feedback = {
      orderId,
      restaurantId,
      customerName: orderData.customerDetails?.name || 'Anonymous',
      customerEmail: orderData.customerDetails?.email || '',
      rating,
      comment: comment || '',
      createdAt: new Date().toISOString(),
    };

    await setDoc(feedbackRef, feedback);

    return NextResponse.json({
      success: true,
      message: 'Feedback submitted successfully',
    });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    return NextResponse.json(
      { error: 'Failed to submit feedback' },
      { status: 500 }
    );
  }
}

