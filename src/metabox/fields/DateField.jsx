import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  const [isChanging, setIsChanging] = useState(false);
  
  const datePickerRef = useRef(null);
  const inputRef = useRef(null);
  const changeTimeoutRef = useRef(null);
  
  // Handle click outside to close modal
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target) && 
          inputRef.current && !inputRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen]);

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

  // Helper function to check if date is within min/max range
  const isDateInRange = (date) => {
    if (!date) return true;
    
    // If no min/max dates are set, all dates are valid
    if (!min_date && !max_date) return true;
    
    const dateObj = new Date(date);
    const minDateObj = min_date ? new Date(min_date) : null;
    const maxDateObj = max_date ? new Date(max_date) : null;
    
    // Normalize dates to compare only date parts (ignore time)
    const normalizeDate = (date) => {
      const normalized = new Date(date);
      normalized.setHours(0, 0, 0, 0);
      return normalized;
    };
    
    const normalizedDateObj = normalizeDate(dateObj);
    const normalizedMinDate = minDateObj ? normalizeDate(minDateObj) : null;
    const normalizedMaxDate = maxDateObj ? normalizeDate(maxDateObj) : null;
    
    if (normalizedMinDate && normalizedDateObj < normalizedMinDate) return false;
    if (normalizedMaxDate && normalizedDateObj > normalizedMaxDate) return false;
    
    return true;
  };

  // Helper function to get validation error message
  const getValidationMessage = () => {
    if (min_date && max_date) {
      const minFormatted = formatDate(new Date(min_date), date_format);
      const maxFormatted = formatDate(new Date(max_date), date_format);
      return `Please select a date between ${minFormatted} and ${maxFormatted}`;
    } else if (min_date) {
      const minFormatted = formatDate(new Date(min_date), date_format);
      return `Please select a date on or after ${minFormatted}`;
    } else if (max_date) {
      const maxFormatted = formatDate(new Date(max_date), date_format);
      return `Please select a date on or before ${maxFormatted}`;
    }
    return '';
  };

  // Initialize local value with validation
  useEffect(() => {
    // Only run initialization if value is different from current local value
    // This prevents clearing the date when user is actively selecting it
    if (value && value !== localValue) {
      // Parse value based on date type
      switch (date_type) {
        case 'datetime':
          if (typeof value === 'object' && value.date && value.time) {
            const date = new Date(value.date);
            if (!isNaN(date.getTime()) && isDateInRange(date)) {
              setSelectedDate(date);
              setSelectedTime(value.time);
              setLocalValue(value);
            } else {
              // Invalid date - clear it
              console.log('CCC DateField: Invalid datetime value outside range, clearing');
              setSelectedDate(null);
              setSelectedTime('');
              setLocalValue('');
              setError(getValidationMessage());
              if (onChange) onChange('');
            }
          } else if (typeof value === 'string') {
            const date = new Date(value);
            if (!isNaN(date.getTime()) && isDateInRange(date)) {
              setSelectedDate(date);
              setSelectedTime(formatTime(date, time_format));
              setLocalValue(value);
            } else {
              // Invalid date - clear it
              console.log('CCC DateField: Invalid datetime string outside range, clearing');
              setSelectedDate(null);
              setSelectedTime('');
              setLocalValue('');
              setError(getValidationMessage());
              if (onChange) onChange('');
            }
          }
          break;
        case 'time_range':
          if (typeof value === 'object' && value.from && value.to) {
            setTimeFrom(value.from);
            setTimeTo(value.to);
            setLocalValue(value);
          } else if (typeof value === 'string' && value.includes('{')) {
            try {
              const parsed = JSON.parse(value);
              setTimeFrom(parsed.from || '');
              setTimeTo(parsed.to || '');
              setLocalValue(value);
            } catch (e) {
              console.error('Failed to parse time range:', e);
              setLocalValue('');
            }
          }
          break;
        case 'time':
          setSelectedTime(value);
          setLocalValue(value);
          break;
        case 'date':
        default:
          if (value) {
            const date = new Date(value);
            if (!isNaN(date.getTime()) && isDateInRange(date)) {
              setSelectedDate(date);
              setLocalValue(value);
            } else {
              // Invalid date - clear it
              console.log('CCC DateField: Invalid date value outside range, clearing');
              setSelectedDate(null);
              setLocalValue('');
              setError(getValidationMessage());
              if (onChange) onChange('');
            }
          }
          break;
      }
    } else if (!value) {
      // Clear all states when value is empty
      setLocalValue('');
      setSelectedDate(null);
      setSelectedTime('');
      setTimeFrom('');
      setTimeTo('');
      setError('');
    }
  }, [value, date_type, time_format, min_date, max_date, date_format]);


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
    console.log('CCC DateField: handleDateChange called with:', date);
    
    // Prevent rapid successive calls
    if (isChanging) {
      console.log('CCC DateField: Already changing, skipping duplicate call');
      return;
    }
    
    // Validate date is within range
    if (!isDateInRange(date)) {
      setError(getValidationMessage());
      return; // Don't set the date if it's outside the range
    }
    
    // Prevent duplicate calls - check if the date is already selected
    if (selectedDate && date.getTime() === selectedDate.getTime()) {
      console.log('CCC DateField: Same date already selected, skipping duplicate call');
      return;
    }
    
    setIsChanging(true);
    setSelectedDate(date);
    setError(''); // Clear any existing errors
    
    switch (date_type) {
      case 'date':
        const formattedDate = formatDate(date, date_format);
        console.log('CCC DateField: Setting formatted date:', formattedDate);
        setLocalValue(formattedDate);
        if (onChange) {
          onChange(formattedDate);
        }
        break;
      case 'datetime':
        const formattedDateTime = {
          date: formatDate(date, date_format),
          time: selectedTime || formatTime(date, time_format),
          timestamp: date.getTime()
        };
        console.log('CCC DateField: Setting formatted datetime:', formattedDateTime);
        setLocalValue(JSON.stringify(formattedDateTime));
        if (onChange) {
          onChange(formattedDateTime);
        }
        break;
    }
    
    // Reset changing flag after a short delay
    setTimeout(() => {
      setIsChanging(false);
    }, 100);
  };

  // Handle time selection
  const handleTimeChange = (time) => {
    setSelectedTime(time);
    
    switch (date_type) {
      case 'time':
        setLocalValue(time);
        if (onChange) {
          onChange(time);
        }
        break;
      case 'datetime':
        if (selectedDate) {
          const formattedDateTime = {
            date: formatDate(selectedDate, date_format),
            time: time,
            timestamp: selectedDate.getTime()
          };
          setLocalValue(JSON.stringify(formattedDateTime));
          if (onChange) {
            onChange(formattedDateTime);
          }
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
    if (onChange) {
      onChange(timeRange);
    }
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
      <div className="relative" ref={inputRef}>
        <input
          type="text"
          value={getDisplayValue()}
          placeholder={placeholder || `Select ${date_type.replace('_', ' ')}`}
          readOnly
          onClick={(e) => {
            console.log('CCC DateField: input clicked, current isOpen:', isOpen);
            e.preventDefault();
            e.stopPropagation();
            if (!isChanging) {
              setIsOpen(prev => !prev);
            }
          }}
          onKeyDown={(e) => {
            // Prevent form submission on Enter key
            if (e.key === 'Enter') {
              e.preventDefault();
              e.stopPropagation();
              if (!isChanging) {
                setIsOpen(prev => !prev);
              }
            }
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
              if (onChange) {
                onChange('');
              }
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
        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md text-sm text-red-700 flex items-center gap-2">
          <X className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Date Range Info */}
      {(min_date || max_date) && !error && (
        <div className="mt-2 text-xs text-gray-500">
          {min_date && max_date && (
            <>Allowed range: {formatDate(new Date(min_date), date_format)} to {formatDate(new Date(max_date), date_format)}</>
          )}
          {min_date && !max_date && (
            <>Minimum date: {formatDate(new Date(min_date), date_format)}</>
          )}
          {!min_date && max_date && (
            <>Maximum date: {formatDate(new Date(max_date), date_format)}</>
          )}
        </div>
      )}

      {/* Date/Time Picker Modal */}
      {isOpen && (
        <div 
          ref={datePickerRef}
          className="absolute z-50 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg"
        >
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
            isDateInRange={isDateInRange}
            getValidationMessage={getValidationMessage}
            onDateChange={(date) => {
              handleDateChange(date);
              // Auto close for date type, keep open for datetime
              if (date_type === 'date') {
                setTimeout(() => {
                  setIsOpen(false);
                }, 200);
              }
            }}
            onTimeChange={handleTimeChange}
            onTimeRangeChange={handleTimeRangeChange}
            onClose={() => {
              console.log('CCC DateField: modal closing');
              setIsOpen(false);
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
  isDateInRange,
  getValidationMessage,
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
    
    // Pre-calculate min/max dates for performance
    const minDateObj = minDate ? new Date(minDate) : null;
    const maxDateObj = maxDate ? new Date(maxDate) : null;
    
    // Normalize min/max dates to compare only date parts
    const normalizeDate = (date) => {
      const normalized = new Date(date);
      normalized.setHours(0, 0, 0, 0);
      return normalized;
    };
    
    const normalizedMinDate = minDateObj ? normalizeDate(minDateObj) : null;
    const normalizedMaxDate = maxDateObj ? normalizeDate(maxDateObj) : null;
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(currentYear, currentMonth, day));
    }
    
    return days;
  };

  // Generate time options with configurable granularity
  const generateTimeOptions = (intervalMinutes = 1, includeSeconds = false) => {
    const options = [];
    const is12Hour = timeFormat.includes('g');
    const includeSecondsFormat = timeFormat.includes('s');
    
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += intervalMinutes) {
        if (includeSeconds) {
          for (let second = 0; second < 60; second += (includeSecondsFormat ? 1 : 60)) {
            let timeStr;
            
            if (is12Hour) {
              const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
              const ampm = hour >= 12 ? 'PM' : 'AM';
              if (includeSecondsFormat) {
                timeStr = `${displayHour}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')} ${ampm}`;
              } else {
                timeStr = `${displayHour}:${String(minute).padStart(2, '0')} ${ampm}`;
              }
            } else {
              if (includeSecondsFormat) {
                timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}`;
              } else {
                timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
              }
            }
            
            options.push(timeStr);
            
            // Break after first second if not including seconds in format
            if (!includeSecondsFormat) break;
          }
        } else {
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
          type="button"
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Date Picker */}
      {(dateType === 'date' || dateType === 'datetime') && (
        <div className={`mb-4 ${dateType === 'datetime' ? 'border-b border-gray-200 pb-4' : ''}`}>
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-4 h-4 text-gray-500" />
            <h4 className="text-sm font-semibold text-gray-700">
              {dateType === 'datetime' ? 'Select Date' : 'Select Date'}
            </h4>
          </div>
          
          {/* Month/Year Navigation */}
          <div className="flex justify-between items-center mb-3">
            <button
              type="button"
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
              type="button"
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
            {calendarDays.map((day, index) => {
              // Optimized date validation - only check if min/max dates are set
              let isDateDisabled = false;
              if (day && (minDate || maxDate)) {
                const dayTime = day.getTime();
                const minTime = minDate ? new Date(minDate).setHours(0, 0, 0, 0) : null;
                const maxTime = maxDate ? new Date(maxDate).setHours(23, 59, 59, 999) : null;
                
                if (minTime && dayTime < minTime) isDateDisabled = true;
                if (maxTime && dayTime > maxTime) isDateDisabled = true;
              }
              
              const isSelected = day && selectedDate && day.toDateString() === selectedDate.toDateString();
              
              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => day && !isDateDisabled && onDateChange(day)}
                  disabled={!day || isDateDisabled}
                  className={`p-2 text-sm rounded transition-colors ${
                    isSelected
                      ? 'bg-blue-500 text-white hover:bg-blue-600'
                      : isDateDisabled
                      ? 'text-gray-300 cursor-not-allowed bg-gray-100'
                      : day
                      ? 'text-gray-700 hover:bg-gray-100'
                      : 'text-gray-300 cursor-not-allowed'
                  }`}
                  title={isDateDisabled ? getValidationMessage() : ''}
                >
                  {day ? day.getDate() : ''}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Time Picker */}
      {(dateType === 'time' || dateType === 'datetime') && (
        <div className={`mb-4 ${dateType === 'datetime' ? 'mt-4' : ''}`}>
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-gray-500" />
            <h4 className="text-sm font-semibold text-gray-700">
              {dateType === 'datetime' ? 'Select Time' : 'Select Time'}
            </h4>
          </div>
          
          <GranularTimePicker
            value={selectedTime}
            onChange={onTimeChange}
            timeFormat={timeFormat}
            includeSeconds={timeFormat.includes('s')}
          />
        </div>
      )}

      {/* Time Range Picker */}
      {dateType === 'time_range' && (
        <div className="space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-gray-500" />
              <h4 className="text-sm font-semibold text-gray-700">From Time</h4>
            </div>
            <GranularTimePicker
              value={timeFrom}
              onChange={(value) => onTimeRangeChange(value, timeTo)}
              timeFormat={timeFormat}
              includeSeconds={timeFormat.includes('s')}
            />
          </div>
          
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-gray-500" />
              <h4 className="text-sm font-semibold text-gray-700">To Time</h4>
            </div>
            <GranularTimePicker
              value={timeTo}
              onChange={(value) => onTimeRangeChange(timeFrom, value)}
              timeFormat={timeFormat}
              includeSeconds={timeFormat.includes('s')}
            />
          </div>
          
          {timeFrom && timeTo && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
              <div className="text-sm font-medium text-blue-800 mb-1">Duration</div>
              <div className="text-sm text-blue-700">{calculateDuration(timeFrom, timeTo)}</div>
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-gray-600 hover:text-gray-800"
        >
          Cancel
        </button>
        <button
          type="button"
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

// Granular Time Picker Component
const GranularTimePicker = ({ value, onChange, timeFormat, includeSeconds = false }) => {
  const [customTime, setCustomTime] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [hour, setHour] = useState('');
  const [minute, setMinute] = useState('');
  const [second, setSecond] = useState('');
  const [ampm, setAmpm] = useState('AM');
  
  const is12Hour = timeFormat.includes('g');
  
  // Parse existing time value
  useEffect(() => {
    if (value) {
      const timeMatch = value.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?/i);
      if (timeMatch) {
        let parsedHour = parseInt(timeMatch[1]);
        const parsedMinute = timeMatch[2];
        const parsedSecond = timeMatch[3] || '00';
        const parsedAmpm = timeMatch[4]?.toUpperCase() || 'AM';
        
        if (is12Hour) {
          setHour(parsedHour);
          setAmpm(parsedAmpm);
        } else {
          setHour(String(parsedHour).padStart(2, '0'));
        }
        setMinute(parsedMinute);
        if (includeSeconds) {
          setSecond(parsedSecond);
        }
      }
    }
  }, [value, is12Hour, includeSeconds]);
  
  // Generate hour options
  const generateHourOptions = () => {
    const options = [];
    if (is12Hour) {
      for (let i = 1; i <= 12; i++) {
        options.push(i);
      }
    } else {
      for (let i = 0; i <= 23; i++) {
        options.push(String(i).padStart(2, '0'));
      }
    }
    return options;
  };
  
  // Generate minute options (every minute)
  const generateMinuteOptions = () => {
    const options = [];
    for (let i = 0; i <= 59; i++) {
      options.push(String(i).padStart(2, '0'));
    }
    return options;
  };
  
  // Generate second options (every second)
  const generateSecondOptions = () => {
    const options = [];
    for (let i = 0; i <= 59; i++) {
      options.push(String(i).padStart(2, '0'));
    }
    return options;
  };
  
  // Handle time change
  const handleTimeChange = (newHour, newMinute, newSecond, newAmpm) => {
    let formattedTime = '';
    
    if (is12Hour) {
      const displayHour = newHour;
      formattedTime = `${displayHour}:${newMinute}`;
      if (includeSeconds) {
        formattedTime += `:${newSecond}`;
      }
      formattedTime += ` ${newAmpm}`;
    } else {
      formattedTime = `${newHour}:${newMinute}`;
      if (includeSeconds) {
        formattedTime += `:${newSecond}`;
      }
    }
    
    onChange(formattedTime);
  };
  
  // Handle custom time input
  const handleCustomTimeSubmit = () => {
    if (customTime) {
      // Validate custom time format
      const timeRegex = is12Hour 
        ? /^(1[0-2]|[1-9]):[0-5]\d(?::[0-5]\d)?\s*(AM|PM)$/i
        : /^([01]?\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/;
      
      if (timeRegex.test(customTime)) {
        onChange(customTime);
        setCustomTime('');
        setShowCustomInput(false);
      } else {
        alert('Please enter a valid time format');
      }
    }
  };
  
  return (
    <div className="space-y-3">
      {/* Quick Time Selection */}
      <div className="grid grid-cols-3 gap-2">
        {/* Hour */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Hour</label>
          <select
            value={hour}
            onChange={(e) => {
              setHour(e.target.value);
              handleTimeChange(e.target.value, minute, second, ampm);
            }}
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">--</option>
            {generateHourOptions().map(h => (
              <option key={h} value={h}>{h}</option>
            ))}
          </select>
        </div>
        
        {/* Minute */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Minute</label>
          <select
            value={minute}
            onChange={(e) => {
              setMinute(e.target.value);
              handleTimeChange(hour, e.target.value, second, ampm);
            }}
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">--</option>
            {generateMinuteOptions().map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
        
        {/* Second (if enabled) */}
        {includeSeconds && (
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Second</label>
            <select
              value={second}
              onChange={(e) => {
                setSecond(e.target.value);
                handleTimeChange(hour, minute, e.target.value, ampm);
              }}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">--</option>
              {generateSecondOptions().map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        )}
        
        {/* AM/PM (if 12-hour format) */}
        {is12Hour && (
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">AM/PM</label>
            <select
              value={ampm}
              onChange={(e) => {
                setAmpm(e.target.value);
                handleTimeChange(hour, minute, second, e.target.value);
              }}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="AM">AM</option>
              <option value="PM">PM</option>
            </select>
          </div>
        )}
      </div>
      
      {/* Custom Time Input */}
      <div className="border-t border-gray-200 pt-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-gray-600">Custom Time</span>
          <button
            type="button"
            onClick={() => setShowCustomInput(!showCustomInput)}
            className="text-xs text-blue-600 hover:text-blue-800"
          >
            {showCustomInput ? 'Hide' : 'Enter manually'}
          </button>
        </div>
        
        {showCustomInput && (
          <div className="space-y-2">
            <input
              type="text"
              value={customTime}
              onChange={(e) => setCustomTime(e.target.value)}
              placeholder={is12Hour ? 'e.g., 2:30:45 PM' : 'e.g., 14:30:45'}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCustomTimeSubmit}
                className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Set Time
              </button>
              <button
                type="button"
                onClick={() => {
                  setCustomTime('');
                  setShowCustomInput(false);
                }}
                className="px-3 py-1.5 text-xs bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
      
    </div>
  );
};

export default DateField;
