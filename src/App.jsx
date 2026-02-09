import React, { useState } from 'react';
import { Canvas } from './components/Canvas';
import { useArduinoSim } from './hooks/useArduinoSim';
import { generateArduinoCode } from './utils/codeGenerator';
import { ARDUINO_PIN_MAP, getWireEndpoint } from './utils/coordinates';
import { 
  Cpu, Code, Layout, Settings, RotateCcw, Lightbulb, Zap, 
  Square, Trash2, Moon, Sun, ChevronDown, ChevronRight, 
  Info, MousePointerClick, ToggleLeft, Activity 
} from 'lucide-react';

const INITIAL_COMPONENTS = [{ id: 'bb-1', type: 'BREADBOARD', x: 200, y: 50, properties: {} }];

export default function App() {
  const [theme, setTheme] = useState('light');
  const [isRunning, setIsRunning] = useState(false);
  const [btnState, setBtnState] = useState(false); 
  const [viewMode, setViewMode] = useState('component'); 
  
  // Sidebar State: Manage which sections are open
  const [expanded, setExpanded] = useState({
    controllers: true,
    outputs: true,
    inputs: true,
    passives: true
  });

  const toggleSection = (section) => {
    setExpanded(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const [components, setComponents] = useState(INITIAL_COMPONENTS);
  const [wires, setWires] = useState([]); 
  const [drawingWire, setDrawingWire] = useState(null); 
  const [selectedId, setSelectedId] = useState(null);
  const [selectedWireId, setSelectedWireId] = useState(null);

  const pinStates = useArduinoSim(components, wires, isRunning, btnState);

  const handleMouseUp = () => setBtnState(false);

  // --- FULL RESET FUNCTION ---
  const handleReset = () => {
    setIsRunning(false);
    setComponents(INITIAL_COMPONENTS);
    setWires([]);
    setBtnState(false);
    setSelectedId(null);
    setSelectedWireId(null);
    setDrawingWire(null);
  };

  const getHint = () => {
    const hasArduino = components.some(c => c.type === 'ARDUINO');
    const hasLed = components.some(c => c.type === 'LED');
    const hasResistor = components.some(c => c.type === 'RESISTOR');
    const hasButton = components.some(c => c.type === 'BUTTON');

    if (!hasArduino) return "👇 Step 1: Drag and drop an **Arduino Uno** from the library.";
    if (!hasLed) return "👇 Step 2: Drag and drop an **LED** (pick any color).";
    if (!hasResistor) return "👇 Step 3: Add a **Resistor** to protect the LED.";
    if (!hasButton) return "👇 Step 4: Add a **Push Button** to control the LED.";
    return "✅ **Circuit Ready!** Click the **Start** button to test it.";
  };

  const hintMessage = getHint();

  const handleTargetClick = (conn) => {
    if (isRunning) return; 
    if (drawingWire) { setWires(p => [...p, { id: Date.now(), from: drawingWire, to: conn, color: '#22c55e' }]); setDrawingWire(null); } 
    else setDrawingWire(conn);
  };

  const updateWirePin = (wireId, endpoint, newPin) => {
    setWires(prev => prev.map(w => w.id === wireId ? { ...w, [endpoint]: { ...w[endpoint], pin: newPin } } : w));
  };

  const handleDragStart = (e, type, color=null) => {
    e.dataTransfer.setData('type', type);
    if(color) e.dataTransfer.setData('color', color);
  };

  const handleCanvasDrop = (e) => {
    e.preventDefault();
    if (isRunning) return; 

    const type = e.dataTransfer.getData('type');
    const color = e.dataTransfer.getData('color');
    const newId = `${type}-${Date.now()}`;
    let x = e.nativeEvent.offsetX;
    let y = e.nativeEvent.offsetY;

    if (type === 'LED') {
      const greenWire = wires.find(w => w.from.pin === 'D10' && w.to.type === 'BREADBOARD');
      if (greenWire) {
        const targetCol = greenWire.to.col; 
        x = 200 + 25 + (targetCol * 8.5) - 14; 
        y = 50 + 95 - 28; 
      }
    }
    if (type === 'RESISTOR') {
      const greenWire = wires.find(w => w.from.pin === 'D10' && w.to.type === 'BREADBOARD');
      if (greenWire) {
        const targetCol = greenWire.to.col; 
        x = 200 + 25 + (targetCol * 8.5) + 6; 
        y = 50 + 95 + 9; 
      }
    }
    if (type === 'BUTTON') {
      const bb = components.find(c => c.type === 'BREADBOARD');
      if (bb) {
         setTimeout(() => { 
            setWires(p => [
               ...p,
               { id: `btn-res-${Date.now()}`, from: { compId: newId, type: 'BUTTON', pin: 'bl' }, to: { compId: bb.id, type: 'BREADBOARD', col: 17, row: 'bottom', rowIndex: 0 }, color: '#22c55e' },
               { id: `btn-sig-${Date.now()}`, from: { compId: newId, type: 'BUTTON', pin: 'br' }, to: { compId: bb.id, type: 'BREADBOARD', col: 20, row: 'bottom', rowIndex: 0 }, color: '#22c55e' }
            ]);
         }, 50);
      }
    }

    setComponents(p => [...p, { id: newId, type, x, y, properties: { pin: 2, color: color || 'red' } }]);
    
    if(type === 'ARDUINO') {
       const bb = components.find(c => c.type === 'BREADBOARD');
       if(bb) {
         setWires(p => [
            ...p, 
            { id: `aw-green-${Date.now()}`, from: { compId: newId, type: 'ARDUINO', pin: 'D10' }, to: { compId: bb.id, type: 'BREADBOARD', col: 10, row: 'bottom', rowIndex: 3 }, color: '#22c55e' },
            { id: `aw-yellow-${Date.now()}`, from: { compId: newId, type: 'ARDUINO', pin: 'D2' }, to: { compId: bb.id, type: 'BREADBOARD', col: 20, row: 'bottom', rowIndex: 3 }, color: '#eab308' }
         ]);
       }
    }
  };

  const updateProp = (key, value) => setComponents(p => p.map(c => c.id === selectedId ? { ...c, properties: { ...c.properties, [key]: value } } : c));
  const selectedComp = components.find(c => c.id === selectedId);
  const selectedWire = wires.find(w => w.id === selectedWireId);

  const getAvailablePins = (currentPin) => {
    const allowedPins = ['D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'D8', 'D9', 'D10', 'D11', 'D12', 'D13'];
    const usedPins = new Set();
    wires.forEach(w => {
      if (w.from.type === 'ARDUINO') usedPins.add(w.from.pin);
      if (w.to.type === 'ARDUINO') usedPins.add(w.to.pin);
    });
    return allowedPins.filter(p => !usedPins.has(p) || p === currentPin);
  };

  return (
    <div className={`h-full flex flex-col ${theme === 'dark' ? 'dark bg-slate-900 text-white' : 'bg-slate-50 text-slate-900'}`} onMouseUp={handleMouseUp}>
      <header className="h-16 border-b flex items-center justify-between px-6 bg-white dark:bg-slate-800 dark:border-slate-700 shadow-sm z-50">
        <div className="flex items-center gap-3"><Cpu className="text-blue-600"/><h1 className="font-bold">ArduinoSim Pro</h1></div>
        <div className="flex gap-4">
           <div className="flex bg-slate-100 p-1 rounded">
             <button 
               onClick={()=>setViewMode('component')} 
               className={`flex items-center gap-2 px-3 py-1 rounded text-sm font-medium transition-all ${viewMode==='component'?'bg-white shadow text-blue-600':'text-gray-600 hover:text-gray-900'}`}
             >
               <Layout size={16}/> Build
             </button>
             <button 
               onClick={()=>setViewMode('code')} 
               className={`flex items-center gap-2 px-3 py-1 rounded text-sm font-medium transition-all ${viewMode==='code'?'bg-white shadow text-blue-600':'text-gray-600 hover:text-gray-900'}`}
             >
               <Code size={16}/> Code
             </button>
           </div>
           <button onClick={() => setTheme(theme==='light'?'dark':'light')} className="p-2 rounded hover:bg-gray-100">{theme==='light'?<Moon size={20}/>:<Sun size={20}/>}</button>
           <button onClick={() => setIsRunning(!isRunning)} className={`px-4 py-2 rounded font-bold text-white ${isRunning?'bg-red-500':'bg-green-600'}`}>{isRunning?'Stop':'Start'}</button>
        </div>
      </header>

      <div className="bg-blue-50 dark:bg-blue-900/30 border-b border-blue-100 dark:border-blue-800 px-6 py-2 flex items-center gap-2 text-sm text-blue-800 dark:text-blue-200 justify-between">
        <div className="flex items-center gap-2">
            <Info size={18} className="text-blue-500"/>
            <span dangerouslySetInnerHTML={{ __html: hintMessage.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
        </div>
        {!isRunning && !selectedWire && (
            <div className="flex items-center gap-2 text-xs text-gray-500 bg-white px-2 py-1 rounded border">
                <MousePointerClick size={14} /> 
                <span>Tip: Click on an **Arduino Wire** to change its Pin.</span>
            </div>
        )}
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* --- NEW SIDEBAR STRUCTURE --- */}
        <aside className="w-64 bg-white dark:bg-slate-800 border-r flex flex-col z-40 overflow-y-auto">
           
           {/* CATEGORY: CONTROLLERS */}
           <div className="border-b dark:border-slate-700">
             <button onClick={()=>toggleSection('controllers')} className="w-full p-4 flex items-center justify-between font-semibold bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700">
                <div className="flex items-center gap-2 text-blue-600"><Cpu size={18}/> Controllers</div>
                {expanded.controllers ? <ChevronDown size={16}/> : <ChevronRight size={16}/>}
             </button>
             {expanded.controllers && (
               <div className="p-2 bg-white dark:bg-slate-900">
                 <div draggable onDragStart={(e)=>handleDragStart(e,'ARDUINO')} className="flex items-center gap-3 p-2 hover:bg-blue-50 dark:hover:bg-slate-800 rounded cursor-grab">
                   <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold text-xs">U</div>
                   <span className="text-sm font-medium">Arduino Uno</span>
                 </div>
               </div>
             )}
           </div>

           {/* CATEGORY: OUTPUTS */}
           <div className="border-b dark:border-slate-700">
             <button onClick={()=>toggleSection('outputs')} className="w-full p-4 flex items-center justify-between font-semibold bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700">
                <div className="flex items-center gap-2 text-amber-500"><Lightbulb size={18}/> Outputs</div>
                {expanded.outputs ? <ChevronDown size={16}/> : <ChevronRight size={16}/>}
             </button>
             {expanded.outputs && (
               <div className="p-2 space-y-1 bg-white dark:bg-slate-900">
                 {/* Red LED */}
                 <div draggable onDragStart={(e)=>{e.dataTransfer.setData('type','LED');e.dataTransfer.setData('color','red')}} className="flex items-center gap-3 p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded cursor-grab">
                   <div className="w-4 h-4 rounded-full bg-red-500 shadow-sm border border-red-600"></div>
                   <span className="text-sm">Red LED</span>
                 </div>
                 {/* Green LED */}
                 <div draggable onDragStart={(e)=>{e.dataTransfer.setData('type','LED');e.dataTransfer.setData('color','green')}} className="flex items-center gap-3 p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded cursor-grab">
                   <div className="w-4 h-4 rounded-full bg-green-500 shadow-sm border border-green-600"></div>
                   <span className="text-sm">Green LED</span>
                 </div>
                 {/* Blue LED */}
                 <div draggable onDragStart={(e)=>{e.dataTransfer.setData('type','LED');e.dataTransfer.setData('color','blue')}} className="flex items-center gap-3 p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded cursor-grab">
                   <div className="w-4 h-4 rounded-full bg-blue-500 shadow-sm border border-blue-600"></div>
                   <span className="text-sm">Blue LED</span>
                 </div>
                 {/* Yellow LED */}
                 <div draggable onDragStart={(e)=>{e.dataTransfer.setData('type','LED');e.dataTransfer.setData('color','yellow')}} className="flex items-center gap-3 p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded cursor-grab">
                   <div className="w-4 h-4 rounded-full bg-yellow-400 shadow-sm border border-yellow-500"></div>
                   <span className="text-sm">Yellow LED</span>
                 </div>
               </div>
             )}
           </div>

           {/* CATEGORY: INPUTS */}
           <div className="border-b dark:border-slate-700">
             <button onClick={()=>toggleSection('inputs')} className="w-full p-4 flex items-center justify-between font-semibold bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700">
                <div className="flex items-center gap-2 text-slate-600"><ToggleLeft size={18}/> Inputs</div>
                {expanded.inputs ? <ChevronDown size={16}/> : <ChevronRight size={16}/>}
             </button>
             {expanded.inputs && (
               <div className="p-2 bg-white dark:bg-slate-900">
                 <div draggable onDragStart={(e)=>handleDragStart(e,'BUTTON')} className="flex items-center gap-3 p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded cursor-grab">
                   <Square size={16} className="text-slate-500"/>
                   <span className="text-sm">Push Button</span>
                 </div>
               </div>
             )}
           </div>

           {/* CATEGORY: PASSIVES (Resistor) */}
           <div className="border-b dark:border-slate-700">
             <button onClick={()=>toggleSection('passives')} className="w-full p-4 flex items-center justify-between font-semibold bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700">
                <div className="flex items-center gap-2 text-slate-600"><Activity size={18}/> Passives</div>
                {expanded.passives ? <ChevronDown size={16}/> : <ChevronRight size={16}/>}
             </button>
             {expanded.passives && (
               <div className="p-2 bg-white dark:bg-slate-900">
                 <div draggable onDragStart={(e)=>handleDragStart(e,'RESISTOR')} className="flex items-center gap-3 p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded cursor-grab">
                   <Zap size={16} className="text-amber-600"/>
                   <span className="text-sm">Resistor (220Ω)</span>
                 </div>
               </div>
             )}
           </div>

           <div className="mt-auto p-4">
             <button onClick={handleReset} className="w-full py-2 px-4 border border-red-200 bg-red-50 text-red-600 rounded hover:bg-red-100 flex justify-center items-center gap-2 font-medium transition-colors">
               <RotateCcw size={16}/> Reset
             </button>
           </div>
        </aside>
        
        <div className="flex-1 relative bg-slate-50 dark:bg-slate-900">
           <Canvas 
              isRunning={isRunning}
              components={components} setComponents={setComponents} pinStates={pinStates}
              selectedId={selectedId} setSelectedId={(id)=>{if(!isRunning) setSelectedId(id); setSelectedWireId(null)}} 
              selectedWireId={selectedWireId} 
              onWireSelect={(id)=>{if(!isRunning) { setSelectedWireId(id); setSelectedId(null); }}}
              onBtnPress={()=>setBtnState(true)} isBtnActive={btnState}
              onDrop={handleCanvasDrop} wires={wires} deleteWire={(id)=>{if(!isRunning) setWires(p=>p.filter(w=>w.id!==id))}} 
              drawingWire={drawingWire} onTargetClick={handleTargetClick} cancelWire={()=>setDrawingWire(null)}
              getWireEndpoint={getWireEndpoint}
           />
        </div>

        <aside className="w-72 bg-white dark:bg-slate-800 border-l p-4 overflow-y-auto">
           {!selectedComp && !selectedWire && !isRunning && (
            <div className="p-4 border border-dashed rounded text-center text-gray-500 text-sm">
                <MousePointerClick className="mx-auto mb-2 opacity-50" size={24}/>
                <p>Click on any component to edit properties.</p>
                <p className="mt-2 text-xs text-blue-500 font-semibold">💡 Click on a wire connected to the Arduino to change pin alignment!</p>
            </div>
           )}

           {selectedComp && <div><h3 className="font-bold mb-2">{selectedComp.type}</h3>
              {selectedComp.type==='LED' && <div><label className="text-xs">Color</label><div className="flex gap-2 mt-1">{['red','green','blue','yellow'].map(c=><button key={c} onClick={()=>updateProp('color',c)} className={`w-6 h-6 rounded-full border ${selectedComp.properties.color===c?'border-black':''}`} style={{backgroundColor:c==='blue'?'#3b82f6':c==='red'?'#ef4444':c==='green'?'#22c55e':'#eab308'}}/>)}</div></div>}
              <button onClick={()=>setComponents(p=>p.filter(c=>c.id!==selectedId))} className="text-red-500 mt-4 flex gap-2"><Trash2 size={16}/> Remove</button>
           </div>}
           {selectedWire && (
            <div className="p-4 border rounded bg-gray-50 mb-4">
              <h3 className="font-bold mb-3 text-sm uppercase text-gray-500">Wire Settings</h3>
              {selectedWire.from.type === 'ARDUINO' && <div className="mb-3"><label className="text-xs font-semibold block mb-1">Arduino Pin (Start)</label><select className="w-full p-2 border rounded bg-white text-sm" value={selectedWire.from.pin} onChange={(e) => updateWirePin(selectedWire.id, 'from', e.target.value)}>{getAvailablePins(selectedWire.from.pin).map(p => <option key={p} value={p}>{p}</option>)}</select></div>}
              {selectedWire.to.type === 'ARDUINO' && <div className="mb-3"><label className="text-xs font-semibold block mb-1">Arduino Pin (End)</label><select className="w-full p-2 border rounded bg-white text-sm" value={selectedWire.to.pin} onChange={(e) => updateWirePin(selectedWire.id, 'to', e.target.value)}>{getAvailablePins(selectedWire.to.pin).map(p => <option key={p} value={p}>{p}</option>)}</select></div>}
              <button onClick={() => {setWires(p => p.filter(w => w.id !== selectedWireId));setSelectedWireId(null);}} className="w-full py-2 bg-red-100 text-red-600 rounded hover:bg-red-200 text-sm font-bold flex items-center justify-center gap-2"><Trash2 size={16}/> Delete Wire</button>
            </div>
           )}
           {viewMode==='code' && <div className="h-full flex flex-col"><h3 className="font-bold mb-2">Arduino C++</h3><pre className="flex-1 bg-gray-900 text-green-400 p-2 text-xs overflow-auto rounded">{generateArduinoCode(components, wires)}</pre></div>}
        </aside>
      </div>
    </div>
  );
}