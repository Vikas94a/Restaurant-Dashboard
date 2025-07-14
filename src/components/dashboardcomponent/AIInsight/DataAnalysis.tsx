"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, query, orderBy, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { NestedMenuItem } from "@/utils/menuTypes";
import type { Order } from "@/types/order";

export interface SalesInsight {
    itemId: string;
    itemName: string;
    totalSold: number;
    totalRevenue: number;
    averageOrderValue: number;
    lastOrdered: Date | null;
    category: string;
    price: number;
}

export interface MenuAnalysis {
    totalItems: number;
    categories: { [key: string]: number };
    bestSellers: SalesInsight[];
    lowSellers: SalesInsight[];
    zeroSellers: NestedMenuItem[];
    topCategories: { category: string; count: number; revenue: number }[];
    averageItemPrice: number;
}

export interface OrderPatterns {
    totalOrders: number;
    averageOrderValue: number;
    salesByDay: { day: string; orders: number; revenue: number }[];
    salesByHour: { hour: number; orders: number; revenue: number }[];
    topOrderTimes: string[];
    seasonalTrends: { month: string; orders: number; revenue: number }[];
}

export interface DataAnalysisProps {
    restaurantId: string;
    onAnalysisComplete: (analysis: {
        menuAnalysis: MenuAnalysis;
        orderPatterns: OrderPatterns;
        salesInsights: SalesInsight[];
    }) => void;
}

