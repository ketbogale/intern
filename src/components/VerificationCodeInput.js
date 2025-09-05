import React, { useState, useRef, useEffect } from 'react';
import './VerificationCodeInput.css';

const VerificationCodeInput = ({ 
  onComplete, 
  onCodeChange, 
  value = '', 
  disabled = false, 
  error = false,
  length = 6,
  showSubmitButton = false,
  submitButtonText = 'Create account',
  onSubmit
}) => {
  const [codes, setCodes] = useState(Array(length).fill(''));
  const inputRefs = useRef([]);

  // Initialize refs
  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, length);
  }, [length]);

  // Update codes when value prop changes
  useEffect(() => {
    if (value) {
      const newCodes = value.split('').slice(0, length);
      while (newCodes.length < length) {
        newCodes.push('');
      }
      setCodes(newCodes);
    } else {
      setCodes(Array(length).fill(''));
    }
  }, [value, length]);

  const handleChange = (index, newValue) => {
    // Only allow digits
    if (newValue && !/^\d$/.test(newValue)) return;

    const newCodes = [...codes];
    newCodes[index] = newValue;
    setCodes(newCodes);

    // Call onChange callback
    const fullCode = newCodes.join('');
    if (onCodeChange) {
      onCodeChange(fullCode);
    }

    // Auto-focus next input
    if (newValue && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Call onComplete if all fields are filled
    if (fullCode.length === length && onComplete) {
      onComplete(fullCode);
    }
  };

  const handleKeyDown = (index, e) => {
    // Handle backspace
    if (e.key === 'Backspace') {
      if (!codes[index] && index > 0) {
        // If current field is empty, move to previous field
        inputRefs.current[index - 1]?.focus();
      } else {
        // Clear current field
        handleChange(index, '');
      }
    }
    // Handle arrow keys
    else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
    // Handle paste
    else if (e.key === 'Enter') {
      e.preventDefault();
      const fullCode = codes.join('');
      if (fullCode.length === length && onComplete) {
        onComplete(fullCode);
      }
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text/plain');
    const digits = pastedData.replace(/\D/g, '').slice(0, length);
    
    if (digits) {
      const newCodes = Array(length).fill('');
      for (let i = 0; i < digits.length && i < length; i++) {
        newCodes[i] = digits[i];
      }
      setCodes(newCodes);
      
      const fullCode = newCodes.join('');
      if (onCodeChange) {
        onCodeChange(fullCode);
      }
      
      // Focus the next empty field or the last field
      const nextIndex = Math.min(digits.length, length - 1);
      inputRefs.current[nextIndex]?.focus();
      
      if (fullCode.length === length && onComplete) {
        onComplete(fullCode);
      }
    }
  };

  return (
    <div className="verification-code-container">
      <div className="verification-code-inputs">
        {codes.map((code, index) => (
          <input
            key={index}
            ref={(el) => (inputRefs.current[index] = el)}
            type="text"
            inputMode="numeric"
            value={code}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            disabled={disabled}
            className={`verification-code-input ${error ? 'error' : ''} ${disabled ? 'disabled' : ''}`}
            maxLength="1"
            autoComplete="off"
          />
        ))}
      </div>
      
      {showSubmitButton && (
        <button
          className="verification-submit-button"
          onClick={onSubmit}
          disabled={disabled || codes.join('').length !== length}
        >
          {submitButtonText}
        </button>
      )}
    </div>
  );
};

export default VerificationCodeInput;
