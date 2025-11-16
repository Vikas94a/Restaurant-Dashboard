"use client";

import { useState, useMemo, useEffect } from 'react';
import { Reservation, ReservationStatus } from '@/types/reservation';
import { useReservations } from '../hooks/useReservations';
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
  faChevronLeft,
  faChevronRight,
  faBell,
  faXmark
} from '@fortawesome/free-solid-svg-icons';
import { toast } from 'sonner';

interface ReservationCalendarProps {
  onReservationClick?: (reservation: Reservation) => void;
}

export default function ReservationCalendar({ onReservationClick }: ReservationCalendarProps) {
  const { reservations, isLoading, updateReservationStatus } = useReservations();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Close modal on ESC key press
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showDetails) {
        setShowDetails(false);
        setSelectedReservation(null);
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showDetails]);

  // Get current month and year
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  // Get days in current month
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

  // Separate reservations: pending at top, others on calendar
  const { pendingReservations, calendarReservations } = useMemo(() => {
    const pending: Reservation[] = [];
    const calendar: Reservation[] = [];

    reservations.forEach(reservation => {
      if (reservation.status === 'pending') {
        pending.push(reservation);
      } else {
        calendar.push(reservation);
      }
    });

    // Sort pending by date (newest first)
    pending.sort((a, b) => {
      const dateA = new Date(`${a.reservationDetails.date}T${a.reservationDetails.time}`);
      const dateB = new Date(`${b.reservationDetails.date}T${b.reservationDetails.time}`);
      return dateB.getTime() - dateA.getTime();
    });

    return { pendingReservations: pending, calendarReservations: calendar };
  }, [reservations]);

  // Get reservations for a specific date
  const getReservationsForDate = (day: number) => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return calendarReservations.filter(r => r.reservationDetails.date === dateStr);
  };

  // Navigate months
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const handleStatusUpdate = async (reservationId: string, newStatus: ReservationStatus) => {
    try {
      setIsUpdating(true);
      const success = await updateReservationStatus(reservationId, newStatus);
      if (success) {
        if (newStatus === 'confirmed') {
          toast.success('Reservation confirmed! 🎉');
        } else {
          toast.success(`Reservation ${newStatus} successfully`);
        }
        setShowDetails(false);
        setSelectedReservation(null);
      }
    } catch (error) {
      toast.error('Failed to update reservation status');
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusColor = (status: ReservationStatus) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const formatTime = (timeString: string) => {
    return timeString;
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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

  return (
    <div className="space-y-6">
      {/* Pending Reservations Section - At Top */}
      {pendingReservations.length > 0 && (
        <div className="bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 rounded-2xl p-6 border-2 border-amber-300 shadow-xl">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="bg-amber-500 p-3 rounded-xl shadow-lg">
                <FontAwesomeIcon icon={faBell} className="w-6 h-6 text-white animate-pulse" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  Action Required
                </h3>
                <p className="text-sm text-gray-600 mt-0.5">
                  New reservations waiting for your response
                </p>
              </div>
            </div>
            <span className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-2 rounded-full text-base font-bold shadow-md">
              {pendingReservations.length}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingReservations.map((reservation) => (
              <div
                key={reservation.id}
                className="bg-white rounded-xl p-5 border-2 border-amber-300 shadow-md hover:shadow-xl transition-all duration-200 cursor-pointer transform hover:-translate-y-1"
                onClick={() => {
                  setSelectedReservation(reservation);
                  setShowDetails(true);
                  if (onReservationClick) onReservationClick(reservation);
                }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900 text-lg">{reservation.customerDetails.name}</h4>
                    <p className="text-sm text-gray-500 mt-1">{reservation.customerDetails.email}</p>
                  </div>
                  <span className="bg-amber-500 text-white px-3 py-1 rounded-lg text-xs font-bold shadow-sm">
                    Pending
                  </span>
                </div>
                <div className="space-y-2 mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center text-sm text-gray-700">
                    <div className="bg-orange-100 p-1.5 rounded-lg mr-2">
                      <FontAwesomeIcon icon={faCalendarAlt} className="w-3 h-3 text-orange-600" />
                    </div>
                    {new Date(reservation.reservationDetails.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </div>
                  <div className="flex items-center text-sm text-gray-700">
                    <div className="bg-orange-100 p-1.5 rounded-lg mr-2">
                      <FontAwesomeIcon icon={faClock} className="w-3 h-3 text-orange-600" />
                    </div>
                    {formatTime(reservation.reservationDetails.time)}
                  </div>
                  <div className="flex items-center text-sm text-gray-700">
                    <div className="bg-orange-100 p-1.5 rounded-lg mr-2">
                      <FontAwesomeIcon icon={faUsers} className="w-3 h-3 text-orange-600" />
                    </div>
                    {reservation.reservationDetails.partySize} {reservation.reservationDetails.partySize === 1 ? 'person' : 'people'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Calendar View */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
        {/* Calendar Header */}
        <div className="bg-gradient-to-r from-orange-500 via-orange-600 to-red-500 text-white p-6">
          <div className="flex items-center justify-between">
            <button
              onClick={goToPreviousMonth}
              className="p-3 hover:bg-white/20 rounded-xl transition-all duration-200 hover:scale-110 active:scale-95"
              aria-label="Previous month"
            >
              <FontAwesomeIcon icon={faChevronLeft} className="w-5 h-5" />
            </button>
            <div className="text-center">
              <h2 className="text-2xl font-bold">
                {monthNames[currentMonth]} {currentYear}
              </h2>
              <p className="text-sm text-orange-100 mt-1">Click on a date to view reservations</p>
            </div>
            <button
              onClick={goToNextMonth}
              className="p-3 hover:bg-white/20 rounded-xl transition-all duration-200 hover:scale-110 active:scale-95"
              aria-label="Next month"
            >
              <FontAwesomeIcon icon={faChevronRight} className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="p-4">
          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-2">
            {/* Empty cells for days before month starts */}
            {Array.from({ length: firstDayOfMonth }).map((_, index) => (
              <div key={`empty-${index}`} className="min-h-[100px]"></div>
            ))}

            {/* Days of the month */}
            {Array.from({ length: daysInMonth }).map((_, index) => {
              const day = index + 1;
              const dayReservations = getReservationsForDate(day);
              const isToday = 
                new Date().getDate() === day &&
                new Date().getMonth() === currentMonth &&
                new Date().getFullYear() === currentYear;

              // Separate confirmed and rejected reservations
              const confirmedReservations = dayReservations.filter(r => r.status === 'confirmed' || r.status === 'completed');
              const rejectedReservations = dayReservations.filter(r => r.status === 'cancelled' || r.status === 'no-show');
              const hasReservations = dayReservations.length > 0;
              const hasConfirmed = confirmedReservations.length > 0;
              const hasRejected = rejectedReservations.length > 0;

              return (
                <div
                  key={day}
                  className={`min-h-[100px] border-2 rounded-xl p-2 transition-all duration-200 ${
                    isToday
                      ? 'border-orange-500 bg-gradient-to-br from-orange-50 to-orange-100 shadow-md'
                      : hasRejected && !hasConfirmed
                      ? 'border-red-300 bg-red-50'
                      : hasConfirmed
                      ? 'border-green-300 bg-green-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  } ${hasReservations ? 'cursor-pointer hover:shadow-lg hover:scale-[1.02]' : 'hover:bg-gray-50'}`}
                  onClick={() => {
                    if (dayReservations.length > 0) {
                      setSelectedReservation(dayReservations[0]);
                      setShowDetails(true);
                      if (onReservationClick) onReservationClick(dayReservations[0]);
                    }
                  }}
                >
                  <div className={`text-sm font-bold mb-1 ${
                    isToday ? 'text-orange-600' : 'text-gray-700'
                  }`}>
                    {day}
                  </div>
                  <div className="space-y-1">
                    {confirmedReservations.slice(0, 2).map((reservation) => (
                      <div
                        key={reservation.id}
                        className="text-[10px] p-1.5 bg-green-200 rounded-lg border border-green-400 hover:bg-green-300 transition-all cursor-pointer shadow-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedReservation(reservation);
                          setShowDetails(true);
                          if (onReservationClick) onReservationClick(reservation);
                        }}
                        title={`${reservation.customerDetails.name} - ${reservation.reservationDetails.partySize} people - ${formatTime(reservation.reservationDetails.time)}${reservation.customerDetails.specialRequests ? ` - ${reservation.customerDetails.specialRequests}` : ''}`}
                      >
                        <div className="truncate font-semibold text-green-900 leading-tight">{reservation.customerDetails.name}</div>
                        <div className="truncate text-[9px] text-green-700 leading-tight">
                          {reservation.reservationDetails.partySize}p • {formatTime(reservation.reservationDetails.time)}
                        </div>
                        {reservation.customerDetails.specialRequests && (
                          <div className="truncate text-[9px] text-green-600 italic leading-tight" title={reservation.customerDetails.specialRequests}>
                            {reservation.customerDetails.specialRequests}
                          </div>
                        )}
                      </div>
                    ))}
                    {rejectedReservations.slice(0, 1).map((reservation) => (
                      <div
                        key={reservation.id}
                        className="text-[10px] p-1.5 bg-red-200 rounded-lg border border-red-400 hover:bg-red-300 transition-all cursor-pointer shadow-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedReservation(reservation);
                          setShowDetails(true);
                          if (onReservationClick) onReservationClick(reservation);
                        }}
                        title={`${reservation.customerDetails.name} - ${reservation.reservationDetails.partySize} people - ${formatTime(reservation.reservationDetails.time)}`}
                      >
                        <div className="truncate font-semibold text-red-900 line-through leading-tight">{reservation.customerDetails.name}</div>
                        <div className="truncate text-[9px] text-red-700 leading-tight">
                          {reservation.reservationDetails.partySize}p • {formatTime(reservation.reservationDetails.time)}
                        </div>
                      </div>
                    ))}
                    {dayReservations.length > 3 && (
                      <div className="text-[9px] text-gray-600 font-semibold pt-1 text-center">
                        +{dayReservations.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Reservation Details Modal - Show all reservations for selected date */}
      {showDetails && selectedReservation && (() => {
        const selectedDate = selectedReservation.reservationDetails.date;
        const allReservationsForDate = calendarReservations.filter(r => r.reservationDetails.date === selectedDate);
        const reservationsToShow = allReservationsForDate.length > 0 ? allReservationsForDate : [selectedReservation];
        
        return (
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowDetails(false);
                setSelectedReservation(null);
              }
            }}
          >
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
              <div className="sticky top-0 bg-gradient-to-r from-orange-500 via-orange-600 to-red-500 text-white p-6 rounded-t-2xl z-10 shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <div className="bg-white/20 p-2 rounded-lg">
                        <FontAwesomeIcon icon={faCalendarAlt} className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold">
                          Reservations for {new Date(selectedDate).toLocaleDateString('en-US', {
                            weekday: 'long',
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </h3>
                        {reservationsToShow.length > 1 && (
                          <p className="text-sm text-orange-100 mt-1">
                            {reservationsToShow.length} total reservations
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowDetails(false);
                      setSelectedReservation(null);
                    }}
                    className="ml-4 p-3 text-white hover:bg-white/20 rounded-xl transition-all duration-200 hover:scale-110 active:scale-95 focus:outline-none focus:ring-2 focus:ring-white/50"
                    aria-label="Close modal"
                  >
                    <FontAwesomeIcon icon={faXmark} className="w-6 h-6" />
                  </button>
                </div>
                <p className="text-sm text-orange-100 mt-3 flex items-center gap-2">
                  <FontAwesomeIcon icon={faTimes} className="w-3 h-3" />
                  Press ESC or click outside to close
                </p>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
                {reservationsToShow.map((reservation) => (
                  <div key={reservation.id} className="bg-white border-2 border-gray-200 rounded-xl p-5 hover:shadow-lg transition-all duration-200">
                    {/* Status Badge */}
                    <div className="flex items-center justify-between mb-4">
                      <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-bold shadow-sm ${getStatusColor(reservation.status)}`}>
                        {reservation.status.charAt(0).toUpperCase() + reservation.status.slice(1)}
                      </span>
                      <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-100 px-3 py-1.5 rounded-lg">
                        <FontAwesomeIcon icon={faClock} className="w-4 h-4 text-orange-500" />
                        <span className="font-semibold">{formatTime(reservation.reservationDetails.time)}</span>
                      </div>
                    </div>

                    {/* Customer Info */}
                    <div className="space-y-3">
                      <div>
                        <p className="font-bold text-gray-900 text-lg mb-2">{reservation.customerDetails.name}</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                          <div className="flex items-center text-gray-600 bg-gray-50 p-2 rounded-lg">
                            <FontAwesomeIcon icon={faUsers} className="w-4 h-4 mr-2 text-orange-500" />
                            <span className="font-medium">{reservation.reservationDetails.partySize} {reservation.reservationDetails.partySize === 1 ? 'person' : 'people'}</span>
                          </div>
                          <div className="flex items-center text-gray-600 bg-gray-50 p-2 rounded-lg">
                            <FontAwesomeIcon icon={faEnvelope} className="w-4 h-4 mr-2 text-blue-500" />
                            <span className="truncate font-medium">{reservation.customerDetails.email}</span>
                          </div>
                          <div className="flex items-center text-gray-600 bg-gray-50 p-2 rounded-lg">
                            <FontAwesomeIcon icon={faPhone} className="w-4 h-4 mr-2 text-green-500" />
                            <span className="font-medium">{reservation.customerDetails.phone}</span>
                          </div>
                        </div>
                      </div>

                      {reservation.customerDetails.specialRequests && (
                        <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border-l-4 border-yellow-400 p-3 rounded-lg">
                          <div className="flex items-start gap-2">
                            <FontAwesomeIcon icon={faEye} className="w-4 h-4 text-yellow-600 mt-0.5" />
                            <div>
                              <p className="text-xs font-semibold text-yellow-900 mb-1">Special Request</p>
                              <p className="text-sm text-gray-700 italic">"{reservation.customerDetails.specialRequests}"</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {reservation.status === 'pending' && (
                        <div className="flex gap-3 pt-3 border-t border-gray-200">
                          <button
                            onClick={() => handleStatusUpdate(reservation.id, 'confirmed')}
                            disabled={isUpdating}
                            className="flex-1 px-5 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white text-sm font-bold rounded-xl hover:from-green-600 hover:to-green-700 disabled:opacity-50 transition-all duration-200 flex items-center justify-center shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95"
                          >
                            <FontAwesomeIcon icon={faCheck} className="w-4 h-4 mr-2" />
                            Confirm Reservation
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(reservation.id, 'cancelled')}
                            disabled={isUpdating}
                            className="flex-1 px-5 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white text-sm font-bold rounded-xl hover:from-red-600 hover:to-red-700 disabled:opacity-50 transition-all duration-200 flex items-center justify-center shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95"
                          >
                            <FontAwesomeIcon icon={faTimes} className="w-4 h-4 mr-2" />
                            Cancel Reservation
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

