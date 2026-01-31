    import { NextRequest, NextResponse } from 'next/server';
    import { FeedbackProcessor } from '@/services/feedbackProcessor';

    // Force dynamic rendering - don't pre-render at build time
    export const dynamic = 'force-dynamic';
    export const runtime = 'nodejs';

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

            // Add AI-processed feedback insights for smarter generation
            try {
                const restaurantId = restaurantDetails?.restaurantId;
                if (restaurantId) {
                    const feedbackHistory = await FeedbackProcessor.getFeedbackHistoryForAI(restaurantId);
                    if (feedbackHistory && feedbackHistory !== 'No previous feedback available.') {
                        context += feedbackHistory + "\n\n";
                        context += "Use this feedback analysis to create better posts that align with what has worked well and avoid what hasn't worked.\n\n";
                    }
                }
            } catch (error) {
                console.error('Failed to get feedback history for AI:', error);
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

            const prompt = `You are a Norwegian restaurant marketing strategist AI.

STEP 1 — CONTEXT ANALYSIS (DO NOT OUTPUT THIS STEP):
First analyze the current date and determine:
1. Current month and season in Norway (winter, spring, summer, autumn)
2. Typical weather conditions for this time of year
3. Relevant cultural or food-related periods (Valentine’s Day, Easter, Ramadan, summer holidays, 17. mai, Christmas, back-to-school, etc.)
4. Select ONE main weekly campaign theme based on the above (examples: romance & coziness, comfort food, fresh summer flavors, family time, celebration, warmth, healthy start, festive sharing, etc.)

STEP 2 — POST STRATEGY PLANNING (DO NOT OUTPUT THIS STEP):
Based on the chosen campaign theme, plan 3 different post types:
- One emotional or storytelling post (brand & feeling)
- One product or best-seller focused post (sales-driven)
- One weather or event-based post (situational relevance)

Avoid repeating the same angle or wording across posts.
Each post must feel different in purpose and style.

STEP 3 — CONTENT GENERATION:
Based on the restaurant data provided, generate exactly 3 Facebook marketing posts in Norwegian (Bokmål).

IMPORTANT REQUIREMENTS:
- Write all content in Norwegian (Bokmål)
- Use Norwegian Krone (NOK) for all prices and budget recommendations
- Make posts natural and authentic for Norwegian audience
- Adapt tone and food focus to the selected campaign theme and weather
- Mention city events only if relevant
- Use appropriate Norwegian hashtags and emojis
- Reference restaurant details (address, phone, opening hours)
- Include strong call-to-action in Norwegian
- Vary style between posts (not repetitive)
- Do NOT reuse the same structure or hook in all posts

PAID PROMOTION STRATEGY:
- Recommend paid promotion ONLY when it creates real business value, such as:
  * Seasonal campaigns (Valentine’s, holidays, festivals)
  * Limited-time offers
  * New or unique menu items
  * Weather-driven opportunities (cold days = soups & curry, hot days = fresh & light food)
  * High-margin dishes
- Do NOT recommend paid promotion for ordinary daily posts
- If paid promotion is recommended, explain WHY and expected ROI

IMAGE STRATEGY:
Each post must include image recommendations that match:
- The campaign theme
- Weather mood
- Emotional tone of the post
- Food type (comfort food vs fresh dishes)

Example image prompt style:
"Kan du forbedre dette restaurantbildet? Gjør det mer stemningsfullt og profesjonelt for Facebook markedsføring. Juster lys, varme farger, kontrast og fokus på maten. Fjern distraksjoner og skap en atmosfære som passer til sesongen."

FORMAT REQUIREMENTS:
Generate exactly 3 posts as a JSON array with these exact keys:

- day: "Day 1", "Day 2", "Day 3"
- title: Catchy emoji-filled title in Norwegian
- content: Engaging Facebook post in Norwegian with emojis and line breaks
- hashtags: Array of 5–8 relevant Norwegian hashtags (MUST be an array)
- callToAction: Compelling CTA in Norwegian
- estimatedReach: "Low", "Medium", or "High"
- paidPromotion: true or false
- budgetRecommendation: If paidPromotion is true, give a NOK range with ROI justification, otherwise null
- imageRecommendations:
    {
      whatToPhotograph: "Beskrivelse av hva som skal fotograferes",
      photoTips: ["Tips 1", "Tips 2", "Tips 3"],
      chatgptPrompt: "Prompt for bildeforbedring",
      imageDescription: "Hvordan bildet skal se ut og stemningen det skal ha"
    }

ADAPTIVE BEHAVIOR RULES:
- The campaign theme must change depending on month and season
- February should focus on romance & warmth
- Summer should focus on freshness & outdoor feeling
- Winter should focus on coziness & comfort food
- December should focus on festive & sharing
- Avoid repeating the same theme every week
- Avoid generic marketing language
- Be specific, local, and culturally Norwegian

Return ONLY the JSON array with exactly 3 posts. No explanations, no analysis, no extra text.
`;
            
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
              },
              body: JSON.stringify({
                model: process.env.OPENAI_MODEL ?? 'gpt-4.1-mini',
                messages: [
                  {
                    role: 'system',
                    content:
                      'You are a professional social media marketing expert specializing in restaurant marketing in Norway. Create engaging, authentic posts in Norwegian (Bokmål) that drive customer engagement and visits. Always use Norwegian Krone (NOK) for currency and write all content in Norwegian language. Use specific restaurant details like address, phone number, and opening hours to make posts more personal and actionable. Include detailed image recommendations and ChatGPT prompts for image enhancement and improvement.'
                  },
                  {
                    role: 'user',
                    content: `${context}\n\n${prompt}`
                  }
                ],
                temperature: 0.7,
                max_tokens: 2000
              }),
            });
            
            if (!response.ok) {
              throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
            }
            
            const data = await response.json();
            const aiResponse = data.choices?.[0]?.message?.content;
            if (!aiResponse) {
              throw new Error('No response from OpenAI');
            }

            // --- small helper: more robust JSON extraction ---
            const extractJsonArray = (text: string): any[] => {
                if (!text) throw new Error('Empty response from model');
                const jsonMatch = text.match(/\[[\s\S]*\]/);
                if (!jsonMatch) throw new Error('No JSON array found in response');
                return JSON.parse(jsonMatch[0]);
            };

            // Try to parse JSON response
            let parsedResponse;
            try {
                parsedResponse = extractJsonArray(aiResponse);
            } catch (parseError) {
              // Fallback: build a single valid post from raw text
              const safeName = (restaurantName || 'Restaurant').replace(/\s+/g, '');
              const safeCity = (city || 'Norge').replace(/\s+/g, '');
              parsedResponse = [
                {
                  day: "Day 1",
                  title: "AI-generert markedsføringspost",
                  content: aiResponse,
                  hashtags: Array.from(new Set([`#${safeName}`, `#${safeCity}`, "#Mat", "#Restaurant", "#Deilig"])),
                  callToAction: "Besøk oss i dag!",
                  estimatedReach: "Medium",
                  paidPromotion: false,
                  budgetRecommendation: null,
                  imageRecommendations: {
                    whatToPhotograph: "Fotografer restaurantens mest populære retter",
                    photoTips: ["Bruk god belysning", "Fokuser på detaljer", "Inkluder litt av restaurantmiljøet"],
                    chatgptPrompt:
                      "Kan du forbedre dette restaurantbildet? Gjør det mer appetittvekkende og profesjonelt for Facebook markedsføring. Juster belysning, farger, kontrast og skarphet. Fjern eventuelle distraksjoner og fokuser på maten/restauranten. Gi meg et forbedret bilde som er klar til å bruke på sosiale medier.",
                    imageDescription: "Et appetittvekkende nærbilde av en signaturrett med tilbehør"
                  }
                }
              ];
            }
                        // Convert to MarketingPost format and ensure hashtags is always an array
            const todayIso = new Date();
            const dayOffset = (index: number) => (index === 0 ? 0 : index === 1 ? 1 : 1); // Day 1 and Day 2 pattern
            const toYmd = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString().split('T')[0];

            const posts = parsedResponse.map((post: any, index: number) => ({
                id: `auto-post-${index + 1}-${Date.now()}`,
                title: post.title || `Dag ${index === 0 ? '1' : '2'} Markedsføringspost`,
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
                day: post.day || `Dag ${index === 0 ? '1' : '2'}`,
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