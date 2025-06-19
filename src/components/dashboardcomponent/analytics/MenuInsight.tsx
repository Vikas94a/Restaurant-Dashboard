import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useAppSelector } from '@/store/hooks';
import { Button } from '@/components/ui/button';
import { subDays, subMonths, startOfDay, endOfDay } from 'date-fns';

interface MenuItem {
  id?: string;
  name: string;
  category?: string;
}

interface MenuCategory {
  id: string;
  name: string;
  items: MenuItem[];
}

const RANGE_OPTIONS = [
  { label: 'Last 7 Days', value: '7days' },
  { label: 'Last Month', value: 'month' },
];

const MenuInsight: React.FC = () => {
  const { restaurantDetails } = useAppSelector((state) => state.auth);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [salesByItem, setSalesByItem] = useState<Record<string, Record<string, number>>>({});
  const [range, setRange] = useState<'7days' | 'month'>('7days');

  useEffect(() => {
    const fetchMenuData = async () => {
      if (!restaurantDetails?.restaurantId) return;
      setLoading(true);
      const menuRef = collection(db, 'restaurants', restaurantDetails.restaurantId, 'menu');
      const querySnapshot = await getDocs(menuRef);
      const cats: MenuCategory[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        cats.push({
          id: doc.id,
          name: data.categoryName || 'Uncategorized',
          items: (data.items || []).map((item: any, idx: number) => ({
            id: item.id || `item-${doc.id}-${idx}`,
            name: item.name || '',
            category: data.categoryName || 'Uncategorized',
          })),
        });
      });
      setCategories(cats);
      setLoading(false);
    };
    fetchMenuData();
  }, [restaurantDetails?.restaurantId]);

  useEffect(() => {
    const fetchSalesData = async () => {
      if (!restaurantDetails?.restaurantId) return;
      let from: Date;
      let to: Date = new Date();
      if (range === '7days') {
        from = subDays(to, 6);
      } else {
        from = subMonths(to, 1);
      }
      const ordersRef = collection(db, 'restaurants', restaurantDetails.restaurantId, 'orders');
      const q = query(
        ordersRef,
        where('createdAt', '>=', startOfDay(from).toISOString()),
        where('createdAt', '<=', endOfDay(to).toISOString())
      );
      const querySnapshot = await getDocs(q);
      const orders = querySnapshot.docs.map(doc => doc.data());
      // Aggregate sales by categoryName and itemName
      const sales: Record<string, Record<string, number>> = {};
      orders.forEach(order => {
        if (order.status !== 'completed' || !Array.isArray(order.items)) return;
        order.items.forEach((item: any) => {
          const cat = item.categoryName || 'Uncategorized';
          const itemName = item.itemName || '';
          if (!sales[cat]) sales[cat] = {};
          sales[cat][itemName] = (sales[cat][itemName] || 0) + (item.quantity || 1);
        });
      });
      setSalesByItem(sales);
    };
    fetchSalesData();
  }, [restaurantDetails?.restaurantId, range]);

  if (loading) {
    return <div className="flex justify-center items-center h-40">Loading menu insight...</div>;
  }

  if (categories.length === 0) {
    return <div className="flex justify-center items-center h-40">No menu items available</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex gap-2 mb-4">
        {RANGE_OPTIONS.map(opt => (
          <Button
            key={opt.value}
            variant={range === opt.value ? 'default' : 'outline'}
            onClick={() => setRange(opt.value as '7days' | 'month')}
          >
            {opt.label}
          </Button>
        ))}
      </div>
      {categories.map((cat) => (
        <Card key={cat.id} className="p-6">
          <div className="mb-2">
            <h3 className="text-xl font-bold text-gray-900 mb-2">{cat.name}</h3>
            <ul className="divide-y divide-gray-200">
              {cat.items.map((item) => (
                <li key={item.id} className="py-2 flex justify-between items-center">
                  <span className="font-medium text-gray-800">{item.name}</span>
                  <span className="text-blue-700 font-semibold">
                    {salesByItem[cat.name]?.[item.name] ?? 0} sold
                  </span>
                </li>
              ))}
              {cat.items.length === 0 && (
                <li className="py-2 text-gray-400">No items in this category.</li>
              )}
            </ul>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default MenuInsight; 