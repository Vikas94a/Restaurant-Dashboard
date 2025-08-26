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
            restaurantDetails,
            previousPosts
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

        // Add previous posts and feedback context to guide the model
        if (previousPosts && previousPosts.length > 0) {
            context += "Previous AI Posts and Feedback (most recent first):\n";
            previousPosts.slice(0, 4).forEach((p: any, idx: number) => {
                const fb = p.feedback ? (p.feedback === 'helpful' ? 'HELPFUL' : 'NOT_HELPFUL') : 'UNKNOWN';
                context += `#${idx + 1} [${fb}] Title: ${p.title}\n`;
            });
            context += "\nWhen creating new posts, AVOID repeating topics that were NOT_HELPFUL and PREFER styles, themes, or items from posts marked HELPFUL.\n\n";
        }

        // Server-side structured logs of inputs for debugging
        try {
            console.groupCollapsed('[AI-POST][API] Build Prompt Context');
            console.log('Restaurant', { restaurantName, restaurantType, city });
            console.log('Sales categories', topSellingItems?.length || 0);
            console.log('Weather days', weatherData?.length || 0);
            console.log('City events', cityEvents?.length || 0);
            console.log('Prev posts', previousPosts?.length || 0);
            console.groupEnd();
        } catch {}

        // Build input summary for debugging (no chain-of-thought)
        const inputSummary = {
            salesCategories: Array.isArray(topSellingItems) ? topSellingItems.length : 0,
            topItemsPreview: Array.isArray(topSellingItems) && topSellingItems[0]?.items
                ? topSellingItems[0].items.slice(0, 3).map((i: any) => i.name)
                : [],
            weatherDays: Array.isArray(weatherData) ? weatherData.length : 0,
            weatherPreview: Array.isArray(weatherData)
                ? weatherData.slice(0, 2).map((d: any) => ({ day: d.day, condition: d.condition, category: d.weatherCategory }))
                : [],
            cityEventsCount: Array.isArray(cityEvents) ? cityEvents.length : 0,
            cityEventsPreview: Array.isArray(cityEvents)
                ? cityEvents.slice(0, 2).map((e: any) => e.title)
                : [],
            previousPostsCount: Array.isArray(previousPosts) ? previousPosts.length : 0,
            previousFeedback: Array.isArray(previousPosts)
                ? previousPosts.reduce((acc: any, p: any) => {
                    if (p.feedback === 'helpful') acc.helpful += 1;
                    else if (p.feedback === 'not_helpful') acc.notHelpful += 1;
                    return acc;
                }, { helpful: 0, notHelpful: 0 })
                : { helpful: 0, notHelpful: 0 },
        } as any;

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
        const todayIso = new Date();
        const dayOffset = (index: number) => (index === 0 ? 0 : 2); // Day 1 and Day 3 pattern
        const toYmd = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString().split('T')[0];

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
            scheduledDate: toYmd(new Date(todayIso.getFullYear(), todayIso.getMonth(), todayIso.getDate() + dayOffset(index))),
            imageRecommendations: post.imageRecommendations || {
                whatToPhotograph: "Fotografer restaurantens beste retter",
                photoTips: ["Bruk god belysning", "Fokuser på detaljer", "Inkluder restaurantmiljø"],
                chatgptPrompt: "Kan du forbedre dette restaurantbildet? Gjør det mer appetittvekkende og profesjonelt for Facebook markedsføring. Juster belysning, farger, kontrast og skarphet. Fjern eventuelle distraksjoner og fokuser på maten/restauranten. Gi meg et forbedret bilde som er klar til å bruke på sosiale medier.",
                imageDescription: "Et appetittvekkende bilde av restaurantens mat"
            }
        }));

        // Create a concise, programmatic reasoning summary (no chain-of-thought)
        const previousNotHelpful = Array.isArray(previousPosts)
            ? previousPosts.filter((p: any) => p.feedback === 'not_helpful').map((p: any) => p.title)
            : [];
        const previousHelpful = Array.isArray(previousPosts)
            ? previousPosts.filter((p: any) => p.feedback === 'helpful').map((p: any) => p.title)
            : [];

        const reasoningSummary = {
            factors: [
                inputSummary.salesCategories > 0 ? 'Top-selling items' : null,
                inputSummary.weatherDays > 0 ? 'Weather conditions' : null,
                inputSummary.cityEventsCount > 0 ? 'City events' : null,
                inputSummary.previousPostsCount > 0 ? 'Previous post feedback' : null,
            ].filter(Boolean),
            strategy: previousHelpful.length > previousNotHelpful.length
                ? 'Emphasize themes and items from previously helpful posts; align with weather and events.'
                : 'Explore varied themes while avoiding previously not-helpful topics; align with weather and events.',
            avoidedTopics: previousNotHelpful.slice(0, 5),
            reusedThemes: previousHelpful.slice(0, 5),
            confidence: Math.min(1, 0.4
                + (inputSummary.salesCategories > 0 ? 0.2 : 0)
                + (inputSummary.weatherDays > 0 ? 0.2 : 0)
                + (inputSummary.cityEventsCount > 0 ? 0.1 : 0)
                + (inputSummary.previousPostsCount > 0 ? 0.1 : 0)
            )
        } as any;

        // Server-side structured output logs
        try {
            console.groupCollapsed('[AI-POST][API] OpenAI Response Parsed');
            console.log('Posts count', posts.length);
            console.log('Titles', posts.map((p: any) => p.title));
            console.groupEnd();
        } catch {}

        return NextResponse.json({
            success: true,
            posts: posts,
            debug: {
                inputSummary,
                reasoningSummary,
                openai: {
                    finishReason: data.choices?.[0]?.finish_reason || null,
                    usage: data.usage || null
                }
            }
        });

    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to generate marketing posts' },
            { status: 500 }
        );
    }
} 