import { useState, useEffect, useRef } from 'react';

export const useArduinoSim = (components, wires, isRunning, isButtonPressed) => {
  const [pinStates, setPinStates] = useState({});
  const [isLedOn, setIsLedOn] = useState(false); // Track if LED is ON
  const prevBtn = useRef(false); // Track previous button state to detect "click"

  useEffect(() => {
    // 1. Reset everything if simulation stops
    if (!isRunning) {
      setIsLedOn(false);
      setPinStates({});
      prevBtn.current = false;
      return;
    }

    // 2. TOGGLE LOGIC: Detect Click (Rising Edge)
    // If button is PRESSED now (true) but was RELEASED before (false)
    if (isButtonPressed && !prevBtn.current) {
      setIsLedOn(prev => !prev); // Toggle ON/OFF
    }
    prevBtn.current = isButtonPressed; // Save state for next loop

    // 3. Find ANY LED and force it to match our state
    const led = components.find(c => c.type === 'LED');
    
    if (led) {
      // Create state object: { "2": 1 } or { "2": 0 }
      // This forces the LED component (at pin 2 or whatever) to light up
      setPinStates({
        [led.properties.pin]: isLedOn ? 1 : 0
      });
    }

  }, [isRunning, isButtonPressed, components, isLedOn]);

  return pinStates;
};