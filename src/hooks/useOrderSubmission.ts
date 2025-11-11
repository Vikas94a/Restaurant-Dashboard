import { useState } from 'react';
import { toast } from 'sonner';
import { useAppDispatch } from '@/store/hooks';
import { clearCart } from '@/store/features/cartSlice';
import { db } from '@/lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { CustomerFormData, Order } from '@/types/checkout';
import { useCart } from '@/hooks/useCart';
import { sendOrderConfirmationEmail } from '@/services/email/emailService';

interface UseOrderSubmissionProps {
  restaurantId: string;
  pickupOption: 'asap' | 'later';
  pickupDate: string;
  pickupTime: string;
  isAsapAvailable: boolean;
  isDateOpen: (date: string) => boolean;
  getPickupTimeSlots: (date: string) => string[];
}

export function useOrderSubmission({
  restaurantId,
  pickupOption,
  pickupDate,
  pickupTime,
  isAsapAvailable,
  isDateOpen,
  getPickupTimeSlots
}: UseOrderSubmissionProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [localPlacedOrder, setLocalPlacedOrder] = useState<Order | null>(null);
  const dispatch = useAppDispatch();
  const { cart } = useCart();

  const validateOrder = (formData: CustomerFormData) => {
    if (!formData.name || !formData.phone || !formData.email) {
      toast.error('Please fill in all required fields');
      return false;
    }

    if (pickupOption === 'asap') {
      if (!isAsapAvailable) {
        toast.error('ASAP pickup is not available at this time');
        return false;
      }
    } else {
      if (!pickupDate || !pickupTime) {
        toast.error('Please select a pickup date and time');
        return false;
      }

      if (!isDateOpen(pickupDate)) {
        toast.error('Restaurant is closed on selected date');
        return false;
      }

      const availableTimes = getPickupTimeSlots(pickupDate);
      if (!availableTimes.includes(pickupTime)) {
        toast.error('Selected pickup time is not available');
        return false;
      }
    }

    return true;
  };

  const submitOrder = async (formData: CustomerFormData) => {
    // Basic guards
    if (!restaurantId || restaurantId.trim() === '') {
      toast.error('Restaurant is missing. Please return to the menu and try again.');
      return { success: false };
    }
    if (!cart || !Array.isArray(cart.items) || cart.items.length === 0) {
      toast.error('Your cart is empty. Please add items before placing an order.');
      return { success: false };
    }

    if (!validateOrder(formData)) return { success: false };

    setIsSubmitting(true);
    try {
      const generatedOrderId = `order_${Date.now()}`;
      setOrderId(generatedOrderId);
      
      const orderItems = cart.items.map(item => ({
        id: item.id,
        itemName: item.itemName,
        itemPrice: item.itemPrice,
        quantity: item.quantity,
        restaurantId: item.restaurantId,
        categoryName: item.categoryName,
        totalPrice: item.totalPrice,
        customizations: item.customizations || [],
        specialInstructions: item.specialInstructions || null
      }));

      const orderData: Order = {
        id: generatedOrderId,
        restaurantId,
        customerDetails: {
          name: formData.name?.trim() || '',
          email: formData.email?.trim() || '',
          phone: formData.phone?.trim() || '',
          pickupTime: pickupOption === 'asap' ? 'asap' : pickupTime,
          pickupDate: pickupOption === 'asap' ? new Date().toISOString() : pickupDate,
          specialInstructions: formData.specialInstructions?.trim() || ''
        },
        items: orderItems,
        total: cart.total || 0,
        status: 'pending' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        completedAt: null,
        pickupTime: pickupOption === 'asap' ? 'asap' : pickupTime,
        pickupOption,
        estimatedPickupTime: null
      };

      const orderRef = doc(db, "restaurants", restaurantId, "orders", orderData.id);
      // Write to Firestore with proper server timestamps to enable ordering queries
      const firestorePayload = {
        ...orderData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      } as any;
      await setDoc(orderRef, firestorePayload);
      
      // Send confirmation email immediately after order is placed
      try {
        await sendOrderConfirmationEmail(orderData);
      } catch (emailError) {
        // Log error but don't fail the order submission
        console.error('Failed to send confirmation email:', emailError);
        // Don't show error to user - order was still successfully placed
      }
      
      dispatch(clearCart());
      setLocalPlacedOrder(orderData);
      
      return { success: true, orderData };
    } catch (error: unknown) {
      const message = (error as any)?.message || 'Failed to place order. Please try again.';
      console.error('Order submission failed:', error);
      toast.error(message);
      return { success: false };
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetOrder = () => {
    setOrderId('');
    setLocalPlacedOrder(null);
  };

  return {
    isSubmitting,
    orderId,
    localPlacedOrder,
    submitOrder,
    resetOrder
  };
} 