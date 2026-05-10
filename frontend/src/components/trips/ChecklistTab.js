import React, { useState, useEffect } from 'react';
import { CheckSquare, Square, Plus, Trash2, X, ChevronDown, ChevronUp } from 'lucide-react';
import toast from 'react-hot-toast';
import './ChecklistTab.css';

const PHASES = [
  { key:'before', label:'Before You Go', emoji:'📦', color:'#0A4D6E' },
  { key:'during', label:'During Trip',   emoji:'✈️', color:'#6B8F71' },
  { key:'after',  label:'When Back',     emoji:'🏠', color:'#8B5CF6' },
];

const DEFAULT_ITEMS = {
  before: [
    'Book flights & accommodation','Get travel insurance','Apply for visas',
    'Check passport expiry (6+ months)','Exchange currency','Download offline maps',
    'Pack first-aid kit','Notify bank of travel plans','Backup important documents',
    'Check vaccination requirements','Pack adaptor & chargers','Make copies of passport',
  ],
  during: [
    'Keep receipts for expenses','Daily budget check','Upload photos to cloud',
    'Check in for return flight','Stay hydrated','Keep emergency contacts handy',
    'Check local weather forecast','Try local food','Write journal entries',
  ],
  after: [
    'Unpack & do laundry','Review expenses & budget','Upload & organize photos',
    'Write trip review','Pay credit card bills','Return rental items',
    'Share highlights with friends','Plan next trip!',
  ],
};

const LS_KEY = (tripId) => `travelify_checklist_${tripId}`;

export default function ChecklistTab({ tripId }) {
  const [items, setItems]       = useState({});
  const [newText, setNewText]   = useState('');
  const [newPhase, setNewPhase] = useState('before');
  const [showAdd, setShowAdd]   = useState(false);
  const [collapsed, setCollapsed] = useState({});

  useEffect(() => {
    try {
      const saved = localStorage.getItem(LS_KEY(tripId));
      if (saved) {
        setItems(JSON.parse(saved));
      } else {
        // First time — load defaults
        const def = {};
        PHASES.forEach(p => {
          def[p.key] = DEFAULT_ITEMS[p.key].map((text, i) => ({
            id: `${p.key}_${i}`, text, done: false,
          }));
        });
        setItems(def);
      }
    } catch { setItems({}); }
  }, [tripId]);

  const save = (newItems) => {
    setItems(newItems);
    try { localStorage.setItem(LS_KEY(tripId), JSON.stringify(newItems)); } catch {}
  };

  const toggle = (phase, id) => {
    const updated = { ...items, [phase]: items[phase].map(i => i.id===id ? {...i,done:!i.done} : i) };
    save(updated);
  };

  const addItem = (e) => {
    e.preventDefault();
    if (!newText.trim()) return;
    const newItem = { id: `${newPhase}_${Date.now()}`, text: newText.trim(), done: false };
    const updated = { ...items, [newPhase]: [...(items[newPhase]||[]), newItem] };
    save(updated);
    setNewText('');
    toast.success('Item added');
  };

  const removeItem = (phase, id) => {
    const updated = { ...items, [phase]: items[phase].filter(i => i.id !== id) };
    save(updated);
  };

  const resetPhase = (phase) => {
    const updated = { ...items, [phase]: DEFAULT_ITEMS[phase].map((text,i) => ({ id:`${phase}_reset_${i}`, text, done:false })) };
    save(updated);
    toast.success('Phase reset');
  };

  const totalItems = Object.values(items).flat().length;
  const doneItems  = Object.values(items).flat().filter(i => i.done).length;
  const pct = totalItems > 0 ? Math.round((doneItems/totalItems)*100) : 0;

  return (
    <div className="checklist-tab">
      {/* Header */}
      <div className="cl-header">
        <div>
          <h3>Travel Checklist</h3>
          <p className="cl-sub">{doneItems}/{totalItems} completed</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(!showAdd)}>
          {showAdd ? <><X size={14}/> Cancel</> : <><Plus size={14}/> Add Item</>}
        </button>
      </div>

      {/* Progress bar */}
      <div className="cl-progress-bar">
        <div className="cl-progress-fill" style={{
          width: pct+'%',
          background: pct===100 ? '#22c55e' : pct>50 ? 'var(--sage)' : 'var(--ocean)',
        }}/>
        <span className="cl-pct">{pct}%</span>
      </div>

      {/* Add form */}
      {showAdd && (
        <form className="cl-add-form" onSubmit={addItem}>
          <input className="form-input" placeholder="New checklist item..."
            value={newText} onChange={e=>setNewText(e.target.value)} autoFocus/>
          <select className="form-input" value={newPhase} onChange={e=>setNewPhase(e.target.value)}>
            {PHASES.map(p => <option key={p.key} value={p.key}>{p.emoji} {p.label}</option>)}
          </select>
          <button type="submit" className="btn btn-primary btn-sm">Add</button>
        </form>
      )}

      {/* Phase sections */}
      {PHASES.map(phase => {
        const phaseItems = items[phase.key] || [];
        const done = phaseItems.filter(i => i.done).length;
        const isCollapsed = collapsed[phase.key];
        return (
          <div key={phase.key} className="cl-phase">
            <div className="cl-phase-header" onClick={() => setCollapsed(c => ({...c,[phase.key]:!c[phase.key]}))}>
              <div className="cl-ph-left">
                <span className="cl-ph-emoji">{phase.emoji}</span>
                <span className="cl-ph-label">{phase.label}</span>
                <span className="cl-ph-count">{done}/{phaseItems.length}</span>
                {done === phaseItems.length && phaseItems.length > 0 && <span className="cl-ph-done">✅</span>}
              </div>
              <div className="cl-ph-right">
                <div className="cl-ph-bar">
                  <div className="cl-ph-fill" style={{width: phaseItems.length>0?Math.round((done/phaseItems.length)*100)+'%':'0%', background:phase.color}}/>
                </div>
                {isCollapsed ? <ChevronDown size={14}/> : <ChevronUp size={14}/>}
              </div>
            </div>

            {!isCollapsed && (
              <div className="cl-items">
                {phaseItems.map(item => (
                  <div key={item.id} className={`cl-item ${item.done?'done':''}`}>
                    <button className="cl-check" onClick={() => toggle(phase.key, item.id)}>
                      {item.done
                        ? <CheckSquare size={17} color={phase.color}/>
                        : <Square size={17} color="#CBD5E1"/>}
                    </button>
                    <span className="cl-text">{item.text}</span>
                    <button className="cl-del" onClick={() => removeItem(phase.key, item.id)}>
                      <Trash2 size={12}/>
                    </button>
                  </div>
                ))}
                <button className="cl-reset-btn" onClick={() => resetPhase(phase.key)}>
                  ↺ Reset to defaults
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
