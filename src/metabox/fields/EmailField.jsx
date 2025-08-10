import React, { useState, useEffect, useRef } from 'react';
import { Mail, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';

const EmailField = ({ fieldName, fieldConfig, fieldValue, fieldRequired, onChange }) => {
    const [email, setEmail] = useState('');
    const [isValid, setIsValid] = useState(true);
    const [isFocused, setIsFocused] = useState(false);
    const [showValidation, setShowValidation] = useState(false);
    const [isInitializing, setIsInitializing] = useState(true);
    const inputRef = useRef(null);

    // Email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    useEffect(() => {
        // Initialize with saved value
        if (fieldValue) {
            try {
                const parsedValue = typeof fieldValue === 'string' ? fieldValue : JSON.stringify(fieldValue);
                setEmail(parsedValue);
                setIsValid(emailRegex.test(parsedValue));
            } catch (error) {
                console.error('Error parsing email field value:', error);
            }
        }
        
        // Set initialization complete after a short delay
        const timer = setTimeout(() => {
            setIsInitializing(false);
        }, 100);
        
        return () => clearTimeout(timer);
    }, [fieldValue]);

    const validateEmail = (emailValue) => {
        if (!emailValue) return true; // Empty is valid (unless required)
        return emailRegex.test(emailValue);
    };

    const handleEmailChange = (e) => {
        const newEmail = e.target.value;
        setEmail(newEmail);
        
        const valid = validateEmail(newEmail);
        setIsValid(valid);
        
        // Show validation after user starts typing
        if (newEmail && !showValidation) {
            setShowValidation(true);
        }
        
        // Don't call onChange during initialization
        if (!isInitializing) {
            onChange(newEmail);
        }
    };

    const handleFocus = () => {
        setIsFocused(true);
        setShowValidation(true);
    };

    const handleBlur = () => {
        setIsFocused(false);
        // Keep validation visible after blur
    };

    const handleClear = () => {
        setEmail('');
        setIsValid(true);
        setShowValidation(false);
        if (!isInitializing) {
            onChange('');
        }
        inputRef.current?.focus();
    };

    const getInputBorderColor = () => {
        if (!showValidation) return 'border-gray-300';
        if (isValid) return 'border-green-500';
        return 'border-red-500';
    };

    const getInputFocusColor = () => {
        if (!showValidation) return 'focus:border-blue-500 focus:ring-blue-500';
        if (isValid) return 'focus:border-green-500 focus:ring-green-500';
        return 'focus:border-red-500 focus:ring-red-500';
    };

    return (
        <div className="w-full">
            {/* Email Input Field */}
            <div className="relative">
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail 
                            size={20} 
                            className={`transition-colors duration-200 ${
                                isFocused ? 'text-blue-500' : 'text-gray-400'
                            }`} 
                        />
                    </div>
                    
                    <input
                        ref={inputRef}
                        type="email"
                        value={email}
                        onChange={handleEmailChange}
                        onFocus={handleFocus}
                        onBlur={handleBlur}
                        placeholder={fieldConfig?.placeholder || "Enter email address"}
                        className={`
                            w-full pl-10 pr-12 py-3 border-2 rounded-lg text-gray-900 placeholder-gray-500
                            transition-all duration-200 ease-in-out
                            ${getInputBorderColor()}
                            ${getInputFocusColor()}
                            focus:outline-none focus:ring-2 focus:ring-opacity-50
                            ${fieldRequired && !email ? 'ring-2 ring-red-500 ring-opacity-50' : ''}
                            ${isFocused ? 'shadow-lg shadow-blue-500/20' : 'shadow-sm'}
                        `}
                        required={fieldRequired}
                    />
                    
                    {/* Clear Button */}
                    {email && (
                        <button
                            type="button"
                            onClick={handleClear}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center group"
                        >
                            <div className="w-5 h-5 rounded-full bg-gray-200 group-hover:bg-gray-300 flex items-center justify-center transition-colors duration-200">
                                <span className="text-gray-500 text-xs font-bold">×</span>
                            </div>
                        </button>
                    )}
                </div>

                {/* Validation Status Icon */}
                {showValidation && email && (
                    <div className="absolute inset-y-0 right-0 pr-12 flex items-center">
                        {isValid ? (
                            <CheckCircle size={20} className="text-green-500 animate-pulse" />
                        ) : (
                            <AlertCircle size={20} className="text-red-500 animate-pulse" />
                        )}
                    </div>
                )}
            </div>

            {/* Validation Messages */}
            {showValidation && (
                <div className="mt-2 space-y-1">
                                                {!isValid && email && (
                                <div className="flex items-center gap-2 text-red-600 text-sm animate-in slide-in-from-top-2 duration-300">
                                    <AlertCircle size={16} />
                                    <span>Please enter a valid email address</span>
                                </div>
                            )}
                            
                            {fieldRequired && !email && (
                                <div className="flex items-center gap-2 text-red-600 text-sm animate-in slide-in-from-top-2 duration-300">
                                    <AlertCircle size={16} />
                                    <span>Email address is required</span>
                                </div>
                            )}
                            
                            {isValid && email && (
                                <div className="flex items-center gap-2 text-green-600 text-sm animate-in slide-in-from-top-2 duration-300">
                                    <CheckCircle size={16} />
                                    <span>Valid email address</span>
                                </div>
                            )}
                </div>
            )}

            {/* Field Info */}
            <div className="mt-2 text-xs text-gray-500">
                {fieldConfig?.description && (
                    <p className="text-gray-600">{fieldConfig.description}</p>
                )}
                <p>Enter a valid email address (e.g., user@example.com)</p>
            </div>
        </div>
    );
};

export default EmailField; 