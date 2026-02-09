export const ARDUINO_PIN_MAP = {
  'D0': { x: 260, y: 15 }, 'D1': { x: 250, y: 15 }, 'D2': { x: 240, y: 15 },
  'D3': { x: 230, y: 15 }, 'D4': { x: 220, y: 15 }, 'D5': { x: 210, y: 15 },
  'D6': { x: 200, y: 15 }, 'D7': { x: 190, y: 15 }, 'D8': { x: 174, y: 15 },
  'D9': { x: 164, y: 15 }, 'D10': { x: 154, y: 15 }, 'D11': { x: 144, y: 15 },
  'D12': { x: 134, y: 15 }, 'D13': { x: 124, y: 15 }, 'GND': { x: 104, y: 15 },
  'AREF': { x: 90, y: 15 }, 'SDA': { x: 76, y: 15 }, 'SCL': { x: 66, y: 15 },

  // Power Header (Bottom)
  'A0': { x: 192, y: 140 }, 'A1': { x: 202, y: 140 }, 'A2': { x: 212, y: 140 },
  'A3': { x: 222, y: 140 }, 'A4': { x: 232, y: 140 }, 'A5': { x: 242, y: 140 },
  'VIN': { x: 110, y: 140 }, 'GND_A': { x: 95, y: 140 }, 'GND_A2': { x: 80, y: 140 },
  '5V': { x: 65, y: 140 }, '3.3V': { x: 50, y: 140 }, 'RESET': { x: 35, y: 140 },
  'IOREF': { x: 20, y: 140 }
};

export const getWireEndpoint = (point, components) => {
  const comp = components.find(c => c.id === point.compId);
  if (!comp) return { x: 0, y: 0 };

  let relX = 0, relY = 0;

  switch (point.type) {
    case 'ARDUINO':
      const pin = ARDUINO_PIN_MAP[point.pin];
      if (pin) { relX = pin.x; relY = pin.y; }
      break;
      
    case 'BREADBOARD':
      relX = 25 + point.col * 8.5;
      
      if (point.row === 'top') {
        relY = [45, 55, 65, 75][point.rowIndex];
      } else if (point.row === 'bottom') {
        relY = [105, 115, 125, 135][point.rowIndex];
      } else if (point.row === 'power-top') {
        relY = point.rowIndex === 0 ? 15 : 25;
      } else if (point.row === 'power-bottom') {
        relY = point.rowIndex === 0 ? 155 : 165;
      }
      break;

    case 'LED':
      if (point.pin === 'anode') { relX = 25; relY = 28; } else { relX = 8; relY = 28; }
      break;
    case 'RESISTOR':
      // Adjusted positions for alignment
      if (point.pin === 'left') { relX = 0; relY = 10; } else { relX = 60; relY = 10; }
      break;
      
    case 'BUTTON':
      // FIX: Distinct coordinates for all 4 corners
      if (point.pin === 'tl') { relX = 5; relY = 5; }         // Top-Left
      else if (point.pin === 'tr') { relX = 35; relY = 5; }   // Top-Right
      else if (point.pin === 'bl') { relX = 5; relY = 35; }   // Bottom-Left
      else if (point.pin === 'br') { relX = 35; relY = 35; }  // Bottom-Right
      else { relX = 5; relY = 5; }
      break;
      
    default: break;
  }
  return { x: comp.x + relX, y: comp.y + relY };
};