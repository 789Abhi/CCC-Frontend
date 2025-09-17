import React, { useState, useEffect, useRef } from 'react';
import { Lock, AlertCircle } from 'lucide-react';

const PasswordField = ({ label, fieldName, fieldConfig, fieldValue, fieldRequired, onChange, fieldId }) => {
    const [password, setPassword] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    const [isInitializing, setIsInitializing] = useState(true);
    const inputRef = useRef(null);

    useEffect(() => {
        if (fieldValue) {
            try {
                const parsedValue = typeof fieldValue === 'string' ? fieldValue : JSON.stringify(fieldValue);
                setPassword(parsedValue);
            } catch (error) {
                console.error('Error parsing password field value:', error);
            }
        }
        
        const timer = setTimeout(() => {
            setIsInitializing(false);
        }, 100);
        
        return () => clearTimeout(timer);
    }, [fieldValue]);

    const handlePasswordChange = (e) => {
        const newPassword = e.target.value;
        setPassword(newPassword);
        
        if (!isInitializing) {
            onChange(newPassword);
        }
    };

    const handleFocus = () => {
        setIsFocused(true);
    };

    const handleBlur = () => {
        setIsFocused(false);
    };

    const handleClear = () => {
        setPassword('');
        if (!isInitializing) {
            onChange('');
        }
        inputRef.current?.focus();
    };

    const getInputBorderColor = () => {
        if (fieldRequired && !password) return 'border-red-500';
        return 'border-gray-300';
    };

    const getInputFocusColor = () => {
        if (fieldRequired && !password) return 'focus:border-red-500 focus:ring-red-500';
        return 'focus:border-blue-500 focus:ring-blue-500';
    };

    return (
        <div className="w-full ccc-field" data-field-id={fieldId}>
            <label htmlFor={`password-${fieldName}`} className="block text-sm font-medium text-gray-700 mb-2">
                {label || 'Password'}
                {fieldRequired && <span className="text-red-500 ml-1">*</span>}
            </label>
            
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock size={18} className="text-gray-400" />
                </div>
                
                <input
                    ref={inputRef}
                    id={`password-${fieldName}`}
                    type="password"
                    value={password}
                    onChange={handlePasswordChange}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    placeholder={fieldConfig?.placeholder || "Enter password"}
                    className={`
                        w-full pl-10 pr-12 py-3 border-2 rounded-lg text-gray-900 placeholder-gray-500 cursor-text
                        transition-all duration-200 ease-in-out
                        ${getInputBorderColor()}
                        ${getInputFocusColor()}
                        focus:outline-none focus:ring-2 focus:ring-opacity-50
                        ${fieldRequired && !password ? 'ring-2 ring-red-500 ring-opacity-50' : ''}
                        ${isFocused ? 'shadow-lg shadow-blue-500/20' : 'shadow-sm'}
                    `}
                    required={fieldRequired}
                    autoComplete="new-password"
                />
                
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center gap-2">
                    {password && (
                        <button
                            type="button"
                            onClick={handleClear}
                            className="group"
                            title="Clear password"
                        >
                            <div className="w-5 h-5 rounded-full bg-gray-200 group-hover:bg-gray-300 flex items-center justify-center transition-colors duration-200">
                                <span className="text-gray-500 text-xs font-bold">×</span>
                            </div>
                        </button>
                    )}
                </div>
            </div>

            {/* Validation Messages */}
            {fieldRequired && !password && (
                <div className="mt-2">
                    <div className="flex items-center gap-2 text-red-600 text-sm">
                        <AlertCircle size={16} />
                        <span>Password is required</span>
                    </div>
                </div>
            )}

            {fieldConfig?.description && (
                <div className="mt-2 text-xs text-gray-600">
                    <p>{fieldConfig.description}</p>
                </div>
            )}
        </div>
    );
};

export default PasswordField;
