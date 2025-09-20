import React, { useState, useEffect, useRef } from 'react';
import { Calendar, Clock, CalendarDays, Timer, X, ChevronLeft, ChevronRight } from 'lucide-react';

const DateField = ({ 
  field, 
  value = '', 
  onChange, 
  fieldConfig = {},
  isRequired = false,
  placeholder = '',
  className = ''
}) => {
  const [localValue, setLocalValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState('');
  const [timeFrom, setTimeFrom] = useState('');
  const [timeTo, setTimeTo] = useState('');
  const [error, setError] = useState('');
  
  const datePickerRef = useRef(null);

  // Configuration from field
  const {
    date_type = 'date',
    date_format = 'Y-m-d',
    time_format = 'H:i',
    min_date = '',
    max_date = '',
    show_timezone = false,
    timezone = 'UTC'
  } = fieldConfig;

  // Initialize local value
  useEffect(() => {
    if (value) {
      setLocalValue(value);
      
      // Parse value based on date type
      switch (date_type) {
        case 'datetime':
          if (typeof value === 'object' && value.date && value.time) {
            setSelectedDate(new Date(value.date));
            setSelectedTime(value.time);
          } else if (typeof value === 'string') {
            const date = new Date(value);
            if (!isNaN(date.getTime())) {
              setSelectedDate(date);
              setSelectedTime(formatTime(date, time_format));
            }
          }
          break;
        case 'time_range':
          if (typeof value === 'object' && value.from && value.to) {
            setTimeFrom(value.from);
            setTimeTo(value.to);
          } else if (typeof value === 'string' && value.includes('{')) {
            try {
              const parsed = JSON.parse(value);
              setTimeFrom(parsed.from || '');
              setTimeTo(parsed.to || '');
            } catch (e) {
              console.error('Failed to parse time range:', e);
            }
          }
          break;
        case 'time':
          setSelectedTime(value);
          break;
        case 'date':
        default:
          if (value) {
            setSelectedDate(new Date(value));
          }
          break;
      }
    } else {
      setLocalValue('');
      setSelectedDate(null);
      setSelectedTime('');
      setTimeFrom('');
      setTimeTo('');
    }
  }, [value, date_type, time_format]);

  // Sync local value with parent component when user finishes interacting
  const syncWithParent = () => {
    if (localValue !== value && localValue !== '') {
      if (onChange) {
        onChange(localValue);
      }
    }
  };

  // Format date based on format string
  const formatDate = (date, format) => {
    if (!date) return '';
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const monthName = monthNames[date.getMonth()];
    
    switch (format) {
      case 'Y-m-d':
        return `${year}-${month}-${day}`;
      case 'm/d/Y':
        return `${month}/${day}/${year}`;
      case 'd/m/Y':
        return `${day}/${month}/${year}`;
      case 'Y/m/d':
        return `${year}/${month}/${day}`;
      case 'F j, Y':
        return `${monthName} ${day}, ${year}`;
      case 'j F Y':
        return `${day} ${monthName} ${year}`;
      default:
        return date.toISOString().split('T')[0];
    }
  };

  // Format time based on format string
  const formatTime = (date, format) => {
    if (!date) return '';
    
    const hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    switch (format) {
      case 'H:i':
        return `${String(hours).padStart(2, '0')}:${minutes}`;
      case 'g:i A':
        const hour12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
        const ampm = hours >= 12 ? 'PM' : 'AM';
        return `${hour12}:${minutes} ${ampm}`;
      case 'H:i:s':
        return `${String(hours).padStart(2, '0')}:${minutes}:${seconds}`;
      case 'g:i:s A':
        const hour12WithSec = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
        const ampmWithSec = hours >= 12 ? 'PM' : 'AM';
        return `${hour12WithSec}:${minutes}:${seconds} ${ampmWithSec}`;
      default:
        return `${String(hours).padStart(2, '0')}:${minutes}`;
    }
  };

  // Parse time string to Date object
  const parseTime = (timeStr) => {
    if (!timeStr) return null;
    
    const today = new Date();
    const [time, ampm] = timeStr.split(' ');
    const [hours, minutes, seconds] = time.split(':').map(Number);
    
    let parsedHours = hours;
    if (ampm === 'PM' && hours !== 12) {
      parsedHours = hours + 12;
    } else if (ampm === 'AM' && hours === 12) {
      parsedHours = 0;
    }
    
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate(), parsedHours, minutes || 0, seconds || 0);
    return date;
  };

  // Handle date selection
  const handleDateChange = (date) => {
    setSelectedDate(date);
    
    switch (date_type) {
      case 'date':
        const formattedDate = formatDate(date, date_format);
        setLocalValue(formattedDate);
        // Don't call onChange immediately - wait for user to save
        break;
      case 'datetime':
        const formattedDateTime = {
          date: formatDate(date, 'Y-m-d'),
          time: selectedTime || formatTime(date, time_format),
          timestamp: date.getTime()
        };
        setLocalValue(JSON.stringify(formattedDateTime));
        // Don't call onChange immediately - wait for user to save
        break;
    }
    setError('');
  };

  // Handle time selection
  const handleTimeChange = (time) => {
    setSelectedTime(time);
    
    switch (date_type) {
      case 'time':
        setLocalValue(time);
        // Don't call onChange immediately - wait for user to save
        break;
      case 'datetime':
        if (selectedDate) {
          const formattedDateTime = {
            date: formatDate(selectedDate, 'Y-m-d'),
            time: time,
            timestamp: selectedDate.getTime()
          };
          setLocalValue(JSON.stringify(formattedDateTime));
          // Don't call onChange immediately - wait for user to save
        }
        break;
    }
    setError('');
  };

  // Handle time range change
  const handleTimeRangeChange = (from, to) => {
    setTimeFrom(from);
    setTimeTo(to);
    
    const timeRange = {
      from: from,
      to: to,
      duration: calculateDuration(from, to)
    };
    
    setLocalValue(JSON.stringify(timeRange));
    // Don't call onChange immediately - wait for user to save
    setError('');
  };

  // Calculate duration between two times
  const calculateDuration = (from, to) => {
    if (!from || !to) return '';
    
    const fromTime = parseTime(from);
    const toTime = parseTime(to);
    
    if (!fromTime || !toTime) return '';
    
    const diffMs = toTime.getTime() - fromTime.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${String(diffHours).padStart(2, '0')}:${String(diffMinutes).padStart(2, '0')}`;
  };

  // Get display value
  const getDisplayValue = () => {
    switch (date_type) {
      case 'date':
        return selectedDate ? formatDate(selectedDate, date_format) : '';
      case 'datetime':
        if (selectedDate && selectedTime) {
          return `${formatDate(selectedDate, date_format)} ${selectedTime}`;
        }
        return '';
      case 'time':
        return selectedTime;
      case 'time_range':
        if (timeFrom && timeTo) {
          return `${timeFrom} - ${timeTo}`;
        }
        return '';
      default:
        return localValue;
    }
  };

  // Get field icon
  const getFieldIcon = () => {
    switch (date_type) {
      case 'datetime':
        return CalendarDays;
      case 'time':
      case 'time_range':
        return Clock;
      default:
        return Calendar;
    }
  };

  const FieldIcon = getFieldIcon();

  return (
    <div className={`mb-5 ${className}`}>
      {/* Field Header */}
      <div className="flex items-center gap-2 mb-3">
        <FieldIcon className="w-4 h-4 text-gray-500" />
        <span className="font-semibold text-gray-700">{field?.label || 'Date Field'}</span>
        {isRequired && <span className="text-red-600 ml-1">*</span>}
      </div>

      {/* Date Type Display */}
      <div className="mb-2">
        <span className="text-sm text-gray-500">
          {date_type === 'date' && 'Date Picker'}
          {date_type === 'datetime' && 'Date & Time Picker'}
          {date_type === 'time' && 'Time Picker'}
          {date_type === 'time_range' && 'Time Range Picker'}
        </span>
      </div>

      {/* Input Field */}
      <div className="relative">
        <input
          type="text"
          value={getDisplayValue()}
          placeholder={placeholder || `Select ${date_type.replace('_', ' ')}`}
          readOnly
          onClick={() => setIsOpen(!isOpen)}
          onBlur={() => {
            // Delay the sync to prevent immediate page refresh
            setTimeout(() => {
              syncWithParent();
            }, 200);
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
        />
        
        {/* Clear Button */}
        {localValue && (
          <button
            type="button"
            onClick={() => {
              setLocalValue('');
              setSelectedDate(null);
              setSelectedTime('');
              setTimeFrom('');
              setTimeTo('');
              // Don't call onChange immediately - will be synced when modal closes
              setError('');
            }}
            className="absolute right-8 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        
        {/* Calendar/Clock Icon */}
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
          <FieldIcon className="w-4 h-4" />
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-2 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Date/Time Picker Modal */}
      {isOpen && (
        <div className="absolute z-50 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
          <DatePickerModal
            dateType={date_type}
            selectedDate={selectedDate}
            selectedTime={selectedTime}
            timeFrom={timeFrom}
            timeTo={timeTo}
            dateFormat={date_format}
            timeFormat={time_format}
            minDate={min_date}
            maxDate={max_date}
            onDateChange={handleDateChange}
            onTimeChange={handleTimeChange}
            onTimeRangeChange={handleTimeRangeChange}
            onClose={() => {
              setIsOpen(false);
              // Delay the sync to prevent immediate page refresh
              setTimeout(() => {
                syncWithParent();
              }, 100);
            }}
          />
        </div>
      )}

      {/* Hidden input for form submission */}
      <input
        type="hidden"
        name={field?.name || 'date'}
        value={typeof localValue === 'object' ? JSON.stringify(localValue) : localValue}
      />
    </div>
  );
};

// Date Picker Modal Component
const DatePickerModal = ({
  dateType,
  selectedDate,
  selectedTime,
  timeFrom,
  timeTo,
  dateFormat,
  timeFormat,
  minDate,
  maxDate,
  onDateChange,
  onTimeChange,
  onTimeRangeChange,
  onClose
}) => {
  const [currentMonth, setCurrentMonth] = useState(selectedDate ? selectedDate.getMonth() : new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(selectedDate ? selectedDate.getFullYear() : new Date().getFullYear());

  // Generate calendar days
  const generateCalendarDays = () => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(currentYear, currentMonth, day));
    }
    
    return days;
  };

  // Generate time options
  const generateTimeOptions = () => {
    const options = [];
    const is12Hour = timeFormat.includes('g');
    
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        let timeStr;
        
        if (is12Hour) {
          const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
          const ampm = hour >= 12 ? 'PM' : 'AM';
          timeStr = `${displayHour}:${String(minute).padStart(2, '0')} ${ampm}`;
        } else {
          timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
        }
        
        options.push(timeStr);
      }
    }
    
    return options;
  };

  const calendarDays = generateCalendarDays();
  const timeOptions = generateTimeOptions();
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="p-4 w-80">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">
          {dateType === 'date' && 'Select Date'}
          {dateType === 'datetime' && 'Select Date & Time'}
          {dateType === 'time' && 'Select Time'}
          {dateType === 'time_range' && 'Select Time Range'}
        </h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Date Picker */}
      {(dateType === 'date' || dateType === 'datetime') && (
        <div className="mb-4">
          {/* Month/Year Navigation */}
          <div className="flex justify-between items-center mb-3">
            <button
              onClick={() => {
                if (currentMonth === 0) {
                  setCurrentMonth(11);
                  setCurrentYear(currentYear - 1);
                } else {
                  setCurrentMonth(currentMonth - 1);
                }
              }}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-medium">
              {monthNames[currentMonth]} {currentYear}
            </span>
            <button
              onClick={() => {
                if (currentMonth === 11) {
                  setCurrentMonth(0);
                  setCurrentYear(currentYear + 1);
                } else {
                  setCurrentMonth(currentMonth + 1);
                }
              }}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Day Headers */}
            {dayNames.map(day => (
              <div key={day} className="text-center text-sm font-medium text-gray-500 py-1">
                {day}
              </div>
            ))}
            
            {/* Calendar Days */}
            {calendarDays.map((day, index) => (
              <button
                key={index}
                onClick={() => day && onDateChange(day)}
                disabled={!day}
                className={`p-2 text-sm rounded hover:bg-gray-100 ${
                  day && selectedDate && day.toDateString() === selectedDate.toDateString()
                    ? 'bg-blue-500 text-white hover:bg-blue-600'
                    : day
                    ? 'text-gray-700'
                    : 'text-gray-300 cursor-not-allowed'
                }`}
              >
                {day ? day.getDate() : ''}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Time Picker */}
      {(dateType === 'time' || dateType === 'datetime') && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Time</label>
          <select
            value={selectedTime}
            onChange={(e) => onTimeChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select time</option>
            {timeOptions.map(time => (
              <option key={time} value={time}>{time}</option>
            ))}
          </select>
        </div>
      )}

      {/* Time Range Picker */}
      {dateType === 'time_range' && (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">From</label>
            <select
              value={timeFrom}
              onChange={(e) => onTimeRangeChange(e.target.value, timeTo)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select start time</option>
              {timeOptions.map(time => (
                <option key={time} value={time}>{time}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">To</label>
            <select
              value={timeTo}
              onChange={(e) => onTimeRangeChange(timeFrom, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select end time</option>
              {timeOptions.map(time => (
                <option key={time} value={time}>{time}</option>
              ))}
            </select>
          </div>
          
          {timeFrom && timeTo && (
            <div className="text-sm text-gray-600">
              Duration: {calculateDuration(timeFrom, timeTo)}
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
        <button
          onClick={onClose}
          className="px-4 py-2 text-gray-600 hover:text-gray-800"
        >
          Cancel
        </button>
        <button
          onClick={onClose}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Done
        </button>
      </div>
    </div>
  );
};

// Helper component for calculating duration
const calculateDuration = (from, to) => {
  if (!from || !to) return '';
  
  const fromTime = parseTime(from);
  const toTime = parseTime(to);
  
  if (!fromTime || !toTime) return '';
  
  const diffMs = toTime.getTime() - fromTime.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  return `${String(diffHours).padStart(2, '0')}:${String(diffMinutes).padStart(2, '0')}`;
};

// Helper function to parse time string
const parseTime = (timeStr) => {
  if (!timeStr) return null;
  
  const today = new Date();
  const [time, ampm] = timeStr.split(' ');
  const [hours, minutes, seconds] = time.split(':').map(Number);
  
  let parsedHours = hours;
  if (ampm === 'PM' && hours !== 12) {
    parsedHours = hours + 12;
  } else if (ampm === 'AM' && hours === 12) {
    parsedHours = 0;
  }
  
  const date = new Date(today.getFullYear(), today.getMonth(), today.getDate(), parsedHours, minutes || 0, seconds || 0);
  return date;
};

export default DateField;
