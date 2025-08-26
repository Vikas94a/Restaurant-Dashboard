"use client";

import { useState } from 'react';
import { Reservation, ReservationStatus } from '@/types/reservation';
import { useReservations } from '@/hooks/useReservations';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCalendarAlt, 
  faClock, 
  faUsers, 
  faUser, 
  faEnvelope, 
  faPhone, 
  faCheck,
  faTimes,
  faEye,
  faEdit,
  faSpinner
} from '@fortawesome/free-solid-svg-icons';
import { toast } from 'sonner';

interface ReservationListProps {
  status?: ReservationStatus;
}

export default function ReservationList({ status }: ReservationListProps) {
  const { reservations, isLoading, updateReservationStatus } = useReservations(status);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleStatusUpdate = async (reservationId: string, newStatus: ReservationStatus, notes?: string) => {
    try {
      setIsUpdating(true);
      const success = await updateReservationStatus(reservationId, newStatus, notes);
      if (success) {
        toast.success(`Reservation ${newStatus} successfully`);
        setShowDetails(false);
        setSelectedReservation(null);
      }
    } catch (error) {
      console.error('Error updating reservation status:', error);
      toast.error('Failed to update reservation status');
    } finally {
      setIsUpdating(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    return timeString;
  };

  const getStatusColor = (status: ReservationStatus) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'no-show':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: ReservationStatus) => {
    switch (status) {
      case 'pending':
        return faClock;
      case 'confirmed':
        return faCheck;
      case 'cancelled':
        return faTimes;
      case 'completed':
        return faCheck;
      case 'no-show':
        return faTimes;
      default:
        return faClock;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading reservations...</p>
        </div>
      </div>
    );
  }

  if (reservations.length === 0) {
    return (
      <div className="text-center py-12">
        <FontAwesomeIcon icon={faCalendarAlt} className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No reservations found</h3>
        <p className="text-gray-500">
          {status ? `No ${status} reservations` : 'No reservations have been made yet'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Reservation List */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date & Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Party Size
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reservations.map((reservation) => (
                <tr key={reservation.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {reservation.customerDetails.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {reservation.customerDetails.email}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm text-gray-900">
                        {formatDate(reservation.reservationDetails.date)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatTime(reservation.reservationDetails.time)}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <FontAwesomeIcon icon={faUsers} className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">
                        {reservation.reservationDetails.partySize} people
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(reservation.status)}`}>
                      <FontAwesomeIcon icon={getStatusIcon(reservation.status)} className="w-3 h-3 mr-1" />
                      {reservation.status.charAt(0).toUpperCase() + reservation.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setSelectedReservation(reservation);
                          setShowDetails(true);
                        }}
                        className="text-orange-600 hover:text-orange-900"
                      >
                        <FontAwesomeIcon icon={faEye} className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reservation Details Modal */}
      {showDetails && selectedReservation && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Reservation Details</h3>
                <button
                  onClick={() => {
                    setShowDetails(false);
                    setSelectedReservation(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FontAwesomeIcon icon={faTimes} className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Customer Information */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Customer Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center">
                      <FontAwesomeIcon icon={faUser} className="w-4 h-4 text-gray-400 mr-2" />
                      <span>{selectedReservation.customerDetails.name}</span>
                    </div>
                    <div className="flex items-center">
                      <FontAwesomeIcon icon={faEnvelope} className="w-4 h-4 text-gray-400 mr-2" />
                      <span>{selectedReservation.customerDetails.email}</span>
                    </div>
                    <div className="flex items-center">
                      <FontAwesomeIcon icon={faPhone} className="w-4 h-4 text-gray-400 mr-2" />
                      <span>{selectedReservation.customerDetails.phone}</span>
                    </div>
                  </div>
                </div>

                {/* Reservation Details */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Reservation Details</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center">
                      <FontAwesomeIcon icon={faCalendarAlt} className="w-4 h-4 text-gray-400 mr-2" />
                      <span>{formatDate(selectedReservation.reservationDetails.date)}</span>
                    </div>
                    <div className="flex items-center">
                      <FontAwesomeIcon icon={faClock} className="w-4 h-4 text-gray-400 mr-2" />
                      <span>{formatTime(selectedReservation.reservationDetails.time)}</span>
                    </div>
                    <div className="flex items-center">
                      <FontAwesomeIcon icon={faUsers} className="w-4 h-4 text-gray-400 mr-2" />
                      <span>{selectedReservation.reservationDetails.partySize} people</span>
                    </div>
                  </div>
                </div>

                {/* Special Requests */}
                {selectedReservation.customerDetails.specialRequests && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Special Requests</h4>
                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                      {selectedReservation.customerDetails.specialRequests}
                    </p>
                  </div>
                )}

                {/* Status Actions */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Update Status</h4>
                  <div className="flex space-x-2">
                    {selectedReservation.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleStatusUpdate(selectedReservation.id, 'confirmed')}
                          disabled={isUpdating}
                          className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600 disabled:opacity-50"
                        >
                          {isUpdating ? (
                            <FontAwesomeIcon icon={faSpinner} className="w-3 h-3 animate-spin" />
                          ) : (
                            'Confirm'
                          )}
                        </button>
                        <button
                          onClick={() => handleStatusUpdate(selectedReservation.id, 'cancelled')}
                          disabled={isUpdating}
                          className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 disabled:opacity-50"
                        >
                          {isUpdating ? (
                            <FontAwesomeIcon icon={faSpinner} className="w-3 h-3 animate-spin" />
                          ) : (
                            'Cancel'
                          )}
                        </button>
                      </>
                    )}
                    {selectedReservation.status === 'confirmed' && (
                      <button
                        onClick={() => handleStatusUpdate(selectedReservation.id, 'completed')}
                        disabled={isUpdating}
                        className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 disabled:opacity-50"
                      >
                        {isUpdating ? (
                          <FontAwesomeIcon icon={faSpinner} className="w-3 h-3 animate-spin" />
                        ) : (
                          'Mark Complete'
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
