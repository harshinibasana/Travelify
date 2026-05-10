import React, { useState, useEffect, useCallback } from 'react';
import { tripsAPI } from '../utils/api';
import { format } from 'date-fns';
import { MapPin, Calendar, DollarSign, Search, Users, CheckSquare,
         TrendingUp, Globe, Loader, RefreshCw, X, ChevronDown, ChevronUp, Filter } from 'lucide-react';
import './Community.css';

const CAT_ICONS = { accommodation:'🏨', transport:'✈️', food:'🍜', activities:'🎯', sightseeing:'📸', shopping:'🛍️', health:'💊', other:'📋' };
const SPEND_ICONS= { accommodation:'🏨', transport:'✈️', food:'🍜', activities:'🎭', shopping:'🛍️', health:'💊', visa:'📄', other:'💼' };

const fmt$ = n => n >= 1000 ? '$'+(n/1000).toFixed(1)+'k' : '$'+Math.round(n||0);

export default function Community() {
  const [trips, setTrips]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [expanded, setExpanded]   = useState(null);
  const [sortBy, setSortBy]       = useState('newest'); // newest | most-spent | longest
  const [total, setTotal]         = useState(0);

  const load = useCallback(async (q='') => {
    setLoading(true);
    try {
      const r = await tripsAPI.getCommunity({ destination: q, status:'completed' });
      const data = r.data.trips || [];
      setTrips(data);
      setTotal(data.length);
    } catch { setTrips([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, []);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => load(search), 380);
    return () => clearTimeout(t);
  }, [search]);

  const sorted = [...trips].sort((a,b) => {
    if (sortBy === 'most-spent') return (b.totalSpent||0) - (a.totalSpent||0);
    if (sortBy === 'longest') {
      const dA = a.startDate&&a.endDate ? new Date(a.endDate)-new Date(a.startDate) : 0;
      const dB = b.startDate&&b.endDate ? new Date(b.endDate)-new Date(b.startDate) : 0;
      return dB - dA;
    }
    return new Date(b.createdAt||0) - new Date(a.createdAt||0);
  });

  const totalSpentAll = trips.reduce((s,t) => s+(t.totalSpent||0), 0);
  const totalDays     = trips.reduce((s,t) => {
    if (!t.startDate||!t.endDate) return s;
    return s + Math.ceil((new Date(t.endDate)-new Date(t.startDate))/86400000);
  }, 0);
  const totalPlans    = trips.reduce((s,t) => s+(t.completedPlans?.length||0), 0);

  return (
    <div className="community-page">
      {/* Hero */}
      <div className="cp-hero">
        <div className="cp-hero-content">
          <div className="cp-hero-badge"><Globe size={14}/> Community</div>
          <h1>Completed Travel Journeys</h1>
          <p>Real completed trips shared by fellow travellers — only <strong>public plans</strong> are visible. Travellers control plan visibility from their trip's Plans tab.</p>
          {/* Global stats */}
          <div className="cp-hero-stats">
            <div className="cp-hs"><span>{total}</span><label>Trips</label></div>
            <div className="cp-hs-div"/>
            <div className="cp-hs"><span>{fmt$(totalSpentAll)}</span><label>Total Spent</label></div>
            <div className="cp-hs-div"/>
            <div className="cp-hs"><span>{totalDays.toLocaleString()}</span><label>Days Travelled</label></div>
            <div className="cp-hs-div"/>
            <div className="cp-hs"><span>{totalPlans}</span><label>Plans Completed</label></div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="cp-toolbar">
        <div className="cp-search-wrap">
          <Search size={15} className="cp-search-icon"/>
          <input className="cp-search" placeholder="Search by destination, country or trip name..."
            value={search} onChange={e=>setSearch(e.target.value)}/>
          {search && <button className="cp-search-clear" onClick={()=>setSearch('')}><X size={13}/></button>}
        </div>
        <div className="cp-sort">
          <Filter size={13}/>
          {['newest','most-spent','longest'].map(s=>(
            <button key={s} className={`cp-sort-btn ${sortBy===s?'active':''}`} onClick={()=>setSortBy(s)}>
              {s==='newest'?'Newest':s==='most-spent'?'Most Spent':'Longest'}
            </button>
          ))}
        </div>
        <button className="cp-refresh" onClick={()=>load(search)} disabled={loading}>
          <RefreshCw size={14}/> Refresh
        </button>
      </div>

      {/* Content */}
      <div className="cp-body">
        {loading ? (
          <div className="cp-loading"><Loader size={32} className="spin"/><p>Loading community trips...</p></div>
        ) : sorted.length === 0 ? (
          <div className="cp-empty">
            <Users size={52} opacity={0.15}/>
            <h3>No completed trips found</h3>
            <p>{search ? `No results for "${search}"` : 'Be the first! Mark one of your trips as completed.'}</p>
          </div>
        ) : (
          <div className="cp-grid">
            {sorted.map(t => (
              <TripCard key={t._id} trip={t}
                isExpanded={expanded===t._id}
                onToggle={()=>setExpanded(p=>p===t._id?null:t._id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TripCard({ trip:t, isExpanded, onToggle }) {
  const days = t.startDate&&t.endDate ? Math.ceil((new Date(t.endDate)-new Date(t.startDate))/86400000) : null;
  const pct  = t.totalBudget>0 ? Math.min(100,Math.round((t.totalSpent/t.totalBudget)*100)) : null;
  const plans= t.completedPlans || [];
  const topSpend = Object.entries(t.byCategory||{}).sort((a,b)=>b[1]-a[1]).slice(0,3);

  return (
    <div className={`cp-card ${isExpanded?'expanded':''}`}>
      {/* Card header */}
      <div className="cp-card-header">
        <div className="cp-card-av">{t.user?.name?.[0]?.toUpperCase()||'?'}</div>
        <div className="cp-card-user">
          <span className="cp-user-name">{t.user?.name}</span>
          <span className="cp-user-dest"><MapPin size={10}/> {t.destination}{t.country?`, ${t.country}`:''}</span>
        </div>
        <span className="cp-completed-badge">✅ Completed</span>
      </div>

      {/* Trip title */}
      <h3 className="cp-card-title">{t.title}</h3>

      {/* Meta row */}
      <div className="cp-card-meta">
        {t.startDate && <span><Calendar size={11}/> {format(new Date(t.startDate),'MMM d')} – {t.endDate?format(new Date(t.endDate),'MMM d, yyyy'):''}</span>}
        {days && <span>📅 {days} days</span>}
        {t.totalBudget>0 && <span><DollarSign size={10}/> {fmt$(t.totalBudget)} budget</span>}
      </div>

      {/* Budget bar */}
      {pct !== null && (
        <div className="cp-budget-row">
          <div className="cp-budget-bar">
            <div className="cp-budget-fill" style={{ width:pct+'%', background:t.totalSpent>t.totalBudget?'#EF4444':'#22c55e' }}/>
          </div>
          <span className="cp-budget-amt">{fmt$(t.totalSpent)} spent ({pct}%)</span>
        </div>
      )}
      {!pct && t.totalSpent>0 && <div className="cp-spent-only">💸 {fmt$(t.totalSpent)} spent · {t.expenseCount} expenses</div>}

      {/* Top spending categories */}
      {topSpend.length > 0 && (
        <div className="cp-top-cats">
          {topSpend.map(([cat,amt])=>(
            <span key={cat} className="cp-cat-chip">
              {SPEND_ICONS[cat]||'💸'} {cat} · {fmt$(amt)}
            </span>
          ))}
        </div>
      )}

      {/* Completed plans section */}
      <div className="cp-plans-section">
        <div className="cp-plans-header" onClick={onToggle}>
          <div className="cp-ph-left">
            <CheckSquare size={14} color="#8B5CF6"/>
            <span className="cp-plans-count">{plans.length} Completed Plan{plans.length!==1?'s':''}</span>
          </div>
          <button className="cp-expand-btn">
            {isExpanded ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
            <span>{isExpanded?'Hide':'View all'}</span>
          </button>
        </div>

        {/* Always show first 3 plans */}
        {plans.length > 0 && (
          <div className="cp-plans-list">
            {plans.slice(0, isExpanded ? plans.length : 3).map((plan, i) => (
              <div key={plan._id||i} className="cp-plan-row">
                <div className="cp-plan-icon-wrap">
                  <span className="cp-plan-icon">{CAT_ICONS[plan.category]||'📋'}</span>
                </div>
                <div className="cp-plan-info">
                  <span className="cp-plan-name">{plan.title}</span>
                  {plan.location && <span className="cp-plan-loc"><MapPin size={9}/> {plan.location}</span>}
                  {plan.notes && <span className="cp-plan-notes">{plan.notes}</span>}
                </div>
                {plan.date && (
                  <span className="cp-plan-date">
                    {format(new Date(plan.date.slice(0,10)),'MMM d')}
                  </span>
                )}
              </div>
            ))}
            {!isExpanded && plans.length > 3 && (
              <button className="cp-see-more" onClick={onToggle}>
                +{plans.length-3} more plans — tap to expand
              </button>
            )}
          </div>
        )}
        {plans.length === 0 && <div className="cp-no-plans">No plans were recorded for this trip</div>}
      </div>
    </div>
  );
}
