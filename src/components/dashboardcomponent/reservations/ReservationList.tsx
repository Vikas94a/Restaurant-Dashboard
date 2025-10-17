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
  faSpinner,
  faPaperPlane,
  faBell
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
        if (newStatus === 'confirmed') {
          toast.success('Reservation confirmed! 🎉 Confirmation email sent to customer.', {
            duration: 5000,
            description: 'The customer has been notified with all reservation details.',
          });
        } else {
          toast.success(`Reservation ${newStatus} successfully`);
        }
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
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(reservation.status)}`}>
                        <FontAwesomeIcon icon={getStatusIcon(reservation.status)} className="w-3 h-3 mr-1" />
                        {reservation.status.charAt(0).toUpperCase() + reservation.status.slice(1)}
                      </span>
                      {reservation.status === 'confirmed' && reservation.confirmedAt && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800" title="Confirmation email sent">
                          <FontAwesomeIcon icon={faPaperPlane} className="w-3 h-3 mr-1" />
                          Email Sent
                        </span>
                      )}
                    </div>
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
        <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6 rounded-t-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold flex items-center">
                    <FontAwesomeIcon icon={faCalendarAlt} className="w-6 h-6 mr-3" />
                    Reservation Details
                  </h3>
                  <p className="text-orange-100 text-sm mt-1">Manage customer reservation</p>
                </div>
                <button
                  onClick={() => {
                    setShowDetails(false);
                    setSelectedReservation(null);
                  }}
                  className="text-white hover:text-orange-200 transition-colors p-2 rounded-full hover:bg-white hover:bg-opacity-20"
                >
                  <FontAwesomeIcon icon={faTimes} className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            {/* Content */}
            <div className="p-6 space-y-6">

              {/* Customer Information */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-100">
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center text-lg">
                  <FontAwesomeIcon icon={faUser} className="w-5 h-5 text-blue-600 mr-2" />
                  Customer Information
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center p-3 bg-white rounded-lg shadow-sm">
                    <FontAwesomeIcon icon={faUser} className="w-4 h-4 text-blue-500 mr-3" />
                    <div>
                      <p className="font-medium text-gray-900">{selectedReservation.customerDetails.name}</p>
                      <p className="text-sm text-gray-500">Customer Name</p>
                    </div>
                  </div>
                  <div className="flex items-center p-3 bg-white rounded-lg shadow-sm">
                    <FontAwesomeIcon icon={faEnvelope} className="w-4 h-4 text-green-500 mr-3" />
                    <div>
                      <p className="font-medium text-gray-900">{selectedReservation.customerDetails.email}</p>
                      <p className="text-sm text-gray-500">Email Address</p>
                    </div>
                  </div>
                  <div className="flex items-center p-3 bg-white rounded-lg shadow-sm">
                    <FontAwesomeIcon icon={faPhone} className="w-4 h-4 text-purple-500 mr-3" />
                    <div>
                      <p className="font-medium text-gray-900">{selectedReservation.customerDetails.phone}</p>
                      <p className="text-sm text-gray-500">Phone Number</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Reservation Details */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-5 border border-green-100">
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center text-lg">
                  <FontAwesomeIcon icon={faCalendarAlt} className="w-5 h-5 text-green-600 mr-2" />
                  Reservation Details
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center p-3 bg-white rounded-lg shadow-sm">
                    <FontAwesomeIcon icon={faCalendarAlt} className="w-4 h-4 text-green-500 mr-3" />
                    <div>
                      <p className="font-medium text-gray-900">{formatDate(selectedReservation.reservationDetails.date)}</p>
                      <p className="text-sm text-gray-500">Reservation Date</p>
                    </div>
                  </div>
                  <div className="flex items-center p-3 bg-white rounded-lg shadow-sm">
                    <FontAwesomeIcon icon={faClock} className="w-4 h-4 text-orange-500 mr-3" />
                    <div>
                      <p className="font-medium text-gray-900">{formatTime(selectedReservation.reservationDetails.time)}</p>
                      <p className="text-sm text-gray-500">Reservation Time</p>
                    </div>
                  </div>
                  <div className="flex items-center p-3 bg-white rounded-lg shadow-sm">
                    <FontAwesomeIcon icon={faUsers} className="w-4 h-4 text-indigo-500 mr-3" />
                    <div>
                      <p className="font-medium text-gray-900">{selectedReservation.reservationDetails.partySize} {selectedReservation.reservationDetails.partySize === 1 ? 'person' : 'people'}</p>
                      <p className="text-sm text-gray-500">Party Size</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Special Requests */}
              {selectedReservation.customerDetails.specialRequests && (
                <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-xl p-5 border border-yellow-100">
                  <h4 className="font-semibold text-gray-900 mb-4 flex items-center text-lg">
                    <FontAwesomeIcon icon={faEdit} className="w-5 h-5 text-yellow-600 mr-2" />
                    Special Requests
                  </h4>
                  <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-yellow-400">
                    <p className="text-gray-700 italic">"{selectedReservation.customerDetails.specialRequests}"</p>
                  </div>
                </div>
              )}

              {/* Status Actions */}
              <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl p-5 border border-gray-100">
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center text-lg">
                  <FontAwesomeIcon icon={faEdit} className="w-5 h-5 text-gray-600 mr-2" />
                  Manage Reservation
                </h4>
                <div className="flex flex-wrap gap-3">
                    {selectedReservation.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleStatusUpdate(selectedReservation.id, 'confirmed')}
                          disabled={isUpdating}
                          className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white text-sm font-medium rounded-xl hover:from-green-600 hover:to-green-700 disabled:opacity-50 transition-all duration-200 flex items-center shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                        >
                          {isUpdating ? (
                            <FontAwesomeIcon icon={faSpinner} className="w-4 h-4 animate-spin mr-2" />
                          ) : (
                            <>
                              <FontAwesomeIcon icon={faCheck} className="w-4 h-4 mr-2" />
                              Confirm & Send Email
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => handleStatusUpdate(selectedReservation.id, 'cancelled')}
                          disabled={isUpdating}
                          className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white text-sm font-medium rounded-xl hover:from-red-600 hover:to-red-700 disabled:opacity-50 transition-all duration-200 flex items-center shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                        >
                          {isUpdating ? (
                            <FontAwesomeIcon icon={faSpinner} className="w-4 h-4 animate-spin mr-2" />
                          ) : (
                            <>
                              <FontAwesomeIcon icon={faTimes} className="w-4 h-4 mr-2" />
                              Cancel
                            </>
                          )}
                        </button>
                      </>
                    )}
                    {selectedReservation.status === 'confirmed' && (
                      <button
                        onClick={() => handleStatusUpdate(selectedReservation.id, 'completed')}
                        disabled={isUpdating}
                        className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-medium rounded-xl hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 transition-all duration-200 flex items-center shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                      >
                        {isUpdating ? (
                          <FontAwesomeIcon icon={faSpinner} className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                          <>
                            <FontAwesomeIcon icon={faCheck} className="w-4 h-4 mr-2" />
                            Mark Complete
                          </>
                        )}
                      </button>
                    )}
                </div>
                
                {/* Email Confirmation Info */}
                {selectedReservation.status === 'pending' && (
                  <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <FontAwesomeIcon icon={faBell} className="w-4 h-4 text-blue-600" />
                        </div>
                      </div>
                      <div className="ml-3">
                        <h5 className="text-sm font-semibold text-blue-900 mb-1">Email Notification Ready</h5>
                        <p className="text-sm text-blue-700">When you confirm this reservation, a beautiful confirmation email will be automatically sent to:</p>
                        <p className="text-sm font-medium text-blue-900 mt-1">{selectedReservation.customerDetails.email}</p>
                      </div>
                    </div>
                  </div>
                )}
                
                {selectedReservation.status === 'confirmed' && (
                  <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <FontAwesomeIcon icon={faPaperPlane} className="w-4 h-4 text-green-600" />
                        </div>
                      </div>
                      <div className="ml-3">
                        <h5 className="text-sm font-semibold text-green-900 mb-1">Confirmation Email Sent</h5>
                        <p className="text-sm text-green-700">A beautiful confirmation email has been automatically sent to the customer with all reservation details.</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
