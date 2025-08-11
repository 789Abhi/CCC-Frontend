import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle, AlertCircle } from 'lucide-react';

const RangeField = ({ label, fieldName, fieldConfig, fieldValue, fieldRequired, onChange }) => {
    const [rangeValue, setRangeValue] = useState('');
    const [isValid, setIsValid] = useState(true);
    const [isFocused, setIsFocused] = useState(false);
    const [showValidation, setShowValidation] = useState(false);
    const [isInitializing, setIsInitializing] = useState(true);
    const inputRef = useRef(null);

    const minValue = fieldConfig?.min_value ?? 0;
    const maxValue = fieldConfig?.max_value ?? 100;
    const prependText = fieldConfig?.prepend ?? '';
    const appendText = fieldConfig?.append ?? '';

    useEffect(() => {
        if (fieldValue) {
            try {
                const parsedValue = typeof fieldValue === 'string' ? fieldValue : JSON.stringify(fieldValue);
                setRangeValue(parsedValue);
                setIsValid(validateRange(parsedValue));
            } catch (error) {
                console.error('Error parsing range field value:', error);
            }
        } else {
            // Set default value to middle of range if no value exists
            const defaultValue = Math.round((minValue + maxValue) / 2);
            setRangeValue(defaultValue.toString());
            setIsValid(true);
        }
        
        const timer = setTimeout(() => {
            setIsInitializing(false);
        }, 100);
        
        return () => clearTimeout(timer);
    }, [fieldValue, minValue, maxValue]);

    const validateRange = (value) => {
        if (!value) return true;
        const num = parseFloat(value);
        
        if (isNaN(num) || !isFinite(num)) {
            return false;
        }
        
        // Check min value if configured
        if (minValue !== null && minValue !== undefined && num < minValue) {
            return false;
        }
        
        // Check max value if configured
        if (maxValue !== null && maxValue !== undefined && num > maxValue) {
            return false;
        }
        
        return true;
    };

    const handleRangeChange = (e) => {
        const newValue = e.target.value;
        setRangeValue(newValue);
        
        const valid = validateRange(newValue);
        setIsValid(valid);
        
        if (newValue && !showValidation) {
            setShowValidation(true);
        }
        
        if (!isInitializing) {
            onChange(newValue);
        }
    };

    const handleSliderChange = (e) => {
        const newValue = e.target.value;
        setRangeValue(newValue);
        setIsValid(true);
        
        if (!isInitializing) {
            onChange(newValue);
        }
    };

    const handleFocus = () => {
        setIsFocused(true);
        setShowValidation(true);
    };

    const handleBlur = () => {
        setIsFocused(false);
    };

    const handleClear = () => {
        const defaultValue = Math.round((minValue + maxValue) / 2);
        setRangeValue(defaultValue.toString());
        setIsValid(true);
        setShowValidation(false);
        if (!isInitializing) {
            onChange(defaultValue.toString());
        }
        inputRef.current?.focus();
    };

    const getInputBorderColor = () => {
        if (!showValidation) return 'border-gray-300';
        if (!isValid) return 'border-red-500';
        if (isValid) return 'border-green-500';
        return 'border-gray-300';
    };

    const getInputFocusColor = () => {
        if (!showValidation) return 'focus:border-blue-500 focus:ring-blue-500';
        if (!isValid) return 'focus:border-red-500 focus:ring-red-500';
        if (isValid) return 'focus:border-green-500 focus:ring-green-500';
        return 'focus:border-blue-500 focus:ring-blue-500';
    };

    const getValidationIcon = () => {
        if (!isValid) {
            return <AlertCircle size={20} className="text-red-500" />;
        }
        
        if (isValid && rangeValue) {
            return <CheckCircle size={20} className="text-green-500" />;
        }
        
        return null;
    };

    const getValidationMessage = () => {
        if (!isValid && rangeValue) {
            if (minValue !== null && minValue !== undefined && parseFloat(rangeValue) < minValue) {
                return `Value must be at least ${minValue}`;
            }
            if (maxValue !== null && maxValue !== undefined && parseFloat(rangeValue) > maxValue) {
                return `Value must be at most ${maxValue}`;
            }
            return "Please enter a valid value";
        }
        
        if (isValid && rangeValue) {
            return "Valid value";
        }
        
        if (fieldRequired && !rangeValue) {
            return "Value is required";
        }
        
        return "";
    };

    const getValidationColor = () => {
        if (!showValidation) return 'text-gray-500';
        if (!isValid) return 'text-red-600';
        if (isValid) return 'text-green-600';
        return 'text-gray-500';
    };

    const getValidationIconColor = () => {
        if (!showValidation) return 'text-gray-400';
        if (!isValid) return 'text-red-500';
        if (isValid) return 'text-green-500';
        return 'text-gray-400';
    };

    const getSliderBackground = () => {
        const percentage = ((parseFloat(rangeValue) - minValue) / (maxValue - minValue)) * 100;
        return `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${percentage}%, #e5e7eb ${percentage}%, #e5e7eb 100%)`;
    };

    return (
        <div className="w-full">
            {label && (
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    {label}
                    {fieldRequired && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}
            
            <div className="space-y-3">
                {/* Range Slider */}
                <div className="flex items-center space-x-3">
                    {prependText && (
                        <span className="text-sm font-medium text-gray-700 min-w-[20px]">
                            {prependText}
                        </span>
                    )}
                    
                    <div className="flex-1 relative">
                        <input
                            type="range"
                            min={minValue}
                            max={maxValue}
                            value={rangeValue}
                            onChange={handleSliderChange}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                            style={{
                                background: getSliderBackground()
                            }}
                        />
                        <style jsx>{`
                            .slider::-webkit-slider-thumb {
                                appearance: none;
                                height: 20px;
                                width: 20px;
                                border-radius: 50%;
                                background: #3b82f6;
                                cursor: pointer;
                                border: 2px solid #ffffff;
                                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                            }
                            .slider::-moz-range-thumb {
                                height: 20px;
                                width: 20px;
                                border-radius: 50%;
                                background: #3b82f6;
                                cursor: pointer;
                                border: 2px solid #ffffff;
                                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                            }
                        `}</style>
                    </div>
                    
                    {/* Numeric Input */}
                    <div className="flex items-center space-x-2">
                        <input
                            ref={inputRef}
                            type="number"
                            min={minValue}
                            max={maxValue}
                            value={rangeValue}
                            onChange={handleRangeChange}
                            onFocus={handleFocus}
                            onBlur={handleBlur}
                            className={`w-20 px-3 py-2 border rounded-md text-sm font-medium text-gray-700 ${getInputBorderColor()} ${getInputFocusColor()} transition-colors`}
                            placeholder={minValue.toString()}
                        />
                        <span className="text-sm font-medium text-gray-700">
                            {appendText}
                        </span>
                    </div>
                </div>

                {/* Validation Message */}
                {showValidation && (
                    <div className="flex items-center space-x-2">
                        {getValidationIcon()}
                        <span className={`text-sm ${getValidationColor()}`}>
                            {getValidationMessage()}
                        </span>
                    </div>
                )}

                {/* Clear Button */}
                {rangeValue && (
                    <button
                        type="button"
                        onClick={handleClear}
                        className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                    >
                        Reset to default
                    </button>
                )}
            </div>
        </div>
    );
};

export default RangeField; 