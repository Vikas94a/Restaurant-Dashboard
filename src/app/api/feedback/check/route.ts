import { NextRequest, NextResponse } from 'next/server';

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

    // For now, assume feedback doesn't exist (always allow new feedback)
    // The actual checking will be done on the frontend using client SDK
    
    return NextResponse.json({
      exists: false,
      restaurantName: 'AI Eat Easy', // Default restaurant name
    });
  } catch (error) {
    console.error('Error checking feedback:', error);
    return NextResponse.json(
      { error: 'Failed to check feedback' },
      { status: 500 }
    );
  }
}


