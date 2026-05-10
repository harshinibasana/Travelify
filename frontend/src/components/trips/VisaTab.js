import React, { useState, useEffect } from 'react';
import { Globe, CheckCircle2, ExternalLink, Info, Search, Loader, RefreshCw } from 'lucide-react';
import { visaAPI } from '../../utils/api';
import './VisaTab.css';

export default function VisaTab({ trip }) {
  const [allVisa, setAllVisa]   = useState({});
  const [visa, setVisa]         = useState(null);
  const [activeKey, setActiveKey] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [searching, setSearching] = useState(false);
  const [searchQ, setSearchQ]   = useState('');
  const [lastUpdated, setLastUpdated] = useState('');
  const [notFound, setNotFound] = useState(false);

  // Load all visa data on mount
  useEffect(() => {
    visaAPI.getAll()
      .then(r => {
        setAllVisa(r.data.destinations || {});
        setLastUpdated(r.data.lastUpdated ? new Date(r.data.lastUpdated).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}) : '');
        setLoading(false);
        // Auto-detect trip destination
        if (trip?.destination) autoDetect(trip.destination, r.data.destinations);
      })
      .catch(() => setLoading(false));
  }, []);

  const autoDetect = (dest, db) => {
    const destU = dest.toUpperCase();
    const match = Object.keys(db || allVisa).find(k =>
      destU.includes(k) ||
      (k==='SCHENGEN' && ['FRANCE','GERMANY','ITALY','SPAIN','NETHERLANDS','GREECE','PORTUGAL','PARIS','ROME','BARCELONA','BERLIN','ATHENS','LISBON'].some(e=>destU.includes(e)))
    );
    if (match) { setActiveKey(match); setVisa((db||allVisa)[match]); }
  };

  const selectDest = (key) => {
    if (activeKey === key) { setActiveKey(null); setVisa(null); setNotFound(false); return; }
    setActiveKey(key);
    setVisa(allVisa[key]);
    setNotFound(false);
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQ.trim()) return;
    setSearching(true); setNotFound(false);
    try {
      const r = await visaAPI.check(searchQ);
      if (r.data.visa) {
        setVisa(r.data.visa);
        setActiveKey(r.data.visa.destination);
        setNotFound(false);
      } else {
        setNotFound(true); setVisa(null); setActiveKey(null);
      }
    } catch { setNotFound(true); }
    finally { setSearching(false); }
  };

  const DEST_ORDER = ['USA','UK','SCHENGEN','JAPAN','AUSTRALIA','CANADA','INDIA','THAILAND','DUBAI','SINGAPORE','TURKEY','BRAZIL','BALI','MEXICO','MALDIVES'];

  if (loading) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',padding:40,gap:12,color:'#64748b'}}>
      <Loader size={22} className="spin"/> Loading visa data...
    </div>
  );

  return (
    <div className="visa-tab">
      {/* Header */}
      <div className="visa-header">
        <Globe size={22} color="#0A4D6E"/>
        <div>
          <h3>Visa Requirements</h3>
          <p>Verified data for 15 destinations · Updated {lastUpdated || 'regularly'}</p>
        </div>
      </div>

      {/* Search any destination */}
      <form className="visa-search" onSubmit={handleSearch}>
        <div className="vs-wrap">
          <Search size={15} className="vs-icon"/>
          <input className="vs-input" placeholder="Search destination (e.g. Paris, Bali, Mexico...)"
            value={searchQ} onChange={e=>setSearchQ(e.target.value)}/>
          <button type="submit" className="btn btn-primary btn-sm" disabled={searching}>
            {searching ? <Loader size={13} className="spin"/> : 'Check'}
          </button>
        </div>
        {notFound && (
          <div className="vs-not-found">
            No visa data found for "<strong>{searchQ}</strong>". Try selecting from the list below.
          </div>
        )}
      </form>

      {/* Destination grid */}
      <div className="visa-dest-grid">
        {DEST_ORDER.filter(k => allVisa[k]).map(dest => {
          const v = allVisa[dest];
          return (
            <button key={dest} className={`visa-dest-btn ${activeKey===dest?'active':''}`}
              onClick={() => selectDest(dest)}>
              <span className="vdb-flag">{v.flag}</span>
              <span className="vdb-name">{dest==='SCHENGEN'?'Europe':dest==='BALI'?'Bali / Indonesia':dest}</span>
              <span className="vdb-type" style={{color:v.color}}>{v.type.split(' ')[0]}</span>
            </button>
          );
        })}
      </div>

      {/* Visa detail card */}
      {visa && (
        <div className="visa-card">
          {/* Header */}
          <div className="vc-header">
            <div style={{flex:1}}>
              <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:6}}>
                <span style={{fontSize:28}}>{visa.flag}</span>
                <h4>{activeKey==='SCHENGEN'?'Schengen Area (Europe)':activeKey}</h4>
              </div>
              <div style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'center'}}>
                <span className="vc-type-badge" style={{background:visa.color+'15',color:visa.color,border:`1.5px solid ${visa.color}30`}}>
                  {visa.type}
                </span>
                {visa.lastUpdated && (
                  <span style={{fontSize:10,color:'#94a3b8',display:'flex',alignItems:'center',gap:4}}>
                    <RefreshCw size={9}/> Verified {visa.lastUpdated}
                  </span>
                )}
              </div>
            </div>
            <a href={visa.link} target="_blank" rel="noreferrer" className="btn btn-primary btn-sm">
              Apply <ExternalLink size={11}/>
            </a>
          </div>

          {/* Stats row */}
          <div className="vc-stats">
            <div className="vc-stat">
              <span>⏱️ Max Stay</span>
              <strong>Up to {visa.days} days</strong>
            </div>
            <div className="vc-stat">
              <span>💰 Fee</span>
              <strong>{visa.fee}</strong>
            </div>
            <div className="vc-stat">
              <span>⚡ Processing</span>
              <strong>{visa.processing}</strong>
            </div>
          </div>

          {/* Requirements */}
          <div className="vc-reqs">
            <div className="vc-req-title">📋 Required Documents</div>
            {visa.requirements.map((r,i) => (
              <div key={i} className="vc-req-item">
                <CheckCircle2 size={13} color="#22c55e" style={{flexShrink:0}}/>
                <span>{r}</span>
              </div>
            ))}
          </div>

          {/* Notes */}
          {visa.notes && (
            <div className="vc-notes">
              <Info size={13} style={{flexShrink:0}}/>
              <span>{visa.notes}</span>
            </div>
          )}
        </div>
      )}

      {!visa && !notFound && (
        <div className="visa-empty">
          <Globe size={40} opacity={0.15}/>
          <p>Select a destination above or search for any country</p>
        </div>
      )}

      <div className="visa-disclaimer">
        ⚠️ Requirements change frequently — always verify with the{' '}
        <a href="https://www.iatatravelcentre.com" target="_blank" rel="noreferrer">IATA Travel Centre</a> or official embassy before booking.
      </div>
    </div>
  );
}
