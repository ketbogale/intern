import { useEffect, useRef } from 'react';

const BarcodeScanner = ({ onScan, isEnabled = true, minLength = 3, maxLength = 20, timeout = 300 }) => {
  const scanBuffer = useRef('');
  const scanTimeout = useRef(null);
  const lastScanTime = useRef(0);
  const keystrokeCount = useRef(0);
  const scanStartTime = useRef(0);

  useEffect(() => {
    if (!isEnabled) return;

    const handleKeyPress = (event) => {
      const currentTime = Date.now();
      const timeDiff = currentTime - lastScanTime.current;

      // If too much time has passed, reset everything (indicates manual typing)
      if (timeDiff > 200) {
        scanBuffer.current = '';
        keystrokeCount.current = 0;
        scanStartTime.current = currentTime;
      }

      lastScanTime.current = currentTime;

      // Handle regular characters (alphanumeric)
      if (event.key.length === 1 && /[a-zA-Z0-9]/.test(event.key)) {
        // If this is the first character, record scan start time
        if (scanBuffer.current.length === 0) {
          scanStartTime.current = currentTime;
          keystrokeCount.current = 0;
        }

        // Add character to buffer
        scanBuffer.current += event.key;
        keystrokeCount.current++;

        // Clear any existing timeout
        if (scanTimeout.current) {
          clearTimeout(scanTimeout.current);
        }

        // Set timeout to process the scan automatically
        scanTimeout.current = setTimeout(() => {
          const scannedCode = scanBuffer.current.trim();
          const scanDuration = currentTime - scanStartTime.current;
          const avgKeystrokeSpeed = scanDuration / keystrokeCount.current;

          // Check if this looks like a barcode scan:
          // 1. Length is within expected range
          // 2. Fast typing speed (< 50ms per character indicates scanner)
          // 3. Consistent rapid input
          if (scannedCode.length >= minLength && 
              scannedCode.length <= maxLength && 
              avgKeystrokeSpeed < 50 && 
              keystrokeCount.current >= minLength) {
            
            // Valid barcode detected
            if (onScan) {
              onScan(scannedCode);
            }
          }

          // Reset buffer after processing
          scanBuffer.current = '';
          keystrokeCount.current = 0;
        }, timeout);

        // Auto-process if buffer gets to expected barcode length and typing is fast
        if (scanBuffer.current.length >= minLength) {
          const scanDuration = currentTime - scanStartTime.current;
          const avgKeystrokeSpeed = scanDuration / keystrokeCount.current;
          
          // If typing is very fast (typical of barcode scanners), process immediately
          if (avgKeystrokeSpeed < 30) {
            if (scanTimeout.current) {
              clearTimeout(scanTimeout.current);
            }
            
            const scannedCode = scanBuffer.current.trim();
            if (scannedCode.length >= minLength && scannedCode.length <= maxLength) {
              if (onScan) {
                onScan(scannedCode);
              }
            }
            
            // Reset buffer after processing
            scanBuffer.current = '';
            keystrokeCount.current = 0;
          }
        }

        // Safety measure: clear if buffer gets too long
        if (scanBuffer.current.length > maxLength) {
          scanBuffer.current = '';
          keystrokeCount.current = 0;
        }
      }

      // Handle Enter key (some scanners still send this)
      if (event.key === 'Enter' && scanBuffer.current.length > 0) {
        event.preventDefault();
        
        if (scanTimeout.current) {
          clearTimeout(scanTimeout.current);
        }
        
        const scannedCode = scanBuffer.current.trim();
        if (scannedCode.length >= minLength && scannedCode.length <= maxLength) {
          if (onScan) {
            onScan(scannedCode);
          }
        }
        
        // Reset buffer after processing
        scanBuffer.current = '';
        keystrokeCount.current = 0;
        return;
      }

      // Handle Backspace/Delete during scanning
      if (event.key === 'Backspace' || event.key === 'Delete') {
        if (scanBuffer.current.length > 0) {
          scanBuffer.current = scanBuffer.current.slice(0, -1);
          keystrokeCount.current = Math.max(0, keystrokeCount.current - 1);
        }
      }

      // Handle Escape to clear buffer
      if (event.key === 'Escape') {
        scanBuffer.current = '';
        keystrokeCount.current = 0;
        if (scanTimeout.current) {
          clearTimeout(scanTimeout.current);
        }
      }
    };

    // Add global event listener
    document.addEventListener('keydown', handleKeyPress);

    // Cleanup function
    return () => {
      document.removeEventListener('keydown', handleKeyPress);
      if (scanTimeout.current) {
        clearTimeout(scanTimeout.current);
      }
    };
  }, [isEnabled, onScan, minLength, maxLength, timeout]);

  // This component doesn't render anything visible
  return null;
};

export default BarcodeScanner;
