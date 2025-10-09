import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Force dynamic rendering - don't pre-render at build time
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface FeedbackData {
  postId: string;
  postTitle: string;
  postContent: string;
  postType: string;
  feedback: 'helpful' | 'not_helpful';
  detailedFeedback: {
    engagement?: 'high' | 'medium' | 'low';
    salesImpact?: 'positive' | 'neutral' | 'negative';
    contentQuality?: 'excellent' | 'good' | 'poor';
    timing?: 'perfect' | 'good' | 'poor';
    notes?: string;
  };
  restaurantId: string;
  restaurantName: string;
  restaurantType: string;
}

interface FeedbackSummary {
  overallRating: 'positive' | 'negative' | 'mixed';
  keyInsights: string[];
  improvements: string[];
  strengths: string[];
  recommendations: string[];
  learningPoints: string[];
}

export async function POST(request: NextRequest) {
  try {
    const feedbackData: FeedbackData = await request.json();

    // Validate required fields
    if (!feedbackData.postId || !feedbackData.restaurantId) {
      return NextResponse.json(
        { error: 'Missing required fields: postId and restaurantId' },
        { status: 400 }
      );
    }

    // Create a comprehensive prompt for AI to analyze the feedback
    const prompt = `
You are an AI marketing analyst specializing in restaurant social media content. Analyze the following feedback data and provide a structured summary that will help improve future AI-generated posts.

RESTAURANT CONTEXT:
- Name: ${feedbackData.restaurantName}
- Type: ${feedbackData.restaurantType}
- Restaurant ID: ${feedbackData.restaurantId}

POST DETAILS:
- Title: ${feedbackData.postTitle}
- Type: ${feedbackData.postType}
- Content: ${feedbackData.postContent}

FEEDBACK DATA:
- Overall Rating: ${feedbackData.feedback}
- Engagement Level: ${feedbackData.detailedFeedback.engagement || 'Not specified'}
- Sales Impact: ${feedbackData.detailedFeedback.salesImpact || 'Not specified'}
- Content Quality: ${feedbackData.detailedFeedback.contentQuality || 'Not specified'}
- Timing: ${feedbackData.detailedFeedback.timing || 'Not specified'}
- Additional Notes: ${feedbackData.detailedFeedback.notes || 'None'}

Please analyze this feedback and provide a structured response in the following JSON format:

{
  "overallRating": "positive|negative|mixed",
  "keyInsights": ["insight1", "insight2", "insight3"],
  "improvements": ["improvement1", "improvement2"],
  "strengths": ["strength1", "strength2"],
  "recommendations": ["recommendation1", "recommendation2"],
  "learningPoints": ["learning1", "learning2"]
}

Focus on:
1. What worked well and should be repeated
2. What didn't work and should be avoided
3. Specific improvements for content, timing, or approach
4. Patterns that could inform future posts
5. Restaurant-specific preferences that emerged

Keep insights concise, actionable, and specific to restaurant marketing.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are an expert restaurant marketing analyst. Provide structured, actionable insights from feedback data."
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
    let feedbackSummary: FeedbackSummary;
    try {
      // Try to extract JSON from the response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        feedbackSummary = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      // Fallback: create a basic summary if JSON parsing fails
      feedbackSummary = {
        overallRating: feedbackData.feedback === 'helpful' ? 'positive' : 'negative',
        keyInsights: [
          `Overall feedback: ${feedbackData.feedback}`,
          feedbackData.detailedFeedback.notes || 'No additional notes provided'
        ],
        improvements: [],
        strengths: [],
        recommendations: [],
        learningPoints: []
      };
    }

    // Store the feedback summary in the database
    const summaryData = {
      postId: feedbackData.postId,
      restaurantId: feedbackData.restaurantId,
      originalFeedback: feedbackData,
      summary: feedbackSummary,
      createdAt: new Date().toISOString(),
      processedAt: new Date().toISOString()
    };

    // Here you would typically save to your database
    // For now, we'll return the summary
    console.log('Feedback processed and summarized:', summaryData);

    return NextResponse.json({
      success: true,
      summary: feedbackSummary,
      message: 'Feedback processed and summarized successfully'
    });

  } catch (error) {
    console.error('Error processing feedback:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process feedback',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
