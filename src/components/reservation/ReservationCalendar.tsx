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
        <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mr-3">
          <FontAwesomeIcon icon={faCalendar} className="w-4 h-4 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-800">Select Date</h3>
          <p className="text-sm text-gray-600">Choose your preferred date</p>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        {availableDates.length > 0 ? (
          <div className="space-y-3">
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="grid grid-cols-7 gap-2">
                {week.map((dateOption) => {
                  const isSelected = selectedDate === dateOption.date;
                  const isOpen = isDateOpen(dateOption.date);
                  
                  return (
                    <button
                      key={dateOption.date}
                      type="button"
                      onClick={() => onDateSelect(dateOption.date)}
                      disabled={!isOpen}
                      className={`relative p-3 text-sm rounded-lg border-2 transition-all duration-200 ${
                        isSelected
                          ? 'bg-orange-500 text-white border-orange-500 shadow-md'
                          : isOpen
                          ? 'border-gray-200 bg-white hover:border-orange-300 hover:bg-orange-25'
                          : 'border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      <div className="text-center">
                        <div className="font-medium text-xs mb-1">
                          {dateOption.dayOfWeek.substring(0, 3)}
                        </div>
                        <div className="text-lg font-bold">
                          {new Date(dateOption.date).getDate()}
                        </div>
                        <div className="text-xs">
                          {new Date(dateOption.date).toLocaleDateString('en-US', { month: 'short' })}
                        </div>
                      </div>
                      
                      {isSelected && (
                        <div className="absolute top-1 right-1">
                          <FontAwesomeIcon icon={faCheckCircle} className="w-3 h-3" />
                        </div>
                      )}
                      
                      {!isOpen && (
                        <div className="absolute top-1 right-1">
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
          <div className="text-center py-8">
            <FontAwesomeIcon icon={faExclamationTriangle} className="w-8 h-8 text-yellow-500 mb-3" />
            <p className="text-gray-600">No available dates found</p>
            <p className="text-sm text-gray-500 mt-1">
              Please contact the restaurant for availability
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
