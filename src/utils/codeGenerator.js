export const generateArduinoCode = (components, wires) => {
  // 1. CHECK: Is there an Arduino?
  const hasArduino = components.some(c => c.type === 'ARDUINO');

  if (!hasArduino) {
    return `// No Arduino Detected
// Drag and drop an Arduino Uno to start generating code.`;
  }

  // 2. DETECT CONNECTIONS based on Wires
  // We look for the specific wires connected to the Arduino
  const greenWire = wires.find(w => 
    w.color === '#22c55e' && 
    (w.from.type === 'ARDUINO' || w.to.type === 'ARDUINO')
  );
  
  const yellowWire = wires.find(w => 
    w.color === '#eab308' && 
    (w.from.type === 'ARDUINO' || w.to.type === 'ARDUINO')
  );

  // 3. BUILD CODE PROGRESSIVELY
  let code = `// Auto-Generated Arduino Code\n`;

  // --- VARIABLES SECTION ---
  if (greenWire) {
    const pin = greenWire.from.type === 'ARDUINO' ? greenWire.from.pin : greenWire.to.pin;
    code += `const int ledPin = ${pin.replace('D', '')};     // Green Wire (LED)\n`;
    code += `int ledState = LOW;\n`;
  }

  if (yellowWire) {
    const pin = yellowWire.from.type === 'ARDUINO' ? yellowWire.from.pin : yellowWire.to.pin;
    code += `const int buttonPin = ${pin.replace('D', '')};  // Yellow Wire (Button)\n`;
    code += `int lastButtonState = LOW;\n`;
    // Add debounce variables only if we have a button
    code += `unsigned long lastDebounceTime = 0;\n`;
    code += `unsigned long debounceDelay = 50;\n`;
  }
  code += `\n`;

  // --- SETUP SECTION ---
  code += `void setup() {\n`;
  
  if (greenWire) {
    code += `  pinMode(ledPin, OUTPUT);\n`;
    code += `  digitalWrite(ledPin, LOW); // Start OFF\n`;
  }
  
  if (yellowWire) {
    code += `  pinMode(buttonPin, INPUT_PULLUP);\n`;
  }
  
  if (!greenWire && !yellowWire) {
    code += `  // Add components (LED, Button) to see setup code...\n`;
  }
  
  code += `}\n\n`;

  // --- LOOP SECTION ---
  code += `void loop() {\n`;

  // SCENARIO 1: BOTH LED AND BUTTON (Full Toggle Logic)
  if (greenWire && yellowWire) {
    code += `  // Read the button\n`;
    code += `  int reading = digitalRead(buttonPin);\n\n`;
    code += `  // Detect Change (Debounce Logic)\n`;
    code += `  if (reading != lastButtonState) {\n`;
    code += `    lastDebounceTime = millis();\n`;
    code += `  }\n\n`;
    code += `  if ((millis() - lastDebounceTime) > debounceDelay) {\n`;
    code += `    // If button pressed (HIGH)\n`;
    code += `    if (reading == HIGH) {\n`;
    code += `       // Toggle LED State\n`;
    code += `       ledState = !ledState;\n`;
    code += `       digitalWrite(ledPin, ledState);\n`;
    code += `       delay(200); // Simple short press prevention\n`;
    code += `    }\n`;
    code += `  }\n`;
    code += `  lastButtonState = reading;\n`;
  } 
  // SCENARIO 2: ONLY BUTTON
  else if (yellowWire) {
    code += `  int reading = digitalRead(buttonPin);\n`;
    code += `  // Logic waiting for an Output component (like LED)...\n`;
  }
  // SCENARIO 3: ONLY LED
  else if (greenWire) {
    code += `  digitalWrite(ledPin, HIGH);   // Turn on\n`;
    code += `  delay(1000);                  // Wait\n`;
    code += `  digitalWrite(ledPin, LOW);    // Turn off\n`;
    code += `  delay(1000);                  // Wait\n`;
  }
  // SCENARIO 4: EMPTY ARDUINO
  else {
    code += `  // Add wires to generate logic!\n`;
  }

  code += `}`;

  return code;
};