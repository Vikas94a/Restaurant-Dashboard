"use client";

import { useState, useEffect } from "react";
import { useAppSelector } from "@/store/hooks";
import { collection, getDocs, query, orderBy, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { 
    AIPostGenerator,
    useWeatherData,
    CityEvents,
    type WeatherDay,
    type CityEvent,
    type SimplifiedCategoryData
} from "@/features/ai-insight/components";

export default function AIInsightPage() {
    const restaurantDetails = useAppSelector((state) => state.auth.restaurantDetails);
    const restaurantId = restaurantDetails?.restaurantId;
    
    // Simplified data state
    const [topSellingItems, setTopSellingItems] = useState<SimplifiedCategoryData[]>([]);
    const [loading, setLoading] = useState(false);
    
    // Generated post state
    const [generatedPost, setGeneratedPost] = useState<any | null>(null);
    
    // Use the weather hook
    const { weatherData, loading: weatherLoading, error: weatherError } = useWeatherData(restaurantDetails?.city || '');
    
    // City events state
    const [cityEvents, setCityEvents] = useState<CityEvent[]>([]);

    // Simplified function to get top selling items (copied from analytics page)
    const getTopSellingItemsLast3Months = async () => {
        if (!restaurantId) return [];
        
        const now = new Date();
        const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
        
        function toDate(val: any): Date | null {
            if (!val) return null;
            if (val instanceof Date) return val;
            if (typeof val === 'object' && typeof val.seconds === 'number') {
                return new Date(val.seconds * 1000);
            }
            if (typeof val === 'string') {
                const d = new Date(val);
                return isNaN(d.getTime()) ? null : d;
            }
            return null;
        }

        try {
            // Fetch orders from last 3 months
            const ordersRef = collection(db, 'restaurants', restaurantId, 'orders');
            const ordersQuery = query(
                ordersRef,
                where('status', 'in', ['completed', 'confirmed']),
                orderBy('createdAt', 'desc')
            );
            const ordersSnapshot = await getDocs(ordersQuery);
            
            // Filter orders from last 3 months
            const recentOrders = ordersSnapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() } as any))
                .filter(order => {
                    const createdAt = toDate(order.createdAt);
                    return createdAt && createdAt >= threeMonthsAgo && createdAt <= now;
                });

            // Simple aggregation by item name and category
            const salesByCategory: { [category: string]: { [itemName: string]: number } } = {};
            
            recentOrders.forEach(order => {
                if (!Array.isArray(order.items)) return;
                order.items.forEach((item: any) => {
                    const itemName = item.itemName || 'Unknown Item';
                    const category = item.categoryName || 'Other';
                    const quantity = item.quantity || 0;
                    
                    if (!salesByCategory[category]) {
                        salesByCategory[category] = {};
                    }
                    if (!salesByCategory[category][itemName]) {
                        salesByCategory[category][itemName] = 0;
                    }
                    salesByCategory[category][itemName] += quantity;
                });
            });

            // Convert to simple array format
            const result = Object.entries(salesByCategory).map(([category, items]) => ({
                category,
                items: Object.entries(items).map(([name, sales]) => ({
                    name,
                    sales
                })).sort((a, b) => b.sales - a.sales) // Sort by sales descending
            }));

            return result;
        } catch (error) {
            return [];
        }
    };

    // Load sales data on component mount
    useEffect(() => {
        const loadSalesData = async () => {
            setLoading(true);
            const data = await getTopSellingItemsLast3Months();
            setTopSellingItems(data);
            setLoading(false);
        };

        if (restaurantId) {
            loadSalesData();
        }
    }, [restaurantId]);

    // Handle post generation
    const handlePostGenerated = (post: any) => {
        setGeneratedPost(post);
    };

    // Handle city events change
    const handleCityEventsChange = (events: CityEvent[]) => {
        setCityEvents(events);
    };

    if (!restaurantId) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-8">
                <div className="text-center">
                    <h2 className="text-2xl font-bold mb-4">AI Insight</h2>
                    <p className="text-gray-600">Please complete your restaurant setup to access AI insights.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Marketing Insight</h1>
                    <p className="text-lg text-gray-600">
                        AI-powered marketing and analytics insights for {restaurantDetails?.name}
                    </p>
                </div>

                {/* Weather Data Display */}
                {weatherLoading && (
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="text-center text-blue-600">Loading weather data...</div>
                    </div>
                )}
                
                {weatherError && (
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="text-center text-red-600">Weather Error: {weatherError}</div>
                    </div>
                )}
                
                {weatherData.length > 0 && (
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">3-Day Weather Forecast</h3>
                            <div className="text-xs text-gray-500">
                                Free tier (3 days)
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                            {weatherData.map((day, index) => (
                                <div key={index} className="text-center p-3 border rounded-lg bg-gray-50">
                                    <div className="font-medium text-gray-800">{day.day}</div>
                                    <div className="text-xs text-gray-500 mb-1">{day.date}</div>
                                    <div className="text-xl font-bold text-gray-900">{day.maxTemp}°</div>
                                    <div className="text-sm text-gray-600 mb-1">{day.minTemp}°</div>
                                    <div className="text-xs capitalize text-gray-700 mb-1">{day.condition}</div>
                                    <div className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded-full inline-block">
                                        {day.weatherCategory}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* City Events Management */}
                <div className="bg-white rounded-lg shadow p-6">
                    <CityEvents 
                        onEventsChange={handleCityEventsChange}
                        initialEvents={cityEvents}
                        location={restaurantDetails?.city || 'Your City'}
                    />
                </div>

                {/* AI Post Generator Section */}
                <div className="bg-white rounded-lg shadow">
                    <div className="p-6 border-b">
                        <h2 className="text-xl font-semibold">AI Marketing Post Generator</h2>
                        <p className="text-gray-600 mt-1">
                            Generate targeted social media posts based on your sales data, weather, and city events
                        </p>
                    </div>
                    <div className="p-6">
                        <AIPostGenerator
                            topSellingItems={topSellingItems}
                            weatherData={weatherData}
                            cityEvents={cityEvents}
                            restaurantName={restaurantDetails?.name || 'Your Restaurant'}
                            restaurantType={restaurantDetails?.restaurantType || 'restaurant'}
                            city={restaurantDetails?.city || 'Your City'}
                            restaurantDetails={restaurantDetails}
                            onPostGenerated={handlePostGenerated}
                        />
                    </div>
                </div>

                {/* Generated Post History (Future Phase 2) */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold mb-4">Post Performance Tracking</h2>
                    <div className="text-center text-gray-500 py-8">
                        <p className="text-lg mb-2">📊 Post Performance Analytics</p>
                        <p className="text-sm">Coming in Phase 2: Track post performance and get AI-powered insights</p>
                        <div className="mt-4 space-y-2 text-sm">
                            <p>• Post engagement metrics</p>
                            <p>• Customer feedback collection</p>
                            <p>• AI learning from performance data</p>
                            <p>• Improved recommendations over time</p>
                        </div>
                    </div>
                </div>

                {/* Advanced Features Preview (Future Phase 3) */}
                {/* <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold mb-4">Advanced AI Features</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="text-center p-4 border rounded-lg">
                            <div className="text-2xl mb-2">🍽️</div>
                            <h3 className="font-semibold mb-2">New Dish Recommendations</h3>
                            <p className="text-sm text-gray-600">
                                AI suggests new dishes based on trends, ingredients, and customer preferences
                            </p>
                        </div>
                        <div className="text-center p-4 border rounded-lg">
                            <div className="text-2xl mb-2">💰</div>
                            <h3 className="font-semibold mb-2">Paid Promotion Analysis</h3>
                            <p className="text-sm text-gray-600">
                                Smart recommendations for paid social media campaigns with ROI predictions
                            </p>
                        </div>
                        <div className="text-center p-4 border rounded-lg">
                            <div className="text-2xl mb-2">🎯</div>
                            <h3 className="font-semibold mb-2">Customer Behavior Learning</h3>
                            <p className="text-sm text-gray-600">
                                AI learns from your customers' preferences and improves recommendations
                            </p>
                        </div>
                    </div>
                </div> */}
            </div>
        </div>
    );
} 