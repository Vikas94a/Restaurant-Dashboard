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
import type { OrderItem } from '@/types/order';
import AnalyticsNavigation from '@/components/dashboardcomponent/AnalyticsNavigation';
import { BarChart3, TrendingUp, DollarSign, Star, ThumbsUp } from 'lucide-react';
import { PerformanceChart } from '@/components/dashboardcomponent/analytics/performance';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { MenuInsight } from '@/components/dashboardcomponent/analytics/MenuInsight';

export default function AnalyticsPage() {
    const [activeTab, setActiveTab] = useState('overview');
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [totalOrders, setTotalOrders] = useState(0);
    const [totalRevenue, setTotalRevenue] = useState(0);
    const [categoryData, setCategoryData] = useState<{ name: string; value: number }[]>([]);
    const [menuItems, setMenuItems] = useState<NestedMenuItem[]>([]);
    const [orderHistory, setOrderHistory] = useState<OrderItem[]>([]);
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
                const menuItemsRef = collection(db, 'restaurants', restaurantId, 'menuItems');
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
                })) as OrderItem[];
                setOrderHistory(orders);
            } catch (error) {
                console.error('Error fetching menu data:', error);
            } finally {
                setIsMenuLoading(false);
            }
        };

        fetchMenuData();
    }, [restaurantId]);

    useEffect(() => {
        const fetchData = async () => {
            if (!user?.restaurantName) {
                setError('Restaurant not found');
                setLoading(false);
                return;
            }

            try {
                // Fetch orders
                const ordersRef = collection(db, 'orders');
                const ordersQuery = query(
                    ordersRef,
                    where('restaurantId', '==', user.restaurantName),
                    orderBy('createdAt', 'desc')
                );
                const ordersSnapshot = await getDocs(ordersQuery);
                const ordersData = ordersSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as OrderItem[];
                setOrderHistory(ordersData);

                // Fetch menu items
                const menuRef = collection(db, 'restaurants', user.restaurantName, 'menu');
                const menuSnapshot = await getDocs(menuRef);
                const menuData = menuSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as NestedMenuItem[];
                setMenuItems(menuData);

                setLoading(false);
            } catch (err) {
                console.error('Error fetching data:', err);
                setError('Error fetching data');
                setLoading(false);
            }
        };

        fetchData();
    }, [user?.restaurantName]);

    const calculateRevenue = () => {
        return orderHistory.reduce((total, order) => total + (order.price * order.quantity), 0);
    };

    const calculateTotalOrders = () => {
        return orderHistory.length;
    };

    const calculateAverageOrderValue = () => {
        if (orderHistory.length === 0) return 0;
        return calculateRevenue() / orderHistory.length;
    };

    const calculatePopularItems = () => {
        const itemCounts: { [key: string]: number } = {};
        orderHistory.forEach(order => {
            itemCounts[order.itemId] = (itemCounts[order.itemId] || 0) + order.quantity;
        });

        return Object.entries(itemCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([itemId, count]) => ({
                item: menuItems.find(item => item.id === itemId)?.name || 'Unknown Item',
                count
            }));
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
                                        <p className="text-sm font-medium text-gray-600">Category Sales</p>
                                        <div className="h-60 w-40">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie
                                                        data={categoryData}
                                                        cx="50%"
                                                        cy="50%"
                                                        labelLine={false}
                                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                                        outerRadius={80}
                                                        innerRadius={20}
                                                        fill="#8884d8"
                                                        dataKey="value"
                                                    >
                                                        {categoryData.map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={`#${Math.floor(Math.random() * 16777215).toString(16)}`} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>
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
                        <MenuInsight menuItems={menuItems} orderHistory={orderHistory} />
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <AnalyticsNavigation activeTab={activeTab} onTabChange={setActiveTab} />
            <div className="p-6">
                {renderTabContent()}
            </div>
        </div>
    );
}