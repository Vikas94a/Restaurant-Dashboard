"use client";

import { useState, useEffect } from "react";
import { useAppSelector } from "@/store/hooks";
import type { NestedMenuItem } from "@/utils/menuTypes";
import type { Order } from "@/types/order";
import { collection, getDocs, query, orderBy, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useWeatherData, type WeatherDay } from "@/components/dashboardcomponent/AIInsight/weatherData";
import { CityEvents, type CityEvent } from "@/components/dashboardcomponent/events";

export default function AIInsightPage() {
    const [loading, setLoading] = useState(false);
    const [menuItems, setMenuItems] = useState<NestedMenuItem[]>([]);
    const [orderHistory, setOrderHistory] = useState<Order[]>([]);
    const [result, setResult] = useState<string | null>(null);
    const restaurantDetails = useAppSelector((state) => state.auth.restaurantDetails);
    const restaurantId = restaurantDetails?.restaurantId;
    
    // Use the weather hook
    const { weatherData, loading: weatherLoading, error: weatherError } = useWeatherData(restaurantDetails?.city || '');
    
    // City events state
    const [cityEvents, setCityEvents] = useState<CityEvent[]>([]);

    // Fetch menu items and order history (last 3 months)
    useEffect(() => {
        if (!restaurantId) return;
        const fetchData = async () => {
            // Fetch menu items
            const menuItemsRef = collection(db, 'restaurants', restaurantId, 'menu');
            const menuSnapshot = await getDocs(menuItemsRef);
            setMenuItems(menuSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as NestedMenuItem));
            // Fetch order history
            const ordersRef = collection(db, 'restaurants', restaurantId, 'orders');
            const ordersQuery = query(
                ordersRef,
                where('status', 'in', ['completed', 'confirmed']),
                orderBy('createdAt', 'desc')
            );
            const ordersSnapshot = await getDocs(ordersQuery);
            setOrderHistory(ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Order));
        };
        fetchData();
    }, [restaurantId]);

    // Helper to flatten Order[] to OrderItem[]
    function flattenOrdersToOrderItems(orders: Order[]): any[] {
        const result: any[] = [];
        orders.forEach(order => {
            if (!Array.isArray(order.items)) return;
            order.items.forEach(item => {
                result.push({
                    id: item.id || '',
                    itemId: item.itemId || item.id || '',
                    name: item.itemName || '',
                    price: item.itemPrice || 0,
                    quantity: item.quantity || 0,
                    createdAt: order.createdAt,
                    status: order.status as any
                });
            });
        });
        return result;
    }

    // Helper to get sales by day of week
    function getSalesByDay(orderHistory: Order[]) {
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const salesByDay: { [day: string]: number } = { Sunday: 0, Monday: 0, Tuesday: 0, Wednesday: 0, Thursday: 0, Friday: 0, Saturday: 0 };
        const nowDate = new Date();
        const threeMonthsAgoDate = new Date(nowDate.getFullYear(), nowDate.getMonth() - 3, nowDate.getDate());
        orderHistory.forEach(order => {
            const createdAt = new Date(order.createdAt);
            if (createdAt >= threeMonthsAgoDate && createdAt <= nowDate) {
                const day = dayNames[createdAt.getDay()];
                salesByDay[day] += 1;
            }
        });
        return dayNames.map(day => ({ day, orders: salesByDay[day] }));
    }

    // Main AI logic
    const testAIInsight = async () => {
        setLoading(true);
        setResult(null);
        
        try {
            // Prepare data for AI analysis
            const salesByDay = getSalesByDay(orderHistory);
            const orderItems = flattenOrdersToOrderItems(orderHistory);
            
            // Create comprehensive data object for AI
            const aiData = {
                restaurant: {
                    name: restaurantDetails?.name,
                    city: restaurantDetails?.city,
                    type: restaurantDetails?.restaurantType
                },
                menu: {
                    totalItems: menuItems.length,
                    categories: menuItems.reduce((acc: any, item) => {
                        const category = item.category || 'Uncategorized';
                        acc[category] = (acc[category] || 0) + 1;
                        return acc;
                    }, {})
                },
                sales: {
                    totalOrders: orderHistory.length,
                    salesByDay: salesByDay,
                    topItems: orderItems.reduce((acc: any, item) => {
                        acc[item.name] = (acc[item.name] || 0) + item.quantity;
                        return acc;
                    }, {})
                },
                weather: {
                    forecast: weatherData,
                    loading: weatherLoading,
                    error: weatherError
                },
                cityEvents: {
                    upcoming: cityEvents,
                    totalEvents: cityEvents.length,
                    location: restaurantDetails?.city
                }
            };

            console.log("Data prepared for AI analysis:", aiData);
            
            // Here you would send aiData to your AI service
            // For now, we'll just display the structured data
            setResult(JSON.stringify(aiData, null, 2));
            
        } catch (err) {
            console.error("Error in AI insight generation:", err);
            setResult("Error generating AI insights. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-8">
            <h2 className="text-2xl font-bold mb-4">AI Insight</h2>
            <p className="text-lg text-gray-600 mb-6">AI-powered marketing and analytics insights for your restaurant.</p>
            
            {/* Weather Data Display */}
            {weatherLoading && (
                <div className="mb-4 text-blue-600">Loading weather data...</div>
            )}
            
            {weatherError && (
                <div className="mb-4 text-red-600">Weather Error: {weatherError}</div>
            )}
            
            {weatherData.length > 0 && (
                <div className="mb-6 p-4 bg-white rounded-lg shadow">
                    <div className="flex justify-between items-center mb-2">
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

            {/* City Events */}
            <div className="mb-6 w-full max-w-4xl">
                <CityEvents 
                    onEventsChange={setCityEvents}
                    initialEvents={cityEvents}
                    location={restaurantDetails?.city || "City"}
                />
            </div>
            
            <button
                onClick={testAIInsight}
                className="px-6 py-2 rounded-lg font-medium text-white bg-primary"
                disabled={loading}
            >
                {loading ? "Generating..." : "Generate AI Marketing Plan"}
            </button>
            
            {result && (
                <div className="mt-8 w-full max-w-4xl bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold mb-4">AI Analysis Results</h3>
                    <pre className="whitespace-pre-wrap text-sm text-gray-800 overflow-auto max-h-96">
                        {result}
                    </pre>
                </div>
            )}
        </div>
    );
} 