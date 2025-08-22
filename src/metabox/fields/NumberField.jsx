import React, { useState, useEffect, useRef } from 'react';
import { Hash, CheckCircle, AlertCircle, AlertTriangle } from 'lucide-react';

const NumberField = ({ label, fieldName, fieldConfig, fieldValue, fieldRequired, onChange }) => {
    const [number, setNumber] = useState('');
    const [isValid, setIsValid] = useState(true);
    const [isFocused, setIsFocused] = useState(false);
    const [showValidation, setShowValidation] = useState(false);
    const [isInitializing, setIsInitializing] = useState(true);
    const [isUnique, setIsUnique] = useState(true);
    const [isCheckingUniqueness, setIsCheckingUniqueness] = useState(false);
    const inputRef = useRef(null);

    const isUniqueRequired = fieldConfig?.unique === true;
    const minValue = fieldConfig?.min_value;
    const maxValue = fieldConfig?.max_value;
    const minLength = fieldConfig?.min_length;
    const maxLength = fieldConfig?.max_length;
    const prependText = fieldConfig?.prepend;
    const appendText = fieldConfig?.append;

    useEffect(() => {
        if (fieldValue) {
            try {
                const parsedValue = typeof fieldValue === 'string' ? fieldValue : JSON.stringify(fieldValue);
                setNumber(parsedValue);
                setIsValid(validateNumber(parsedValue));
            } catch (error) {
                console.error('Error parsing number field value:', error);
            }
        }
        
        const timer = setTimeout(() => {
            setIsInitializing(false);
        }, 100);
        
        return () => clearTimeout(timer);
    }, [fieldValue]);

    const validateNumber = (numberValue) => {
        if (!numberValue) return true;
        const num = parseFloat(numberValue);
        
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
        
        // Check character length constraints
        const valueStr = numberValue.toString();
        if (minLength !== null && minLength !== undefined && valueStr.length < minLength) {
            return false;
        }
        
        if (maxLength !== null && maxLength !== undefined && valueStr.length > maxLength) {
            return false;
        }
        
        return true;
    };

    const checkUniqueness = async (numberValue) => {
        if (!isUniqueRequired || !numberValue || !validateNumber(numberValue)) {
            setIsUnique(true);
            return;
        }

        setIsCheckingUniqueness(true);
        
        try {
            const response = await fetch(ajaxurl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    action: 'ccc_check_number_uniqueness',
                    number: numberValue,
                    field_id: fieldConfig?.field_id || 0,
                    post_id: fieldConfig?.post_id || 0,
                    nonce: ccc_ajax.nonce
                })
            });

            const data = await response.json();
            
            if (data.success) {
                setIsUnique(data.data.is_unique);
            } else {
                setIsUnique(true); // Assume unique on error
            }
        } catch (error) {
            console.error('Error checking number uniqueness:', error);
            setIsUnique(true); // Assume unique on error
        } finally {
            setIsCheckingUniqueness(false);
        }
    };

    const handleNumberChange = (e) => {
        const newNumber = e.target.value;
        setNumber(newNumber);
        
        const valid = validateNumber(newNumber);
        setIsValid(valid);
        
        if (newNumber && !showValidation) {
            setShowValidation(true);
        }
        
        if (!isInitializing) {
            onChange(newNumber);
            
            // Check uniqueness if required
            if (isUniqueRequired && valid) {
                // Debounce uniqueness check
                clearTimeout(inputRef.current.uniquenessTimer);
                inputRef.current.uniquenessTimer = setTimeout(() => {
                    checkUniqueness(newNumber);
                }, 500);
            }
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
        setNumber('');
        setIsValid(true);
        setIsUnique(true);
        setShowValidation(false);
        if (!isInitializing) {
            onChange('');
        }
        inputRef.current?.focus();
    };

    const getInputBorderColor = () => {
        if (!showValidation) return 'border-gray-300';
        if (!isValid) return 'border-red-500';
        if (isUniqueRequired && !isUnique) return 'border-orange-500';
        if (isValid) return 'border-green-500';
        return 'border-gray-300';
    };

    const getInputFocusColor = () => {
        if (!showValidation) return 'focus:border-blue-500 focus:ring-blue-500';
        if (!isValid) return 'focus:border-red-500 focus:ring-red-500';
        if (isUniqueRequired && !isUnique) return 'focus:border-orange-500 focus:ring-orange-500';
        if (isValid) return 'focus:border-green-500 focus:ring-green-500';
        return 'focus:border-blue-500 focus:ring-blue-500';
    };

    const getValidationIcon = () => {
        if (isCheckingUniqueness) {
            return <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>;
        }
        
        if (!isValid) {
            return <AlertCircle size={20} className="text-red-500" />;
        }
        
        if (isUniqueRequired && !isUnique) {
            return <AlertTriangle size={20} className="text-orange-500" />;
        }
        
        if (isValid) {
            return <CheckCircle size={20} className="text-green-500" />;
        }
        
        return null;
    };

    const getValidationMessage = () => {
        if (!isValid && number) {
            if (minValue !== null && minValue !== undefined && parseFloat(number) < minValue) {
                return `Number must be at least ${minValue}`;
            }
            if (maxValue !== null && maxValue !== undefined && parseFloat(number) > maxValue) {
                return `Number must be at most ${maxValue}`;
            }
            if (minLength !== null && minLength !== undefined && number.length < minLength) {
                return `Number must be at least ${minLength} characters long`;
            }
            if (maxLength !== null && maxLength !== undefined && number.length > maxLength) {
                return `Number must be no more than ${maxLength} characters long`;
            }
            return "Please enter a valid number";
        }
        
        if (isUniqueRequired && !isUnique && number) {
            return "This number is already in use. Please choose a different number.";
        }
        
        if (isValid && isUnique && number) {
            return "Valid number";
        }
        
        if (fieldRequired && !number) {
            return "Number is required";
        }
        
        return null;
    };

    const getValidationColor = () => {
        if (!isValid) return 'text-red-600';
        if (isUniqueRequired && !isUnique) return 'text-orange-600';
        if (isValid && isUnique) return 'text-green-600';
        return 'text-red-600';
    };

    const getValidationIconColor = () => {
        if (!isValid) return 'text-red-600';
        if (isUniqueRequired && !isUnique) return 'text-orange-600';
        if (isValid && isUnique) return 'text-green-600';
        return 'text-red-600';
    };

    return (
        <div className="w-full">
            <label htmlFor={`number-${fieldName}`} className="block text-sm font-medium text-gray-700 mb-2">
                {label || 'Number'}
                {fieldRequired && <span className="text-red-500 ml-1">*</span>}
                {isUniqueRequired && <span className="text-blue-500 ml-1">(Unique)</span>}
            </label>
            
            <div className="relative">
                {(prependText || appendText) && (
                    <div className="flex items-center">
                        {prependText && (
                            <span className="inline-flex items-center px-3 py-3 text-sm text-gray-500 bg-gray-50 border border-r-0 border-gray-300 rounded-l-lg">
                                {prependText}
                            </span>
                        )}
                        <div className="flex-1 relative">
                            <input
                                ref={inputRef}
                                id={`number-${fieldName}`}
                                type="number"
                                value={number}
                                onChange={handleNumberChange}
                                onFocus={handleFocus}
                                onBlur={handleBlur}
                                placeholder={fieldConfig?.placeholder || "Enter a number"}
                                maxLength={maxLength || undefined}
                                className={`
                                    w-full ${prependText ? 'rounded-l-none' : 'rounded-l-lg'} ${appendText ? 'rounded-r-none' : 'rounded-r-lg'} py-3 border-2 text-gray-900 placeholder-gray-500
                                    transition-all duration-200 ease-in-out
                                    ${getInputBorderColor()}
                                    ${getInputFocusColor()}
                                    focus:outline-none focus:ring-2 focus:ring-opacity-50
                                    ${fieldRequired && !number ? 'ring-2 ring-red-500 ring-opacity-50' : ''}
                                    ${isFocused ? 'shadow-lg shadow-blue-500/20' : 'shadow-sm'}
                                `}
                                required={fieldRequired}
                            />
                            
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center gap-2">
                                {number && (
                                    <button
                                        type="button"
                                        onClick={handleClear}
                                        className="group"
                                    >
                                        <div className="w-5 h-5 rounded-full bg-gray-200 group-hover:bg-gray-300 flex items-center justify-center transition-colors duration-200">
                                            <span className="text-gray-500 text-xs font-bold">×</span>
                                        </div>
                                    </button>
                                )}
                                
                                {showValidation && getValidationIcon()}
                            </div>
                        </div>
                        {appendText && (
                            <span className="inline-flex items-center px-3 py-3 text-sm text-gray-500 bg-gray-50 border border-l-0 border-gray-300 rounded-r-lg">
                                {appendText}
                            </span>
                        )}
                    </div>
                )}
                
                {!prependText && !appendText && (
                    <div className="relative">
                        <input
                            ref={inputRef}
                            id={`number-${fieldName}`}
                            type="number"
                            value={number}
                            onChange={handleNumberChange}
                            onFocus={handleFocus}
                            onBlur={handleBlur}
                            placeholder={fieldConfig?.placeholder || "Enter a number"}
                            maxLength={maxLength || undefined}
                            className={`
                                w-full pl-4 pr-12 py-3 border-2 rounded-lg text-gray-900 placeholder-gray-500
                                transition-all duration-200 ease-in-out
                                ${getInputBorderColor()}
                                ${getInputFocusColor()}
                                focus:outline-none focus:ring-2 focus:ring-opacity-50
                                ${fieldRequired && !number ? 'ring-2 ring-red-500 ring-opacity-50' : ''}
                                ${isFocused ? 'shadow-lg shadow-blue-500/20' : 'shadow-sm'}
                            `}
                            required={fieldRequired}
                        />
                        
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center gap-2">
                            {number && (
                                <button
                                    type="button"
                                    onClick={handleClear}
                                    className="group"
                                >
                                    <div className="w-5 h-5 rounded-full bg-gray-200 group-hover:bg-gray-300 flex items-center justify-center transition-colors duration-200">
                                        <span className="text-gray-500 text-xs font-bold">×</span>
                                    </div>
                                </button>
                            )}
                            
                            {showValidation && getValidationIcon()}
                        </div>
                    </div>
                )}
            </div>

            {showValidation && (
                <div className="mt-2 space-y-1">
                    {getValidationMessage() && (
                        <div className={`flex items-center gap-2 text-sm animate-in slide-in-from-top-2 duration-300 ${getValidationColor()}`}>
                            {getValidationIcon() && React.cloneElement(getValidationIcon(), { 
                                size: 16,
                                className: getValidationIconColor()
                            })}
                            <span>{getValidationMessage()}</span>
                        </div>
                    )}
                </div>
            )}

            <div className="mt-2 text-xs text-gray-500">
                {fieldConfig?.description && (
                    <p className="text-gray-600">{fieldConfig.description}</p>
                )}
                <p>Enter a valid number{isUniqueRequired ? ' (must be unique)' : ''}</p>
                {minValue !== null && minValue !== undefined && (
                    <p>Minimum value: {minValue}</p>
                )}
                {maxValue !== null && maxValue !== undefined && (
                    <p>Maximum value: {maxValue}</p>
                )}
                {minLength !== null && minLength !== undefined && (
                    <p>Minimum characters: {minLength}</p>
                )}
                {maxLength !== null && maxLength !== undefined && (
                    <p>Maximum characters: {maxLength}</p>
                )}
            </div>
        </div>
    );
};

export default NumberField; 