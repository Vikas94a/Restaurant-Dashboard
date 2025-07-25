import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            topSellingItems,
            weatherData,
            cityEvents,
            restaurantName,
            restaurantType,
            city,
            restaurantDetails
        } = body;

        if (!process.env.OPENAI_API_KEY) {
            return NextResponse.json(
                { error: 'OpenAI API key not configured' },
                { status: 500 }
            );
        }

        // Prepare detailed context for the AI
        let context = `Restaurant: ${restaurantName} (${restaurantType}) in ${city}, Norway\n\n`;
        
        // Add detailed restaurant information
        if (restaurantDetails) {
            context += "Restaurant Details:\n";
            context += `- Name: ${restaurantDetails.name}\n`;
            context += `- Type: ${restaurantDetails.restaurantType}\n`;
            context += `- Address: ${restaurantDetails.streetName}, ${restaurantDetails.zipCode} ${restaurantDetails.city}\n`;
            context += `- Phone: ${restaurantDetails.phoneNumber}\n`;
            
            if (restaurantDetails.openingHours && restaurantDetails.openingHours.length > 0) {
                context += "- Opening Hours:\n";
                restaurantDetails.openingHours.forEach((hour: any) => {
                    if (!hour.closed) {
                        context += `  ${hour.day}: ${hour.open} - ${hour.close}\n`;
                    } else {
                        context += `  ${hour.day}: Closed\n`;
                    }
                });
            }
            context += "\n";
        }
        
        // Add sales data context
        if (topSellingItems && topSellingItems.length > 0) {
            context += "Top Selling Items:\n";
            topSellingItems.forEach((category: any) => {
                context += `${category.category}:\n`;
                category.items.slice(0, 3).forEach((item: any) => {
                    context += `- ${item.name}: ${item.sales} orders\n`;
                });
            });
            context += "\n";
        }

        // Add weather context for next 3 days (we'll use first and third)
        if (weatherData && weatherData.length > 0) {
            context += "Weather Forecast (Next 3 Days):\n";
            weatherData.forEach((day: any, index: number) => {
                context += `Day ${index + 1} (${day.day}): ${day.condition}, ${day.maxTemp}°F, ${day.weatherCategory}\n`;
            });
            context += "\n";
        }

        // Add city events context
        if (cityEvents && cityEvents.length > 0) {
            context += "Upcoming City Events:\n";
            cityEvents.slice(0, 5).forEach((event: any) => {
                context += `- ${event.title} (${event.day} at ${event.time}): ${event.description}\n`;
            });
            context += "\n";
        }

        const prompt = `Based on the restaurant data provided, automatically generate 2 Facebook marketing posts in NORWEGIAN language.

IMPORTANT REQUIREMENTS:
- Write all content in Norwegian (Bokmål)
- Use Norwegian Krone (NOK) for all prices and budget recommendations
- Make posts feel natural and authentic for Norwegian audience
- Use appropriate Norwegian hashtags and cultural references
- Generate posts for DAY 1 and DAY 3 only (skip day 2)
- Include specific image recommendations and ChatGPT prompts for image enhancement

Each post should be strategically planned based on:
1. Weather conditions for that specific day
2. Any city events happening on that day
3. Best-selling menu items
4. Restaurant type and location context
5. Restaurant details including address, phone, and opening hours

Create posts that are:
- Engaging and authentic for Norwegian audience
- Weather-appropriate (comfort food for cold/rainy days, fresh food for sunny days)
- Event-aware (if there are city events, mention them)
- Focused on your best-selling items
- Include relevant Norwegian hashtags and emojis
- Have strong calls-to-action in Norwegian
- Use NOK currency for any price mentions
- Reference specific restaurant details (address, phone, opening hours)

Generate exactly 2 posts: one for Day 1 and one for Day 3. Format each post as JSON with these exact keys:
- day: "Day 1" or "Day 3"
- title: A catchy, emoji-filled title in Norwegian
- content: Engaging Facebook content in Norwegian with emojis and line breaks
- hashtags: Array of 5-8 relevant Norwegian hashtags (MUST be an array)
- callToAction: A compelling call-to-action phrase in Norwegian
- estimatedReach: Low, Medium, or High
- paidPromotion: true or false with reasoning
- budgetRecommendation: If paid promotion is recommended, suggest a budget range in NOK
- imageRecommendations: {
    whatToPhotograph: "Beskrivelse av hva som skal fotograferes",
    photoTips: ["Tips 1", "Tips 2", "Tips 3"],
    chatgptPrompt: "Prompt for å forbedre bildet med ChatGPT",
    imageDescription: "Hvordan bildet skal se ut"
}

Example ChatGPT prompt for image enhancement:
"Kan du forbedre dette restaurantbildet? Gjør det mer appetittvekkende og profesjonelt for Facebook markedsføring. Juster belysning, farger, kontrast og skarphet. Fjern eventuelle distraksjoner og fokuser på maten/restauranten. Gi meg et forbedret bilde som er klar til å bruke på sosiale medier."

Return the response as a JSON array with exactly 2 posts.`;

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: [
                    {
                        role: 'system',
                        content: 'You are a professional social media marketing expert specializing in restaurant marketing in Norway. Create engaging, authentic posts in Norwegian (Bokmål) that drive customer engagement and visits. Always use Norwegian Krone (NOK) for currency and write all content in Norwegian language. Use specific restaurant details like address, phone number, and opening hours to make posts more personal and actionable. Include detailed image recommendations and ChatGPT prompts for image enhancement and improvement.'
                    },
                    {
                        role: 'user',
                        content: `${context}\n\n${prompt}`
                    }
                ],
                temperature: 0.8,
                max_tokens: 2000
            }),
        });

        if (!response.ok) {
            throw new Error(`OpenAI API error: ${response.statusText}`);
        }

        const data = await response.json();
        const aiResponse = data.choices[0]?.message?.content;

        if (!aiResponse) {
            throw new Error('No response from OpenAI');
        }

        // Try to parse JSON response
        let parsedResponse;
        try {
            // Extract JSON from the response (in case there's extra text)
            const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                parsedResponse = JSON.parse(jsonMatch[0]);
            } else {
                throw new Error('No JSON array found in response');
            }
        } catch (parseError) {
            // If JSON parsing fails, create fallback posts in Norwegian
            parsedResponse = [
                {
                    day: "Day 1",
                    title: "AI Generert Markedsføringspost",
                    content: aiResponse,
                    hashtags: [`#${restaurantName?.replace(/\s+/g, '')}`, `#${city?.replace(/\s+/g, '')}`, "#Mat", "#Restaurant", "#Deilig"],
                    callToAction: "Besøk oss i dag!",
                    estimatedReach: "Medium",
                    paidPromotion: false,
                    budgetRecommendation: null,
                    imageRecommendations: {
                        whatToPhotograph: "Fotografer restaurantens beste retter",
                        photoTips: ["Bruk god belysning", "Fokuser på detaljer", "Inkluder restaurantmiljø"],
                        chatgptPrompt: "Kan du forbedre dette restaurantbildet? Gjør det mer appetittvekkende og profesjonelt for Facebook markedsføring. Juster belysning, farger, kontrast og skarphet. Fjern eventuelle distraksjoner og fokuser på maten/restauranten. Gi meg et forbedret bilde som er klar til å bruke på sosiale medier.",
                        imageDescription: "Et appetittvekkende bilde av restaurantens mat"
                    }
                }
            ];
        }

        // Convert to MarketingPost format and ensure hashtags is always an array
        const posts = parsedResponse.map((post: any, index: number) => ({
            id: `auto-post-${index + 1}-${Date.now()}`,
            title: post.title || `Dag ${index === 0 ? '1' : '3'} Markedsføringspost`,
            content: post.content || "AI generert innhold",
            type: 'auto-generated' as any,
            targetItems: topSellingItems?.[0]?.items?.[0]?.name ? [topSellingItems[0].items[0].name] : [],
            suggestedPlatforms: ["Facebook"],
            estimatedReach: post.estimatedReach || "Medium",
            callToAction: post.callToAction || "Besøk oss i dag!",
            hashtags: Array.isArray(post.hashtags) ? post.hashtags : [`#${restaurantName?.replace(/\s+/g, '')}`, "#Mat"],
            postingTime: "12:00 - 13:00",
            paidPromotion: post.paidPromotion || false,
            budgetRecommendation: post.budgetRecommendation || null,
            day: post.day || `Dag ${index === 0 ? '1' : '3'}`,
            imageRecommendations: post.imageRecommendations || {
                whatToPhotograph: "Fotografer restaurantens beste retter",
                photoTips: ["Bruk god belysning", "Fokuser på detaljer", "Inkluder restaurantmiljø"],
                chatgptPrompt: "Kan du forbedre dette restaurantbildet? Gjør det mer appetittvekkende og profesjonelt for Facebook markedsføring. Juster belysning, farger, kontrast og skarphet. Fjern eventuelle distraksjoner og fokuser på maten/restauranten. Gi meg et forbedret bilde som er klar til å bruke på sosiale medier.",
                imageDescription: "Et appetittvekkende bilde av restaurantens mat"
            }
        }));

        return NextResponse.json({
            success: true,
            posts: posts
        });

    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to generate marketing posts' },
            { status: 500 }
        );
    }
} 