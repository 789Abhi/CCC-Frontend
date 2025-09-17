import React, { useState, useEffect, useRef } from 'react';
import { Eye, EyeOff, Lock, AlertCircle } from 'lucide-react';

const PasswordField = ({ label, fieldName, fieldConfig, fieldValue, fieldRequired, onChange, fieldId }) => {
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const [isInitializing, setIsInitializing] = useState(true);
    const [showValidation, setShowValidation] = useState(false);
    const [strength, setStrength] = useState({ score: 0, text: '', color: '' });
    const inputRef = useRef(null);

    useEffect(() => {
        if (fieldValue) {
            try {
                const parsedValue = typeof fieldValue === 'string' ? fieldValue : JSON.stringify(fieldValue);
                setPassword(parsedValue);
                calculateStrength(parsedValue);
            } catch (error) {
                console.error('Error parsing password field value:', error);
            }
        }
        
        const timer = setTimeout(() => {
            setIsInitializing(false);
        }, 100);
        
        return () => clearTimeout(timer);
    }, [fieldValue]);

    const calculateStrength = (pwd) => {
        if (!pwd) {
            setStrength({ score: 0, text: '', color: '' });
            return;
        }

        let score = 0;
        let feedback = [];

        // Length check
        if (pwd.length >= 8) score += 1;
        else feedback.push('at least 8 characters');

        // Lowercase check
        if (/[a-z]/.test(pwd)) score += 1;
        else feedback.push('lowercase letter');

        // Uppercase check
        if (/[A-Z]/.test(pwd)) score += 1;
        else feedback.push('uppercase letter');

        // Number check
        if (/\d/.test(pwd)) score += 1;
        else feedback.push('number');

        // Special character check
        if (/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) score += 1;
        else feedback.push('special character');

        let strengthText = '';
        let strengthColor = '';

        switch (score) {
            case 0:
            case 1:
                strengthText = 'Very Weak';
                strengthColor = 'text-red-600';
                break;
            case 2:
                strengthText = 'Weak';
                strengthColor = 'text-orange-600';
                break;
            case 3:
                strengthText = 'Fair';
                strengthColor = 'text-yellow-600';
                break;
            case 4:
                strengthText = 'Good';
                strengthColor = 'text-blue-600';
                break;
            case 5:
                strengthText = 'Strong';
                strengthColor = 'text-green-600';
                break;
            default:
                strengthText = '';
                strengthColor = '';
        }

        setStrength({ 
            score, 
            text: strengthText, 
            color: strengthColor,
            feedback: feedback.length > 0 ? `Add: ${feedback.join(', ')}` : 'Strong password!'
        });
    };

    const handlePasswordChange = (e) => {
        const newPassword = e.target.value;
        setPassword(newPassword);
        
        calculateStrength(newPassword);
        
        if (newPassword && !showValidation) {
            setShowValidation(true);
        }
        
        if (!isInitializing) {
            onChange(newPassword);
        }
    };

    const handleFocus = () => {
        setIsFocused(true);
        if (password) {
            setShowValidation(true);
        }
    };

    const handleBlur = () => {
        setIsFocused(false);
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
        // Keep focus on input after toggling
        setTimeout(() => {
            inputRef.current?.focus();
        }, 0);
    };

    const handleClear = () => {
        setPassword('');
        setStrength({ score: 0, text: '', color: '' });
        setShowValidation(false);
        if (!isInitializing) {
            onChange('');
        }
        inputRef.current?.focus();
    };

    const getInputBorderColor = () => {
        if (fieldRequired && !password) return 'border-red-500';
        if (!showValidation) return 'border-gray-300';
        
        switch (strength.score) {
            case 0:
            case 1:
                return 'border-red-500';
            case 2:
                return 'border-orange-500';
            case 3:
                return 'border-yellow-500';
            case 4:
                return 'border-blue-500';
            case 5:
                return 'border-green-500';
            default:
                return 'border-gray-300';
        }
    };

    const getInputFocusColor = () => {
        if (fieldRequired && !password) return 'focus:border-red-500 focus:ring-red-500';
        if (!showValidation) return 'focus:border-blue-500 focus:ring-blue-500';
        
        switch (strength.score) {
            case 0:
            case 1:
                return 'focus:border-red-500 focus:ring-red-500';
            case 2:
                return 'focus:border-orange-500 focus:ring-orange-500';
            case 3:
                return 'focus:border-yellow-500 focus:ring-yellow-500';
            case 4:
                return 'focus:border-blue-500 focus:ring-blue-500';
            case 5:
                return 'focus:border-green-500 focus:ring-green-500';
            default:
                return 'focus:border-blue-500 focus:ring-blue-500';
        }
    };

    const getStrengthBarColor = () => {
        switch (strength.score) {
            case 0:
            case 1:
                return 'bg-red-500';
            case 2:
                return 'bg-orange-500';
            case 3:
                return 'bg-yellow-500';
            case 4:
                return 'bg-blue-500';
            case 5:
                return 'bg-green-500';
            default:
                return 'bg-gray-300';
        }
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
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={handlePasswordChange}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    placeholder={fieldConfig?.placeholder || "Enter password"}
                    className={`
                        w-full pl-10 pr-20 py-3 border-2 rounded-lg text-gray-900 placeholder-gray-500 cursor-text
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
                        <>
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
                            
                            <button
                                type="button"
                                onClick={togglePasswordVisibility}
                                className="text-gray-400 hover:text-gray-600 transition-colors duration-200 focus:outline-none focus:text-gray-600"
                                title={showPassword ? 'Hide password' : 'Show password'}
                            >
                                {showPassword ? (
                                    <EyeOff size={20} />
                                ) : (
                                    <Eye size={20} />
                                )}
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Password Strength Indicator */}
            {showValidation && password && (
                <div className="mt-3 space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Password strength:</span>
                        <span className={`text-sm font-medium ${strength.color}`}>
                            {strength.text}
                        </span>
                    </div>
                    
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                            className={`h-2 rounded-full transition-all duration-300 ${getStrengthBarColor()}`}
                            style={{ width: `${(strength.score / 5) * 100}%` }}
                        ></div>
                    </div>
                    
                    {strength.score < 5 && (
                        <div className="flex items-start gap-2 text-sm text-gray-600">
                            <AlertCircle size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
                            <span>{strength.feedback}</span>
                        </div>
                    )}
                </div>
            )}

            {/* Validation Messages */}
            {showValidation && (
                <div className="mt-2 space-y-1">
                    {fieldRequired && !password && (
                        <div className="flex items-center gap-2 text-red-600 text-sm animate-in slide-in-from-top-2 duration-300">
                            <AlertCircle size={16} />
                            <span>Password is required</span>
                        </div>
                    )}
                </div>
            )}

            <div className="mt-2 text-xs text-gray-500">
                {fieldConfig?.description && (
                    <p className="text-gray-600 mb-1">{fieldConfig.description}</p>
                )}
                <p>Use a combination of letters, numbers, and special characters for better security</p>
            </div>
        </div>
    );
};

export default PasswordField;
