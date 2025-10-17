import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, rating, comment, restaurantId } = body;

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

    // For now, we'll use a simple approach that works
    // The feedback will be processed by the frontend using the client SDK
    // This API just validates the input and returns success
    
    const feedback = {
      orderId,
      rating,
      comment: comment || '',
      createdAt: new Date().toISOString(),
      restaurantId: restaurantId || 'unknown'
    };

    console.log('Feedback received:', feedback);

    return NextResponse.json({
      success: true,
      message: 'Feedback submitted successfully',
      feedback: feedback
    });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    return NextResponse.json(
      { 
        error: 'Failed to submit feedback',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}


