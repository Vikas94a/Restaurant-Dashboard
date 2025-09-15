import { NextRequest, NextResponse } from 'next/server';
import { collection, doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface CustomerFeedbackData {
  orderId: string;
  restaurantId: string;
  customerName: string;
  customerEmail: string;
  feedback: {
    rating: number;
    foodQuality: number;
    serviceExperience: number;
    valueForMoney: number;
    comments: string;
  };
  orderItems: Array<{
    name: string;
    quantity: number;
  }>;
  submittedAt: Date;
}

interface CustomerFeedbackAnalysis {
  overallSentiment: 'positive' | 'negative' | 'neutral';
  keyInsights: string[];
  foodQualityInsights: string[];
  serviceInsights: string[];
  valueInsights: string[];
  recommendations: string[];
  customerSatisfactionScore: number; // 1-10
}

export async function POST(request: NextRequest) {
  try {
    const feedbackData: CustomerFeedbackData = await request.json();

    // Validate required fields
    if (!feedbackData.orderId || !feedbackData.restaurantId || !feedbackData.feedback) {
      return NextResponse.json(
        { error: 'Missing required fields: orderId, restaurantId, and feedback' },
        { status: 400 }
      );
    }

    // Analyze customer feedback using AI
    const analysis = await analyzeCustomerFeedback(feedbackData);

    // Store the analysis in the database
    const analysisData = {
      orderId: feedbackData.orderId,
      restaurantId: feedbackData.restaurantId,
      customerName: feedbackData.customerName,
      customerEmail: feedbackData.customerEmail,
      originalFeedback: feedbackData.feedback,
      analysis: analysis,
      submittedAt: feedbackData.submittedAt,
      processedAt: new Date().toISOString()
    };

    // Save to customerFeedbackAnalysis collection
    const analysisRef = doc(db, 'restaurants', feedbackData.restaurantId, 'customerFeedbackAnalysis', feedbackData.orderId);
    await setDoc(analysisRef, analysisData);

    // Also save to a general feedback collection for restaurant owner dashboard
    const feedbackRef = doc(db, 'restaurants', feedbackData.restaurantId, 'customerFeedback', feedbackData.orderId);
    await setDoc(feedbackRef, feedbackData);

    return NextResponse.json({
      success: true,
      analysis: analysis,
      message: 'Customer feedback processed and analyzed successfully'
    });

  } catch (error) {
    console.error('Error processing customer feedback:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process customer feedback',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

async function analyzeCustomerFeedback(feedbackData: CustomerFeedbackData): Promise<CustomerFeedbackAnalysis> {
  try {
    const prompt = `
You are an AI restaurant analyst specializing in customer feedback analysis. Analyze the following customer feedback and provide actionable insights.

CUSTOMER FEEDBACK DATA:
- Overall Rating: ${feedbackData.feedback.rating}/5
- Food Quality: ${feedbackData.feedback.foodQuality}/5
- Service Experience: ${feedbackData.feedback.serviceExperience}/5
- Value for Money: ${feedbackData.feedback.valueForMoney}/5
- Comments: "${feedbackData.feedback.comments || 'No additional comments'}"

ORDER DETAILS:
- Order ID: ${feedbackData.orderId}
- Customer: ${feedbackData.customerName}
- Items Ordered: ${feedbackData.orderItems.map(item => `${item.quantity}x ${item.name}`).join(', ')}

Please analyze this feedback and provide a structured response in the following JSON format:

{
  "overallSentiment": "positive|negative|neutral",
  "keyInsights": ["insight1", "insight2", "insight3"],
  "foodQualityInsights": ["insight1", "insight2"],
  "serviceInsights": ["insight1", "insight2"],
  "valueInsights": ["insight1", "insight2"],
  "recommendations": ["recommendation1", "recommendation2", "recommendation3"],
  "customerSatisfactionScore": 8
}

Focus on:
1. Overall customer sentiment and satisfaction
2. Specific areas of strength and improvement
3. Actionable recommendations for the restaurant
4. Patterns that could inform menu or service improvements
5. Customer satisfaction score (1-10 scale)

Keep insights concise, actionable, and specific to restaurant operations.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are an expert restaurant customer experience analyst. Provide structured, actionable insights from customer feedback data."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 800
    });

    const aiResponse = completion.choices[0]?.message?.content;
    
    if (!aiResponse) {
      throw new Error('No response from OpenAI');
    }

    // Parse the AI response
    let analysis: CustomerFeedbackAnalysis;
    try {
      // Try to extract JSON from the response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      // Fallback: create a basic analysis if JSON parsing fails
      const avgRating = (feedbackData.feedback.rating + feedbackData.feedback.foodQuality + feedbackData.feedback.serviceExperience + feedbackData.feedback.valueForMoney) / 4;
      
      analysis = {
        overallSentiment: avgRating >= 4 ? 'positive' : avgRating >= 3 ? 'neutral' : 'negative',
        keyInsights: [
          `Overall rating: ${feedbackData.feedback.rating}/5`,
          `Food quality: ${feedbackData.feedback.foodQuality}/5`,
          `Service: ${feedbackData.feedback.serviceExperience}/5`,
          `Value: ${feedbackData.feedback.valueForMoney}/5`
        ],
        foodQualityInsights: [],
        serviceInsights: [],
        valueInsights: [],
        recommendations: [],
        customerSatisfactionScore: Math.round(avgRating * 2) // Convert 1-5 to 1-10 scale
      };
    }

    return analysis;
  } catch (error) {
    console.error('Error analyzing customer feedback:', error);
    // Return basic analysis if AI fails
    const avgRating = (feedbackData.feedback.rating + feedbackData.feedback.foodQuality + feedbackData.feedback.serviceExperience + feedbackData.feedback.valueForMoney) / 4;
    
    return {
      overallSentiment: avgRating >= 4 ? 'positive' : avgRating >= 3 ? 'neutral' : 'negative',
      keyInsights: [`Customer provided ${feedbackData.feedback.rating}/5 overall rating`],
      foodQualityInsights: [`Food quality rated ${feedbackData.feedback.foodQuality}/5`],
      serviceInsights: [`Service rated ${feedbackData.feedback.serviceExperience}/5`],
      valueInsights: [`Value rated ${feedbackData.feedback.valueForMoney}/5`],
      recommendations: ['Review feedback details for specific improvements'],
      customerSatisfactionScore: Math.round(avgRating * 2)
    };
  }
}
