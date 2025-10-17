import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendar, faChevronLeft, faChevronRight, faCheckCircle, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';

interface DateOption {
  date: string;
  display: string;
  dayOfWeek: string;
}

interface ReservationCalendarProps {
  availableDates: DateOption[];
  selectedDate: string;
  onDateSelect: (date: string) => void;
  isDateOpen: (date: string) => boolean;
  restaurantDetails: any;
}

export default function ReservationCalendar({
  availableDates,
  selectedDate,
  onDateSelect,
  isDateOpen,
  restaurantDetails
}: ReservationCalendarProps) {
  // Group dates by week for better display
  const groupDatesByWeek = (dates: DateOption[]) => {
    const weeks: DateOption[][] = [];
    let currentWeek: DateOption[] = [];
    
    dates.forEach((date, index) => {
      currentWeek.push(date);
      
      // Start new week every 7 days or at the end
      if (currentWeek.length === 7 || index === dates.length - 1) {
        weeks.push([...currentWeek]);
        currentWeek = [];
      }
    });
    
    return weeks;
  };

  const weeks = groupDatesByWeek(availableDates);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center">
        <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl flex items-center justify-center mr-4">
          <FontAwesomeIcon icon={faCalendar} className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">Select Date</h3>
          <p className="text-sm text-gray-600">Choose your preferred date</p>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6">
        {availableDates.length > 0 ? (
          <div className="space-y-4">
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-2 sm:gap-3">
                {week.map((dateOption) => {
                  const isSelected = selectedDate === dateOption.date;
                  const isOpen = isDateOpen(dateOption.date);
                  
                  return (
                    <button
                      key={dateOption.date}
                      type="button"
                      onClick={() => onDateSelect(dateOption.date)}
                      disabled={!isOpen}
                      className={`relative p-3 sm:p-4 text-sm rounded-xl border-2 transition-all duration-300 transform hover:scale-105 ${
                        isSelected
                          ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white border-orange-500 shadow-lg scale-105'
                          : isOpen
                          ? 'border-gray-200 bg-white hover:border-orange-300 hover:bg-orange-50 hover:shadow-md'
                          : 'border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      <div className="text-center">
                        <div className="font-semibold text-xs mb-1">
                          {dateOption.dayOfWeek.substring(0, 3)}
                        </div>
                        <div className="text-lg sm:text-xl font-bold">
                          {new Date(dateOption.date).getDate()}
                        </div>
                        <div className="text-xs opacity-75">
                          {new Date(dateOption.date).toLocaleDateString('en-US', { month: 'short' })}
                        </div>
                      </div>
                      
                      {isSelected && (
                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-lg">
                          <FontAwesomeIcon icon={faCheckCircle} className="w-3 h-3 text-orange-500" />
                        </div>
                      )}
                      
                      {!isOpen && (
                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-lg">
                          <FontAwesomeIcon icon={faExclamationTriangle} className="w-3 h-3 text-red-400" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FontAwesomeIcon icon={faExclamationTriangle} className="w-8 h-8 text-yellow-600" />
            </div>
            <p className="text-gray-700 font-medium">No available dates found</p>
            <p className="text-sm text-gray-500 mt-2">
              Please contact the restaurant for availability
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