export const DataAnalysis: React.FC<DataAnalysisProps> = ({ 
    restaurantId, 
    onAnalysisComplete 
}) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [analysis, setAnalysis] = useState<{
        menuAnalysis: MenuAnalysis;
        orderPatterns: OrderPatterns;
        salesInsights: SalesInsight[];
    } | null>(null);

    // Helper to flatten Order[] to OrderItem[]
    const flattenOrdersToOrderItems = (orders: Order[]): any[] => {
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
    };

   
    // Analyze sales data
    const analyzeSales = (orderItems: any[], menuItems: NestedMenuItem[]): SalesInsight[] => {
        const salesMap = new Map<string, SalesInsight>();

        // Initialize sales map with menu items
        menuItems.forEach(item => {
            salesMap.set(item.id, {
                itemId: item.id,
                itemName: item.name,
                totalSold: 0,
                totalRevenue: 0,
                averageOrderValue: 0,
                lastOrdered: null,
                category: item.category || 'Other',
                price: item.price?.amount || 0
            });
        });

        // Calculate sales data
        orderItems.forEach(item => {
            const existing = salesMap.get(item.itemId);
            if (existing) {
                existing.totalSold += item.quantity;
                existing.totalRevenue += item.price * item.quantity;
                existing.averageOrderValue = existing.totalRevenue / existing.totalSold;
                
                const orderDate = new Date(item.createdAt);
                if (!existing.lastOrdered || orderDate > existing.lastOrdered) {
                    existing.lastOrdered = orderDate;
                }
            }
        });

        return Array.from(salesMap.values()).sort((a, b) => b.totalSold - a.totalSold);
    };

    // Analyze menu performance
    const analyzeMenu = (salesInsights: SalesInsight[], menuItems: NestedMenuItem[]): MenuAnalysis => {
        const categories: { [key: string]: number } = {};
        const categoryRevenue: { [key: string]: number } = {};

        // Count items by category
        menuItems.forEach(item => {
            const category = item.category || 'Other';
            categories[category] = (categories[category] || 0) + 1;
        });

        // Calculate revenue by category
        salesInsights.forEach(insight => {
            const category = insight.category;
            categoryRevenue[category] = (categoryRevenue[category] || 0) + insight.totalRevenue;
        });

        // Get top categories
        const topCategories = Object.keys(categories).map(category => ({
            category,
            count: categories[category],
            revenue: categoryRevenue[category] || 0
        })).sort((a, b) => b.revenue - a.revenue);

        // Separate items by performance
        const bestSellers = salesInsights.filter(item => item.totalSold > 0).slice(0, 5);
        const lowSellers = salesInsights.filter(item => item.totalSold > 0 && item.totalSold <= 2);
        const zeroSellers = menuItems.filter(item => 
            !salesInsights.find(insight => insight.itemId === item.id && insight.totalSold > 0)
        );

        const totalPrices = menuItems.reduce((sum, item) => sum + (item.price?.amount || 0), 0);
        const averageItemPrice = menuItems.length > 0 ? totalPrices / menuItems.length : 0;

        return {
            totalItems: menuItems.length,
            categories,
            bestSellers,
            lowSellers,
            zeroSellers,
            topCategories,
            averageItemPrice
        };
    };

    // Analyze order patterns
    const analyzeOrderPatterns = (orders: Order[]): OrderPatterns => {
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const salesByDay: { [key: string]: { orders: number; revenue: number } } = {};
        const salesByHour: { [key: number]: { orders: number; revenue: number } } = {};
        const monthlySales: { [key: string]: { orders: number; revenue: number } } = {};

        // Initialize data structures
        dayNames.forEach(day => {
            salesByDay[day] = { orders: 0, revenue: 0 };
        });
        for (let i = 0; i < 24; i++) {
            salesByHour[i] = { orders: 0, revenue: 0 };
        }

        let totalRevenue = 0;
        const orderTimes: Date[] = [];

        orders.forEach(order => {
            const orderDate = new Date(order.createdAt);
            const day = dayNames[orderDate.getDay()];
            const hour = orderDate.getHours();
            const month = orderDate.toLocaleDateString('en-US', { month: 'long' });

            // Calculate order revenue
            const orderRevenue = Array.isArray(order.items) 
                ? order.items.reduce((sum, item) => sum + (item.itemPrice || 0) * (item.quantity || 0), 0)
                : 0;

            // Update day sales
            salesByDay[day].orders += 1;
            salesByDay[day].revenue += orderRevenue;

            // Update hour sales
            salesByHour[hour].orders += 1;
            salesByHour[hour].revenue += orderRevenue;

            // Update monthly sales
            if (!monthlySales[month]) {
                monthlySales[month] = { orders: 0, revenue: 0 };
            }
            monthlySales[month].orders += 1;
            monthlySales[month].revenue += orderRevenue;

            totalRevenue += orderRevenue;
            orderTimes.push(orderDate);
        });

        // Find top order times
        const topOrderTimes = Object.entries(salesByHour)
            .sort(([, a], [, b]) => b.orders - a.orders)
            .slice(0, 3)
            .map(([hour]) => `${hour}:00`);

        const averageOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;

        return {
            totalOrders: orders.length,
            averageOrderValue,
            salesByDay: dayNames.map(day => ({
                day,
                orders: salesByDay[day].orders,
                revenue: salesByDay[day].revenue
            })),
            salesByHour: Object.entries(salesByHour).map(([hour, data]) => ({
                hour: parseInt(hour),
                orders: data.orders,
                revenue: data.revenue
            })),
            topOrderTimes,
            seasonalTrends: Object.entries(monthlySales).map(([month, data]) => ({
                month,
                orders: data.orders,
                revenue: data.revenue
            }))
        };
    };

    // Main analysis function
    const performAnalysis = async () => {
        if (!restaurantId) return;

        setLoading(true);
        setError(null);

        try {
            // Fetch menu items
            const menuItemsRef = collection(db, 'restaurants', restaurantId, 'menu');
            const menuSnapshot = await getDocs(menuItemsRef);
            const menuItems = menuSnapshot.docs.map(doc => ({ 
                id: doc.id, 
                ...doc.data() 
            }) as NestedMenuItem);

            // Fetch order history (last 6 months)
            const ordersRef = collection(db, 'restaurants', restaurantId, 'orders');
            const sixMonthsAgo = new Date();
            sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
            
            const ordersQuery = query(
                ordersRef,
                where('status', 'in', ['completed', 'confirmed']),
                where('createdAt', '>=', sixMonthsAgo.toISOString()),
                orderBy('createdAt', 'desc')
            );
            const ordersSnapshot = await getDocs(ordersQuery);
            const orders = ordersSnapshot.docs.map(doc => ({ 
                id: doc.id, 
                ...doc.data() 
            }) as Order);

            // Perform analysis
            const orderItems = flattenOrdersToOrderItems(orders);
            const salesInsights = analyzeSales(orderItems, menuItems);
            const menuAnalysis = analyzeMenu(salesInsights, menuItems);
            const orderPatterns = analyzeOrderPatterns(orders);

            const analysisResult = {
                menuAnalysis,
                orderPatterns,
                salesInsights
            };

            setAnalysis(analysisResult);
            onAnalysisComplete(analysisResult);

        } catch (err) {
            console.error("Error in data analysis:", err);
            setError(err instanceof Error ? err.message : "Failed to analyze data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (restaurantId) {
            performAnalysis();
        }
    }, [restaurantId]);

    if (loading) {
        return (
            <div className="p-6 bg-white rounded-lg shadow">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Analyzing your restaurant data...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 bg-white rounded-lg shadow">
                <div className="text-center text-red-600">
                    <p>Error: {error}</p>
                    <button 
                        onClick={performAnalysis}
                        className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        Retry Analysis
                    </button>
                </div>
            </div>
        );
    }

    if (!analysis) {
        return null;
    }

    console.log(analysis);

    return (
        <div className="space-y-6">
            {/* Menu Analysis Summary */}
            <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">Menu Performance Summary</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{analysis.menuAnalysis.totalItems}</div>
                        <div className="text-sm text-gray-600">Total Items</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{analysis.menuAnalysis.bestSellers.length}</div>
                        <div className="text-sm text-gray-600">Best Sellers</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-600">{analysis.menuAnalysis.lowSellers.length}</div>
                        <div className="text-sm text-gray-600">Low Sellers</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">{analysis.menuAnalysis.zeroSellers.length}</div>
                        <div className="text-sm text-gray-600">Zero Sales</div>
                    </div>
                </div>
            </div>

            {/* Best Sellers */}
            <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">Top Performing Items</h3>
                <div className="space-y-3">
                    {analysis.menuAnalysis.bestSellers.map((item, index) => (
                        <div key={item.itemId} className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                            <div className="flex items-center">
                                <span className="text-lg font-bold text-green-600 mr-3">#{index + 1}</span>
                                <div>
                                    <div className="font-medium">{item.itemName}</div>
                                    <div className="text-sm text-gray-600">{item.category}</div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="font-semibold">{item.totalSold} sold</div>
                                <div className="text-sm text-gray-600">kr{item.totalRevenue.toFixed(2)}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Items Needing Promotion */}
            <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">Items Needing Promotion</h3>
                <div className="space-y-3">
                    {analysis.menuAnalysis.lowSellers.slice(0, 5).map((item) => (
                        <div key={item.itemId} className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                            <div>
                                <div className="font-medium">{item.itemName}</div>
                                <div className="text-sm text-gray-600">{item.category}</div>
                            </div>
                            <div className="text-right">
                                <div className="font-semibold text-yellow-600">{item.totalSold} sold</div>
                                <div className="text-sm text-gray-600">kr{item.totalRevenue.toFixed(2)}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Zero Sales Items */}
            {analysis.menuAnalysis.zeroSellers.length > 0 && (
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold mb-4">Items with No Sales</h3>
                    <div className="space-y-2">
                        {analysis.menuAnalysis.zeroSellers.slice(0, 5).map((item) => (
                            <div key={item.id} className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                                <div>
                                    <div className="font-medium">{item.name}</div>
                                    <div className="text-sm text-gray-600">{item.category || 'Uncategorized'}</div>
                                </div>
                                <div className="text-right">
                                    <div className="font-semibold text-red-600">0 sold</div>
                                    <div className="text-sm text-gray-600">kr{(item.price?.amount || 0).toFixed(2)}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default DataAnalysis; 