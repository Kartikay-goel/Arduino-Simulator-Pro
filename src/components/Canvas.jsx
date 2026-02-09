import React, { useRef, useState } from 'react';
import Draggable from 'react-draggable';
import { ARDUINO_PIN_MAP, getWireEndpoint } from '../utils/coordinates';

// --- LAYERS ---
const BreadboardHoles = ({ compId, onTargetClick }) => {
  const holes = [];
  const addHole = (col, row, rIdx, cx, cy) => holes.push(<circle key={`${col}-${row}-${rIdx}`} cx={cx} cy={cy} r="4" fill="transparent" className="cursor-pointer hover:stroke-green-500 hover:stroke-2 pointer-events-auto" onClick={(e)=>{e.stopPropagation(); onTargetClick({compId, type:'BREADBOARD', col, row, rowIndex:rIdx})}} />);
  for(let i=0; i<60; i++) {
     if(i > 28 && i < 32) continue; 
     const cx = 25 + i*8.5; 
     [45,55,65,75].forEach((cy,idx)=>addHole(i,'top',idx,cx,cy));
     [105,115,125,135].forEach((cy,idx)=>addHole(i,'bottom',idx,cx,cy));
     if(i%5===0) { addHole(i,'power-top',0,cx,15); addHole(i,'power-top',1,cx,25); addHole(i,'power-bottom',0,cx,155); addHole(i,'power-bottom',1,cx,165); }
  }
  return <g>{holes}</g>;
};

const BreadboardGraphic = () => (
  <svg width="550" height="180" viewBox="0 0 550 180" style={{pointerEvents:'none'}}>
    <rect x="0" y="0" width="550" height="180" rx="4" fill="#f3f4f6" stroke="#9ca3af" strokeWidth="2"/>
    <line x1="20" y1="15" x2="530" y2="15" stroke="#ef4444" strokeWidth="2" />
    <line x1="20" y1="25" x2="530" y2="25" stroke="#3b82f6" strokeWidth="2" />
    <line x1="20" y1="155" x2="530" y2="155" stroke="#ef4444" strokeWidth="2" />
    <line x1="20" y1="165" x2="530" y2="165" stroke="#3b82f6" strokeWidth="2" />
    <rect x="10" y="85" width="530" height="10" fill="#e5e7eb" />
    {Array.from({ length: 60 }).map((_, i) => (
       <g key={i} fill="#1a1a1a">
         {[45,55,65,75,105,115,125,135].map(y=><circle key={y} cx={25+i*8.5} cy={y} r="2"/>)}
         {i%5===0&&[15,25,155,165].map(y=><circle key={y} cx={25+i*8.5} cy={y} r="2"/>)}
       </g>
    ))}
  </svg>
);

const ArduinoPins = ({ compId, onTargetClick }) => (
  <g>{Object.entries(ARDUINO_PIN_MAP).map(([pin, p]) => (
    <rect key={pin} x={p.x-5} y={p.y-5} width="10" height="10" fill="transparent" className="cursor-pointer hover:fill-blue-500 hover:opacity-50 pointer-events-auto" onClick={(e)=>{e.stopPropagation(); onTargetClick({compId, type:'ARDUINO', pin});}} />
  ))}</g>
);

const Wire = ({ id, from, to, color, isSelected, onSelect }) => {
  if(!from || !to) return null;
  const path = `M ${from.x} ${from.y} Q ${(from.x+to.x)/2} ${Math.min(from.y,to.y)-60} ${to.x} ${to.y}`;
  return (
    <g 
        onClick={(e)=>{e.stopPropagation(); onSelect(id)}} 
        onContextMenu={(e)=>{e.preventDefault(); e.stopPropagation(); onSelect(id);}} 
        className="cursor-pointer pointer-events-auto"
    >
      <path d={path} stroke="transparent" strokeWidth="15" fill="none"/>
      {isSelected && <path d={path} stroke="#fbbf24" strokeWidth="8" fill="none" opacity="0.6"/>}
      <path d={path} stroke={color} strokeWidth="4" fill="none" strokeLinecap="round"/>
      <circle cx={from.x} cy={from.y} r="3" fill="white" stroke={color}/>
      <circle cx={to.x} cy={to.y} r="3" fill="white" stroke={color}/>
    </g>
  );
};

