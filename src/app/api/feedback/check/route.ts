import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    // Check if feedback exists for this order
    const feedbackRef = doc(db, 'feedbacks', orderId);
    const feedbackDoc = await getDoc(feedbackRef);
    
    let restaurantName = '';
    
    // Try to get restaurant name from the order
    try {
      const restaurantsRef = collection(db, 'restaurants');
      const restaurantsSnapshot = await getDocs(restaurantsRef);
      
      for (const restaurantDoc of restaurantsSnapshot.docs) {
        const ordersRef = collection(db, 'restaurants', restaurantDoc.id, 'orders');
        const orderQuery = query(ordersRef, where('__name__', '==', orderId));
        const orderSnapshot = await getDocs(orderQuery);
        
        if (!orderSnapshot.empty) {
          const restaurantData = restaurantDoc.data();
          restaurantName = restaurantData.name || '';
          break;
        }
      }
    } catch (error) {
      console.error('Error fetching restaurant name:', error);
    }

    return NextResponse.json({
      exists: feedbackDoc.exists(),
      restaurantName,
    });
  } catch (error) {
    console.error('Error checking feedback:', error);
    return NextResponse.json(
      { error: 'Failed to check feedback' },
      { status: 500 }
    );
  }
}

