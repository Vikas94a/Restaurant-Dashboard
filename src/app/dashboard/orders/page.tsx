"use client";

import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { subscribeToRestaurantOrders, Order, OrderItem, updateOrderStatus, clearOrders } from '@/store/features/orderSlice';
import { LoadingSpinner } from '@/components/dashboardcomponent/LoadingSpinner';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClock, faCheck, faXmark } from '@fortawesome/free-solid-svg-icons';
import { toast } from 'sonner';
import { RootState } from '@/store/store';
import { useRouter } from 'next/navigation';

export default function OrdersPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { user, restaurantDetails } = useAppSelector((state: RootState) => state.auth);
  const ordersState = useAppSelector((state: RootState) => state.orders);
  const { orders = [], loading = false, error = null } = ordersState || {};

  // State to manage estimated pickup time input for each pending order
  const [estimatedTimes, setEstimatedTimes] = useState<Record<string, string>>({});

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    if (!user) {
      toast.error('Please sign in to view orders');
      router.replace('/login');
      return;
    }

    if (restaurantDetails?.restaurantId) {
      console.log('Attempting to subscribe to orders...');
      // Dispatch the new subscribe thunk and get the unsubscribe function
      unsubscribe = dispatch(subscribeToRestaurantOrders(restaurantDetails.restaurantId));
    } else {
       console.log('Restaurant details not available for order subscription.');
       // Clear orders and show a message if restaurant details are missing
       dispatch(clearOrders());
       dispatch({ type: 'orders/setOrdersError', payload: 'Restaurant details not found.' });
    }

    // Cleanup function: unsubscribe from the listener when the component unmounts
    return () => {
      if (unsubscribe) {
        console.log('Unsubscribing from order listener.');
        unsubscribe();
      }
       // Optionally clear orders when leaving the page
       dispatch(clearOrders());
    };
  }, [dispatch, restaurantDetails?.restaurantId, user, router]); // Dependencies

  // Update estimatedTimes state when orders change, initializing with empty strings for new pending orders
  useEffect(() => {
    // Find new pending orders that don't have an entry in estimatedTimes yet
    const newPendingOrders = orders.filter(
      order => order.status === 'pending' && !(order.id in estimatedTimes)
    );
    
    // Only update state if there are new pending orders to initialize
    if (newPendingOrders.length > 0) {
      const newEstimatedTimes = { ...estimatedTimes };
      newPendingOrders.forEach(order => {
        newEstimatedTimes[order.id] = '';
      });
      setEstimatedTimes(newEstimatedTimes);
    }
  }, [orders]); // Only depend on orders, not estimatedTimes

  const handleOrderStatus = async (orderId: string, newStatus: 'accepted' | 'rejected' | 'completed') => {
    try {
      if (!restaurantDetails?.restaurantId) {
        toast.error('Restaurant ID not found');
        return;
      }
      
      // Get the estimated time if accepting the order
      const estimatedPickupTime = newStatus === 'accepted' ? estimatedTimes[orderId] : undefined; // Pass undefined if not accepted

      // Validate estimated time if accepting
      if (newStatus === 'accepted' && (!estimatedPickupTime || estimatedPickupTime.trim() === '')) {
          toast.error('Please provide an estimated pickup time.');
          return;
      }

      console.log(`Attempting to update order ${orderId} status to ${newStatus}`);
      await dispatch(updateOrderStatus({
        orderId,
        restaurantId: restaurantDetails.restaurantId,
        newStatus,
        estimatedPickupTime: estimatedPickupTime?.trim() // Pass trimmed value
      })).unwrap();
      
      // The real-time listener will update the state and UI, no need for success toast here typically
      // toast.success(`Order ${newStatus} successfully`);
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Failed to update order status');
    }
  };

  const handleEstimatedTimeChange = (orderId: string, time: string) => {
    setEstimatedTimes(prev => ({ ...prev, [orderId]: time }));
  };

  // Show loading state
  if (loading && orders.length === 0) { // Show loading only if no orders are currently displayed
    return <LoadingSpinner />;
  }

  // Show error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6">
        <div className="bg-white rounded-lg shadow-md p-6 max-w-md w-full text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-2">Error Loading Orders</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          {/* Removed Try Again button to rely on automatic re-subscription if deps change */}
        </div>
      </div>
    );
  }

  // Show message if no restaurant is found (this case is now handled in useEffect)
  if (!restaurantDetails) {
     return (
       <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6">
         <div className="bg-white rounded-lg shadow-md p-6 max-w-md w-full text-center">
           <h2 className="text-xl font-semibold text-gray-800 mb-2">No Restaurant Found</h2>
           <p className="text-gray-600 mb-4">Please set up your restaurant details first.</p>
           <button
             onClick={() => router.push('/dashboard/setup')}
             className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition"
           >
             Go to Setup
           </button>
         </div>
       </div>
     );
   }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {loading && orders.length > 0 && ( // Show spinner while loading but data is present
             <div className="p-4 text-center text-gray-500">Updating orders...</div>
          )}
          {orders.length === 0 && !loading && !error ? ( // Show no orders message only if not loading and no error
            <div className="p-6 text-center text-gray-500">No orders found.</div>
          ) : (
            <div className="divide-y divide-gray-200">
              {orders.map((order: Order) => (
                <div key={order.id} className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        Order #{order.id.slice(-6)}
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Customer: {order.customerName}
                      </p>
                      <p className="text-sm text-gray-500">
                        Phone: {order.customerPhone}
                      </p>
                      <p className="text-sm text-gray-500">
                        Email: {order.customerEmail}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        order.status === 'accepted' ? 'bg-green-100 text-green-800' :
                        order.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-900">Items:</h4>
                    <ul className="mt-2 divide-y divide-gray-200">
                      {order.items.map((item: OrderItem, index: number) => (
                        <li key={index} className="py-2 flex justify-between">
                          <span className="text-sm text-gray-600">
                            {item.quantity}x {item.itemName}
                          </span>
                          <span className="text-sm text-gray-900">
                            ${(item.price * item.quantity).toFixed(2)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-4 flex justify-between items-center">
                    <div className="flex items-center text-sm text-gray-500">
                      <FontAwesomeIcon icon={faClock} className="mr-2" />
                      Pickup: {order.pickupTime}
                    </div>
                    <div className="text-lg font-medium text-gray-900">
                      Total: ${order.total.toFixed(2)}
                    </div>
                  </div>

                  {order.status === 'pending' && (
                    <div className="mt-4 flex flex-col md:flex-row justify-end space-y-2 md:space-y-0 md:space-x-2">
                      {/* Estimated pickup time input */}
                      <input
                        type="text"
                        placeholder="e.g. 20-30 mins"
                        value={estimatedTimes[order.id] || ''}
                        onChange={(e) => handleEstimatedTimeChange(order.id, e.target.value)}
                        className="w-full md:w-auto px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                      />
                      <button
                        onClick={() => handleOrderStatus(order.id, 'accepted')}
                        className="inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                      >
                        <FontAwesomeIcon icon={faCheck} className="mr-2" />
                        Accept
                      </button>
                      <button
                        onClick={() => handleOrderStatus(order.id, 'rejected')}
                        className="inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        <FontAwesomeIcon icon={faXmark} className="mr-2" />
                        Reject
                      </button>
                    </div>
                  )}

                  {/* Display estimated pickup time if accepted and available */}
                  {order.status === 'accepted' && order.estimatedPickupTime && (
                    <div className="mt-4 text-right text-sm text-gray-600">
                      Estimated Pickup: <span className="font-medium text-green-700">{order.estimatedPickupTime}</span>
                    </div>
                  )}

                  {order.status === 'accepted' && !order.estimatedPickupTime && (
                    <div className="mt-4 text-right text-sm text-gray-600 italic">
                       No estimated pickup time provided.
                    </div>
                  )}

                  {order.status === 'accepted' && (
                    <div className="mt-4 flex justify-end">
                      <button
                        onClick={() => handleOrderStatus(order.id, 'completed')}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <FontAwesomeIcon icon={faCheck} className="mr-2" />
                        Mark as Completed
                      </button>
                    </div>
                  )}

                   {/* Display rejected status message if needed */}
                   {order.status === 'rejected' && (
                     <div className="mt-4 text-right text-sm text-red-600 font-medium">
                       Order Rejected.
                     </div>
                   )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
} 