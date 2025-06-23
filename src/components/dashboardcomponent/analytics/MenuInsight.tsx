"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAppSelector } from '@/store/hooks';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { subDays, subMonths, startOfDay, endOfDay } from 'date-fns';
import type { NestedMenuItem as MenuItem, OrderItem } from '@/utils/menuTypes';

interface MenuInsightProps {
  menuItems: MenuItem[];
  orderHistory: OrderItem[];
}

interface SalesData {
  itemId: string;
  name: string;
  quantity: number;
  revenue: number;
}

const RANGE_OPTIONS = [
  { label: 'Last 7 Days', value: '7days' },
  { label: 'Last Month', value: 'month' }
];

export function MenuInsight({ menuItems, orderHistory }: MenuInsightProps) {
  const { restaurantDetails } = useAppSelector((state) => state.auth);
  const [loading, setLoading] = useState(true);
  const [salesByItem, setSalesByItem] = useState<Record<string, Record<string, number>>>({});
  const [range, setRange] = useState<'7days' | 'month'>('7days');

  const calculateSalesData = useCallback((orders: OrderItem[]): SalesData[] => {
    const salesMap = new Map<string, SalesData>();

    orders.forEach(order => {
      const item = menuItems.find(menuItem => menuItem.id === order.itemId);
      if (!item) return;

      if (!salesMap.has(order.itemId)) {
        salesMap.set(order.itemId, {
          itemId: order.itemId,
          name: item.name,
          quantity: 0,
          revenue: 0
        });
      }

      const data = salesMap.get(order.itemId)!;
      data.quantity += order.quantity;
      data.revenue += order.price * order.quantity;
    });

    return Array.from(salesMap.values());
  }, [menuItems]);

  useEffect(() => {
    const fetchSalesData = async () => {
      if (!restaurantDetails?.restaurantId) return;

      setLoading(true);
      try {
        const startDate = range === '7days' 
          ? startOfDay(subDays(new Date(), 7))
          : startOfDay(subMonths(new Date(), 1));
        const endDate = endOfDay(new Date());

        // Filter orders within date range
        const filteredOrders = orderHistory.filter(order => {
          const orderDate = new Date(order.createdAt);
          return orderDate >= startDate && orderDate <= endDate;
        });

        // Calculate sales data
        const salesData = calculateSalesData(filteredOrders);
        
        // Update state
        setSalesByItem(prevSales => ({
          ...prevSales,
          [range]: salesData.reduce((acc, item) => {
            acc[item.itemId] = item.quantity;
            return acc;
          }, {} as Record<string, number>)
        }));
      } catch (err) {
        console.error('Error fetching sales data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSalesData();
  }, [restaurantDetails?.restaurantId, range, orderHistory, calculateSalesData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Menu Performance</h2>
        <div className="flex gap-2">
          {RANGE_OPTIONS.map(option => (
            <Button
              key={option.value}
              variant={range === option.value ? 'default' : 'outline'}
              onClick={() => setRange(option.value as '7days' | 'month')}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {menuItems.map(item => {
          const sales = salesByItem[range]?.[item.id] || 0;
          return (
            <Card key={item.id} className="p-4">
              <h3 className="font-semibold">{item.name}</h3>
              <p className="text-2xl font-bold mt-2">{sales}</p>
              <p className="text-sm text-gray-500">Orders</p>
            </Card>
          );
        })}
      </div>
    </div>
  );
} 