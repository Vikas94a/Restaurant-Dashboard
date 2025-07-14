"use client";

import { useState, useEffect } from 'react';
import { useAppSelector } from '@/store/hooks';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartLine, faChartBar, faChartPie, faCalendarAlt } from '@fortawesome/free-solid-svg-icons';
import { format } from 'date-fns';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { collection, getDocs, query, orderBy, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { NestedMenuItem } from '@/utils/menuTypes';
import type { Order } from '@/types/order';
import AnalyticsNavigation from '@/components/dashboardcomponent/AnalyticsNavigation';
import { BarChart3, TrendingUp, DollarSign, Star, ThumbsUp } from 'lucide-react';
import { PerformanceChart } from '@/components/dashboardcomponent/analytics/performance';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { MenuInsight } from '@/components/dashboardcomponent/analytics/MenuInsight';
import { fetchRestaurantData } from '@/store/features/authSlice';


export default function AnalyticsPage() {
    const [activeTab, setActiveTab] = useState('overview');
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [totalOrders, setTotalOrders] = useState(0);
    const [totalRevenue, setTotalRevenue] = useState(0);
    const [categoryData, setCategoryData] = useState<{ name: string; value: number }[]>([]);
    const [menuItems, setMenuItems] = useState<NestedMenuItem[]>([]);
    const [orderHistory, setOrderHistory] = useState<Order[]>([]);
    const [isMenuLoading, setIsMenuLoading] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const user = useAppSelector((state) => state.auth.user);

    // Get restaurant ID from Redux store
    const { restaurantDetails, isLoading } = useAppSelector((state) => state.auth);
    const restaurantId = restaurantDetails?.restaurantId;

    const handleDataUpdate = (orders: number, revenue: number) => {
        setTotalOrders(orders);
        setTotalRevenue(revenue);
    };

    const fetchCategoryData = async () => {
        // Fetch category data from the menu subcollection
        // This is a placeholder for the actual implementation
        const categories = [
            { name: 'Category A', value: 30 },
            { name: 'Category B', value: 20 },
            { name: 'Category C', value: 50 },
        ];
        setCategoryData(categories);
    };

    useEffect(() => {
        fetchCategoryData();
    }, []);

    // Fetch menu items and order history
    useEffect(() => {
        const fetchMenuData = async () => {
            if (!restaurantId) return;

            setIsMenuLoading(true);
            try {
                // Fetch menu items
                const menuItemsRef = collection(db, 'restaurants', restaurantId, 'menu');
                const menuSnapshot = await getDocs(menuItemsRef);
                const items = menuSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as NestedMenuItem[];
                setMenuItems(items);

                // Fetch order history
                const ordersRef = collection(db, 'restaurants', restaurantId, 'orders');
                const ordersQuery = query(
                    ordersRef,
                    where('status', 'in', ['completed', 'confirmed']),
                    orderBy('createdAt', 'desc')
                );
                const ordersSnapshot = await getDocs(ordersQuery);
                const orders = ordersSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as Order[];
                setOrderHistory(orders);
            } catch (error) {
                console.error('Error fetching menu data:', error);
            } finally {
                setIsMenuLoading(false);
            }
        };

        fetchMenuData();
    }, [restaurantId]);

    // Calculate total revenue by summing all items in all orders
    const calculateRevenue = () => {
        return orderHistory.reduce((total, order) => {
            if (!Array.isArray(order.items)) return total;
            return total + order.items.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
        }, 0);
    };

    // Calculate total orders (number of orders)
    const calculateTotalOrders = () => {
        return orderHistory.length;
    };

    // Calculate popular items by aggregating all items in all orders
    const calculatePopularItems = () => {
        const itemCounts: { [key: string]: number } = {};
        orderHistory.forEach(order => {
            if (!Array.isArray(order.items)) return;
            order.items.forEach(item => {
                const id = item.itemId || item.id;
                if (!id) return;
                itemCounts[id] = (itemCounts[id] || 0) + (item.quantity || 0);
            });
        });
        return Object.entries(itemCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([itemId, count]) => ({
                item: menuItems.find(item => item.id === itemId)?.name || 'Unknown Item',
                count
            }));
    };

    // Get top selling items in the last 3 months
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

        // Filter orders from last 3 months
        const recentOrders = orderHistory.filter(order => {
            const createdAt = toDate(order.createdAt);
            return createdAt && createdAt >= threeMonthsAgo && createdAt <= now;
        });

        // Simple aggregation by item name and category
        const salesByCategory: { [category: string]: { [itemName: string]: number } } = {};
        
        recentOrders.forEach(order => {
            if (!Array.isArray(order.items)) return;
            order.items.forEach(item => {
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
    };

    // Show loading state while fetching restaurant details
    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading analytics...</p>
                </div>
            </div>
        );
    }

    // Show error if no restaurant ID is available
    if (!restaurantId) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-red-500 mb-4">
                        <BarChart3 className="w-16 h-16 mx-auto" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Restaurant Not Found</h2>
                    <p className="text-gray-600">Unable to load analytics. Please ensure your restaurant is properly configured.</p>
                </div>
            </div>
        );
    }

    // --- NEW: Fetch and aggregate menu and order data for last 3 months ---
    async function getMenuSalesDataLast3Months() {
        if (!restaurantId) return [];
        // 1. Fetch all menu items
        const menuItemsRef = collection(db, 'restaurants', restaurantId, 'menu');
        const menuSnapshot = await getDocs(menuItemsRef);
        const menuItems = menuSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as NestedMenuItem[];

        // 2. Fetch all orders from last 3 months
        const now = new Date();
        const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
        const ordersRef = collection(db, 'restaurants', restaurantId, 'orders');
        const ordersQuery = query(
            ordersRef,
            where('status', 'in', ['completed', 'confirmed']),
            orderBy('createdAt', 'desc')
        );
        const ordersSnapshot = await getDocs(ordersQuery);
        // Helper to get JS Date from possible Firestore Timestamp, Date, or string
        function toDate(val: any): Date | null {
            if (!val) return null;
            if (val instanceof Date) return val;
            if (typeof val === 'object' && typeof val.seconds === 'number') {
                // Firestore Timestamp
                return new Date(val.seconds * 1000);
            }
            if (typeof val === 'string') {
                const d = new Date(val);
                return isNaN(d.getTime()) ? null : d;
            }
            return null;
        }
        // Only orders in last 3 months
        const recentOrders = ordersSnapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }) as import('@/types/order').Order)
            .filter(order => {
                const createdAt = toDate(order.createdAt);
                return createdAt && createdAt >= threeMonthsAgo && createdAt <= now;
            }); // order is of type Order

        // 3. Aggregate sales for each menu item
        const salesCount: { [itemId: string]: number } = {};
        recentOrders.forEach(order => {
            if (!Array.isArray(order.items)) return;
            order.items.forEach(item => {
                const id = item.itemId || item.id;
                if (!id) return;
                salesCount[id] = (salesCount[id] || 0) + (item.quantity || 0);
            });
        });

        // 4. Merge sales data with menu
        const merged = menuItems.map(item => ({
            id: item.id,
            name: item.name,
            category: item.category || 'Uncategorized',
            sales: salesCount[item.id] || 0
        }));
        return merged;
    }

    // Test the new simplified function
    getTopSellingItemsLast3Months().then(data => {
        console.log('NEW SIMPLIFIED DATA FORMAT:', data);
    });

    // Helper to flatten Order[] to OrderItem[] for MenuInsight
    function flattenOrdersToOrderItems(orders: Order[]): import('@/utils/menuTypes').OrderItem[] {
        const result: import('@/utils/menuTypes').OrderItem[] = [];
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
                    status: order.status as any // fallback, may need mapping
                });
            });
        });
        return result;
    }

    // Calculate sales by day of week for last 3 months
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
    // Prepare sales by day as array for summary
    const salesByDayArray = dayNames.map(day => ({ day, orders: salesByDay[day] }));
    const maxOrders = Math.max(...salesByDayArray.map(d => d.orders));
    const minOrders = Math.min(...salesByDayArray.map(d => d.orders));
    const busiestDays = salesByDayArray.filter(d => d.orders === maxOrders).map(d => d.day);
    const slowestDays = salesByDayArray.filter(d => d.orders === minOrders).map(d => d.day);
    // Format as table for AI
    const salesByDayTable = `| Day       | Orders |\n|-----------|--------|\n${salesByDayArray.map(d => `| ${d.day.padEnd(9)} | ${d.orders.toString().padEnd(6)} |`).join('\n')}`;
    const salesSummary = `Sales by Day of Week (last 3 months):\n${salesByDayTable}\n\nBusiest day(s): ${busiestDays.join(', ')} (${maxOrders} orders)\nSlowest day(s): ${slowestDays.join(', ')} (${minOrders} orders)`;

    const renderTabContent = () => {
        switch (activeTab) {
            case 'overview':
                return (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center mb-6">
                            <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="flex items-center gap-2">
                                        <FontAwesomeIcon icon={faCalendarAlt} />
                                        {date ? format(date, 'PPP') : <span>Pick a date</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar
                                        mode="single"
                                        selected={date}
                                        onSelect={setDate}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <Card className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Total Orders this week</p>
                                        <p className="text-2xl font-bold text-gray-900">{calculateTotalOrders()}</p>
                                        <p className="text-xs text-green-600 flex items-center mt-1">
                                            <TrendingUp className="w-3 h-3 mr-1" />
                                            +12.5% from last month
                                        </p>
                                    </div>
                                    <div className="p-3 bg-blue-100 rounded-lg">
                                        <BarChart3 className="w-6 h-6 text-blue-600" />
                                    </div>
                                </div>
                            </Card>

                            <Card className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Revenue this week</p>
                                        <p className="text-2xl font-bold text-gray-900">${calculateRevenue().toFixed(2)}</p>
                                        <p className="text-xs text-green-600 flex items-center mt-1">
                                            <TrendingUp className="w-3 h-3 mr-1" />
                                            +8.2% from last month
                                        </p>
                                    </div>
                                    <div className="p-3 bg-green-100 rounded-lg">
                                        <DollarSign className="w-6 h-6 text-green-600" />
                                    </div>
                                </div>
                            </Card>

                            <Card className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Avg Rating</p>
                                        <p className="text-2xl font-bold text-gray-900">4.8</p>
                                        <p className="text-xs text-green-600 flex items-center mt-1">
                                            <TrendingUp className="w-3 h-3 mr-1" />
                                            +0.2 from last month
                                        </p>
                                    </div>
                                    <div className="p-3 bg-yellow-100 rounded-lg">
                                        <Star className="w-6 h-6 text-yellow-600" />
                                    </div>
                                </div>
                            </Card>
                        </div>
                        <PerformanceChart onDataUpdate={handleDataUpdate} />

                        <Card className="p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Feedback Analysis (Last 2 Days)</h3>
                            <div className="space-y-4">
                                <div className="flex items-center gap-4 p-4 bg-green-50 rounded-lg">
                                    <div className="p-2 bg-green-100 rounded-lg">
                                        <ThumbsUp className="w-5 h-5 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">Positive Feedback</p>
                                        <p className="text-sm text-gray-600">Fast delivery and great taste</p>
                                    </div>
                                    <div className="ml-auto text-right">
                                        <p className="font-semibold text-green-600">87%</p>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <p className="text-sm font-medium text-gray-900">Recent Reviews:</p>
                                    <div className="p-3 bg-gray-50 rounded-lg">
                                        <p className="text-sm text-gray-700">&ldquo;Amazing pizza! Will definitely order again.&rdquo;</p>
                                        <p className="text-xs text-gray-500 mt-1">★★★★★ - 2 hours ago</p>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>
                );

            case 'menu-insight':
                if (isMenuLoading) {
                    return (
                        <div className="flex items-center justify-center h-64">
                            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
                        </div>
                    );
                }
                return (
                    <div className="space-y-6">
                        <MenuInsight menuItems={menuItems} orderHistory={flattenOrdersToOrderItems(orderHistory)} />
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <AnalyticsNavigation activeTab={activeTab} onTabChange={setActiveTab} extraTabs={[]} />
            <div className="p-6">
                {renderTabContent()}
            </div>
        </div>
    );
}