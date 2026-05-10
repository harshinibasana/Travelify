import React, { useState, useEffect } from 'react';
import { Plane, Plus, Trash2, ExternalLink, Clock, AlertCircle, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';
import './FlightTab.css';

const LS_KEY = (tripId) => `travelify_flights_${tripId}`;
const BLANK = { flightNo:'', airline:'', from:'', to:'', depDate:'', depTime:'', arrDate:'', arrTime:'', terminal:'', seat:'', status:'scheduled', notes:'' };
const STATUS_STYLES = {
  scheduled: { bg:'#EFF6FF', color:'#1d4ed8', label:'Scheduled' },
  confirmed:  { bg:'#F0FDF4', color:'#15803d', label:'Confirmed' },
  checked_in: { bg:'#F5F3FF', color:'#7c3aed', label:'Checked In' },
  departed:   { bg:'#F8FAFC', color:'#64748b', label:'Departed'  },
  cancelled:  { bg:'#FFF5F5', color:'#dc2626', label:'Cancelled' },
};

export default function FlightTab({ tripId }) {
  const [flights, setFlights] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]   = useState(BLANK);
  const [editId, setEditId] = useState(null);

  useEffect(() => {
    try {
      const s = localStorage.getItem(LS_KEY(tripId));
      if (s) setFlights(JSON.parse(s));
    } catch {}
  }, [tripId]);

  const save = (list) => {
    setFlights(list);
    try { localStorage.setItem(LS_KEY(tripId), JSON.stringify(list)); } catch {}
  };

  const f = (k,v) => setForm(p => ({...p,[k]:v}));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.flightNo.trim()) return toast.error('Flight number required');
    if (editId) {
      save(flights.map(fl => fl.id===editId ? {...form,id:editId} : fl));
      toast.success('Flight updated ✅');
    } else {
      save([...flights, {...form, id: Date.now()+''}]);
      toast.success('Flight added ✅');
    }
    setForm(BLANK); setShowForm(false); setEditId(null);
  };

  const del = (id) => { save(flights.filter(f=>f.id!==id)); toast.success('Removed'); };
  const edit = (fl) => { setForm({...fl}); setEditId(fl.id); setShowForm(true); };
  const setStatus = (id, status) => save(flights.map(fl => fl.id===id ? {...fl,status} : fl));

  const dur = (fl) => {
    try {
      const dep = new Date(`${fl.depDate}T${fl.depTime||'00:00'}`);
      const arr = new Date(`${fl.arrDate||fl.depDate}T${fl.arrTime||'00:00'}`);
      const mins = Math.round((arr-dep)/60000);
      if (mins<=0) return null;
      return `${Math.floor(mins/60)}h ${mins%60}m`;
    } catch { return null; }
  };

  return (
    <div className="flight-tab">
      <div className="ft-header">
        <div>
          <h3>✈️ Flights</h3>
          <p className="ft-sub">{flights.length} flight{flights.length!==1?'s':''} tracked</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={()=>{setShowForm(!showForm);setEditId(null);setForm(BLANK);}}>
          {showForm ? <><X size={14}/> Cancel</> : <><Plus size={14}/> Add Flight</>}
        </button>
      </div>

      {showForm && (
        <div className="add-form">
          <h4>{editId?'Edit':'Add'} Flight</h4>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Flight No *</label>
                <input className="form-input" placeholder="e.g. AA123" value={form.flightNo} onChange={e=>f('flightNo',e.target.value.toUpperCase())} required/></div>
              <div className="form-group"><label className="form-label">Airline</label>
                <input className="form-input" placeholder="e.g. American Airlines" value={form.airline} onChange={e=>f('airline',e.target.value)}/></div>
              <div className="form-group"><label className="form-label">Status</label>
                <select className="form-input" value={form.status} onChange={e=>f('status',e.target.value)}>
                  {Object.entries(STATUS_STYLES).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}</select></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">From (IATA)</label>
                <input className="form-input" placeholder="e.g. JFK" value={form.from} onChange={e=>f('from',e.target.value.toUpperCase())} maxLength={3}/></div>
              <div className="form-group"><label className="form-label">Dep Date</label>
                <input type="date" className="form-input" value={form.depDate} onChange={e=>f('depDate',e.target.value)}/></div>
              <div className="form-group"><label className="form-label">Dep Time</label>
                <input type="time" className="form-input" value={form.depTime} onChange={e=>f('depTime',e.target.value)}/></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">To (IATA)</label>
                <input className="form-input" placeholder="e.g. LHR" value={form.to} onChange={e=>f('to',e.target.value.toUpperCase())} maxLength={3}/></div>
              <div className="form-group"><label className="form-label">Arr Date</label>
                <input type="date" className="form-input" value={form.arrDate} onChange={e=>f('arrDate',e.target.value)}/></div>
              <div className="form-group"><label className="form-label">Arr Time</label>
                <input type="time" className="form-input" value={form.arrTime} onChange={e=>f('arrTime',e.target.value)}/></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Seat</label>
                <input className="form-input" placeholder="e.g. 24A" value={form.seat} onChange={e=>f('seat',e.target.value)}/></div>
              <div className="form-group"><label className="form-label">Terminal</label>
                <input className="form-input" placeholder="e.g. T2" value={form.terminal} onChange={e=>f('terminal',e.target.value)}/></div>
              <div className="form-group"><label className="form-label">Notes</label>
                <input className="form-input" placeholder="e.g. Window seat" value={form.notes} onChange={e=>f('notes',e.target.value)}/></div>
            </div>
            <div className="form-actions">
              <button type="button" className="btn btn-ghost btn-sm" onClick={()=>{setShowForm(false);setEditId(null);}}>Cancel</button>
              <button type="submit" className="btn btn-primary btn-sm"><Check size={13}/> {editId?'Update':'Add Flight'}</button>
            </div>
          </form>
        </div>
      )}

      {flights.length === 0 && !showForm && (
        <div className="empty-state"><Plane size={40} className="empty-icon"/><p>No flights tracked yet. Add your itinerary!</p></div>
      )}

      <div className="ft-list">
        {flights.map(fl => {
          const st = STATUS_STYLES[fl.status] || STATUS_STYLES.scheduled;
          const duration = dur(fl);
          return (
            <div key={fl.id} className="ft-card">
              <div className="ft-card-top">
                <div className="ft-flight-no">
                  <Plane size={14} color="#0A4D6E"/>
                  <span>{fl.flightNo}</span>
                  {fl.airline && <span className="ft-airline">{fl.airline}</span>}
                </div>
                <span className="ft-status-badge" style={{background:st.bg,color:st.color}}>{st.label}</span>
              </div>

              <div className="ft-route">
                <div className="ft-endpoint">
                  <div className="ft-iata">{fl.from||'???'}</div>
                  {fl.depDate&&<div className="ft-time">{fl.depDate.slice(5)} {fl.depTime||''}</div>}
                  {fl.terminal&&<div className="ft-terminal">T: {fl.terminal}</div>}
                </div>
                <div className="ft-route-mid">
                  <div className="ft-route-line">
                    <div className="ft-dot-left"/>
                    <div className="ft-line"><Plane size={14} color="#0A4D6E"/></div>
                    <div className="ft-dot-right"/>
                  </div>
                  {duration && <div className="ft-dur"><Clock size={10}/> {duration}</div>}
                </div>
                <div className="ft-endpoint ft-right">
                  <div className="ft-iata">{fl.to||'???'}</div>
                  {fl.arrDate&&<div className="ft-time">{fl.arrDate.slice(5)} {fl.arrTime||''}</div>}
                  {fl.seat&&<div className="ft-terminal">Seat: {fl.seat}</div>}
                </div>
              </div>

              {fl.notes && <div className="ft-notes">📝 {fl.notes}</div>}

              <div className="ft-actions">
                <div className="ft-status-btns">
                  {Object.entries(STATUS_STYLES).map(([k,v])=>(
                    <button key={k} className={`ft-st-btn ${fl.status===k?'active':''}`}
                      style={fl.status===k?{background:v.bg,color:v.color,borderColor:v.color}:{}}
                      onClick={()=>setStatus(fl.id,k)}>{v.label}</button>
                  ))}
                </div>
                <div style={{display:'flex',gap:5}}>
                  <button className="btn btn-ghost btn-sm" onClick={()=>edit(fl)} title="Edit">✏️</button>
                  <button className="btn btn-danger btn-sm" onClick={()=>del(fl.id)} title="Delete"><Trash2 size={12}/></button>
                  {fl.flightNo&&<a href={`https://www.flightradar24.com/data/flights/${fl.flightNo.toLowerCase()}`}
                    target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm" title="Track on Flightradar24">
                    <ExternalLink size={12}/></a>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