const DraggableItem = ({ comp, pinStates, selectedId, setSelectedId, onDrag, onStop, onBtnPress, isBtnActive, onTargetClick, isRunning }) => {
  const nodeRef = useRef(null);
  const handlePin = (e, pin) => { e.stopPropagation(); onTargetClick({compId:comp.id, type:comp.type, pin}); };
  const snap = ['LED','RESISTOR','BUTTON'].includes(comp.type) ? [8.5, 10] : null;
  const isLocked = comp.type === 'BREADBOARD' || isRunning;

  const getZIndex = () => {
    if (comp.type === 'BREADBOARD') return 0;
    if (comp.type === 'ARDUINO') return 10;
    return 30; 
  };

  return (
    <Draggable 
      nodeRef={nodeRef} 
      position={{x:comp.x,y:comp.y}} 
      onDrag={(e,d)=>onDrag(e,d,comp.id)} 
      onStop={(e,d)=>onStop(e,d,comp.id,snap)} 
      grid={snap} 
      disabled={isLocked}
      cancel=".pointer-events-auto"
    >
      <div 
        ref={nodeRef} 
        onClick={(e)=>{if(!isLocked) {e.stopPropagation(); setSelectedId(comp.id)}}}
        className={`absolute ${isLocked ? '' : 'cursor-grab active:cursor-grabbing'}`}
        style={{zIndex: getZIndex()}}
      >
        <div className={selectedId===comp.id ? "ring-2 ring-blue-500 rounded" : ""}>
          {comp.type==='ARDUINO' && <><wokwi-arduino-uno /><svg width="330" height="160" className="absolute top-0 left-0" style={{pointerEvents:'none'}}><ArduinoPins compId={comp.id} onTargetClick={onTargetClick}/></svg></>}
          {comp.type==='BREADBOARD' && <div className="relative"><BreadboardGraphic/><svg width="550" height="180" className="absolute top-0 left-0" style={{pointerEvents:'none'}}><BreadboardHoles compId={comp.id} onTargetClick={onTargetClick}/></svg></div>}
          
          {comp.type==='LED' && <div className="relative pointer-events-none" style={{left:'-3px',top:'-5px'}}>
             <wokwi-led color={comp.properties.color} value={pinStates[comp.properties.pin]===1}/>
             <div className="absolute top-7 left-1 w-4 h-4 cursor-pointer pointer-events-auto" onClick={(e)=>handlePin(e,'cathode')}/>
             <div className="absolute top-7 right-1 w-4 h-4 cursor-pointer pointer-events-auto" onClick={(e)=>handlePin(e,'anode')}/>
          </div>}

          {comp.type==='RESISTOR' && <div className="relative pointer-events-none" style={{left:'-1px',top:'-3px'}}>
             <wokwi-resistor value="220"/>
             <div className="absolute top-[12px] left-[1px] w-1 h-1 bg-orange-500 rounded-full cursor-pointer pointer-events-auto" onClick={(e)=>handlePin(e,'left')}/>
             <div className="absolute top-[12px] right-[1px] w-1 h-1 bg-orange-500 rounded-full cursor-pointer pointer-events-auto" onClick={(e)=>handlePin(e,'right')}/>
          </div>}

          {comp.type==='BUTTON' && (
            <div 
                className={`cursor-pointer ${isRunning ? 'pointer-events-auto' : ''} bg-gray-200 rounded-sm shadow-sm`} 
                onMouseDown={onBtnPress} 
                style={{left:'-2px',top:'-3px', display: 'inline-block'}}
            >
              <wokwi-pushbutton color="blue" isPressed={isBtnActive}/>
              <div className="absolute top-0 left-0 w-4 h-4 pointer-events-auto" onClick={(e)=>handlePin(e,'tl')}/>
              <div className="absolute top-0 right-0 w-4 h-4 pointer-events-auto" onClick={(e)=>handlePin(e,'tr')}/>
              <div className="absolute bottom-0 left-0 w-4 h-4 pointer-events-auto" onClick={(e)=>handlePin(e,'bl')}/>
              <div className="absolute bottom-0 right-0 w-4 h-4 pointer-events-auto" onClick={(e)=>handlePin(e,'br')}/>
            </div>
          )}
        </div>
      </div>
    </Draggable>
  );
};

export const Canvas = ({ components, setComponents, pinStates, selectedId, setSelectedId, selectedWireId, onWireSelect, onBtnPress, isBtnActive, onDrop, wires, deleteWire, drawingWire, onTargetClick, cancelWire, getWireEndpoint, isRunning }) => {
  const canvasRef = useRef(null);
  const [mousePos, setMousePos] = useState({x:0,y:0});

  const handleDrag = (e,d,id) => setComponents(prev=>prev.map(c=>c.id===id?{...c,x:d.x,y:d.y}:c));
  const handleStop = (e,d,id,snap) => {
    if(snap) {
      const sx = 26 + Math.round((d.x-26)/8.5)*8.5;
      const sy = 10 + Math.round((d.y-10)/10)*10;
      setComponents(prev=>prev.map(c=>c.id===id?{...c,x:sx,y:sy}:c));
    }
  };

  const handleMouseMove = (e) => {
    if(drawingWire && canvasRef.current) {
      const r = canvasRef.current.getBoundingClientRect();
      setMousePos({x:e.clientX-r.left, y:e.clientY-r.top});
    }
  };

  const ghostStart = drawingWire ? getWireEndpoint(drawingWire, components) : {x:0,y:0};

  return (
    <div ref={canvasRef} className="w-full h-full relative overflow-hidden bg-slate-50 dark:bg-slate-900" onDragOver={e=>e.preventDefault()} onDrop={onDrop} onMouseMove={handleMouseMove} onClick={()=>{cancelWire();setSelectedId(null);onWireSelect(null)}} onContextMenu={e=>{e.preventDefault();cancelWire()}}>
      <div className="absolute inset-0 pointer-events-none opacity-20 dark:opacity-10" style={{backgroundImage:'radial-gradient(#94a3b8 1px, transparent 1px)', backgroundSize:'20px 20px'}}></div>
      
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{zIndex:20}}>
        {wires.map(w => {
           let start = getWireEndpoint(w.from, components);
           let end = getWireEndpoint(w.to, components);

           // --- VISUAL TWEAKS ---
           if(start) {
              // General Nudge UP for pins
              if (w.from.type === 'ARDUINO' || w.from.type === 'BUTTON') {
                 start = { ...start, y: start.y - 4 }; 
              }
              // Specific Nudge LEFT for Arduino pins
              if (w.from.type === 'ARDUINO') {
                 start = { ...start, x: start.x - 2 }; 
              }
           }

           if(end) {
              if (w.to.type === 'ARDUINO' || w.to.type === 'BUTTON') {
                 end = { ...end, y: end.y - 4 }; 
              }
              if (w.to.type === 'ARDUINO') {
                 end = { ...end, x: end.x - 2 }; 
              }
           }

           return <Wire key={w.id} id={w.id} from={start} to={end} color={w.color} isSelected={w.id===selectedWireId} onSelect={onWireSelect} />;
        })}
      </svg>

      {components.map(c=><DraggableItem key={c.id} comp={c} pinStates={pinStates} selectedId={selectedId} setSelectedId={setSelectedId} onDrag={handleDrag} onStop={handleStop} onBtnPress={onBtnPress} isBtnActive={isBtnActive} onTargetClick={onTargetClick} isRunning={isRunning} />)}
      
      {drawingWire && (
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{zIndex:50}}>
           <line x1={ghostStart.x} y1={ghostStart.y} x2={mousePos.x} y2={mousePos.y} stroke="#22c55e" strokeWidth="2" strokeDasharray="5,5"/>
        </svg>
      )}
    </div>
  );
};