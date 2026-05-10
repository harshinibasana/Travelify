import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { tripsAPI, expensesAPI } from '../utils/api';
import { format, differenceInDays } from 'date-fns';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Sector
} from 'recharts';
import {
  TrendingUp, DollarSign, Calendar, Globe,
  Award, Zap, ArrowLeft, X, ChevronRight
} from 'lucide-react';
import './TripStats.css';

const COLORS = ['#0A4D6E','#E8614D','#6B8F71','#F5A623','#8B5CF6','#EC4899','#14B8A6','#F97316'];
// Daily palette: each colour named after time-of-day / mood
// cool blues → warm oranges → sage greens → golden yellows → purples → teals
const DAY_PAL = [
  '#0A4D6E','#1A7FA8','#2196C4','#38B2D8','#64C9E0', // Cool blues (Mon–Fri week 1)
  '#E8614D','#F07058','#F5896A','#F8A080','#FAB898', // Warm corals (weekend energy)
  '#6B8F71','#7DAD83','#8FC896','#A0DBA8','#B4EBBE', // Sage greens (midweek calm)
  '#F5A623','#F7B740','#F9C85C','#FBD878','#FCE594', // Golden yellows (sunny days)
  '#8B5CF6','#9D6FF8','#AE84F9','#BD98FA','#CCADFB', // Purples (creative days)
  '#14B8A6','#2DD4BF','#5EEAD4','#99F6E4','#CCFBF1', // Teals (final days)
  '#EC4899',
];

// Monthly palette: season-aware colours
const MON_PAL = [
  '#1E40AF', // Jan — deep winter blue
  '#0EA5E9', // Feb — ice blue
  '#22C55E', // Mar — spring green
  '#84CC16', // Apr — fresh lime
  '#F59E0B', // May — warm amber
  '#EF4444', // Jun — summer red
  '#F97316', // Jul — hot orange
  '#FBBF24', // Aug — golden summer
  '#F59E0B', // Sep — harvest gold
  '#B45309', // Oct — autumn brown
  '#6366F1', // Nov — twilight purple
  '#0A4D6E', // Dec — deep ocean (winter)
];

// Month names for legend
const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const CAT_EMOJI = { accommodation:'🏨', transport:'✈️', food:'🍜', activities:'🎭', shopping:'🛍️', health:'💊', visa:'📄', other:'💼' };
const fmt$ = n => n >= 1000 ? `$${(n/1000).toFixed(1)}k` : `$${Math.round(n)}`;

// Custom active pie slice
const renderActiveShape = (props) => {
  const { cx,cy,innerRadius,outerRadius,startAngle,endAngle,fill,payload,percent,value } = props;
  return (
    <g>
      <Sector cx={cx} cy={cy} innerRadius={innerRadius-4} outerRadius={outerRadius+8}
        startAngle={startAngle} endAngle={endAngle} fill={fill}/>
      <text x={cx} y={cy-10} textAnchor="middle" fill="#1e293b" fontSize={13} fontWeight={800}>
        {CAT_EMOJI[payload.cat]||'💸'} {payload.cat}
      </text>
      <text x={cx} y={cy+12} textAnchor="middle" fill="#0A4D6E" fontSize={18} fontWeight={900}>
        {fmt$(value)}
      </text>
      <text x={cx} y={cy+30} textAnchor="middle" fill="#64748b" fontSize={11}>
        {(percent*100).toFixed(1)}%
      </text>
    </g>
  );
};

export default function TripStats() {
  const [trips, setTrips]     = useState([]);
  const [allExps, setAllExps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openCard, setOpenCard] = useState(null); // which hero card is expanded
  const [activeCat, setActiveCat] = useState(0);  // active pie slice index
  const [trendView, setTrendView] = useState('daily'); // 'daily' | 'monthly'

  useEffect(() => {
    tripsAPI.getAll()
      .then(async r => {
        const t = r.data.trips || [];
        setTrips(t);
        const exps = await Promise.all(
          t.map(trip => expensesAPI.getByTrip(trip._id).then(r=>r.data.expenses||[]).catch(()=>[]))
        );
        setAllExps(exps.flat());
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="stats-loading"><div className="loader"/></div>;

  // ── Computed stats ─────────────────────────────────────────
  const completed   = trips.filter(t => t.status === 'completed');
  const totalSpent  = allExps.reduce((s,e) => s+e.amount, 0);
  const totalBudget = trips.reduce((s,t) => s+(t.totalBudget||0), 0);
  const totalDays   = trips.reduce((s,t) => {
    if (!t.startDate||!t.endDate) return s;
    return s + Math.max(1, differenceInDays(new Date(t.endDate), new Date(t.startDate)));
  }, 0);
  const countries      = [...new Set(trips.map(t=>t.country).filter(Boolean))];
  const avgSpendPerDay = totalDays > 0 ? totalSpent/totalDays : 0;
  const savingsRate    = totalBudget > 0 ? Math.round(((totalBudget-totalSpent)/totalBudget)*100) : 0;

  // Monthly line chart
  // Daily data
  const dailySpend = {};
  allExps.forEach(e => {
    if (!e.date) return;
    const d = e.date.slice ? e.date.slice(0,10) : format(new Date(e.date),'yyyy-MM-dd');
    dailySpend[d] = (dailySpend[d]||0) + e.amount;
  });
  const dailyData = Object.entries(dailySpend).sort((a,b)=>a[0].localeCompare(b[0]))
    .map(([date,amount], i) => ({ date: format(new Date(date.replace(/-/g,'/')), 'MMM d'), amount, fill: DAY_PAL[i%DAY_PAL.length] }));

  // Monthly data
  const monthlySpend = {};
  allExps.forEach(e => {
    if (!e.date) return;
    const d = e.date.slice ? e.date.slice(0,10) : format(new Date(e.date),'yyyy-MM-dd');
    const m = d.slice(0,7);
    monthlySpend[m] = (monthlySpend[m]||0) + e.amount;
  });
  const monthlyData = Object.entries(monthlySpend).sort((a,b)=>a[0].localeCompare(b[0]))
    .map(([m,amount], i) => ({ date: format(new Date((m+'-01').replace(/-/g,'/')), 'MMM yy'), amount, fill: MON_PAL[i%MON_PAL.length] }));

  // Category data for pie + bar
  const catData = Object.entries(
    allExps.reduce((acc,e) => { acc[e.category]=(acc[e.category]||0)+e.amount; return acc; }, {})
  ).map(([cat,amount],i) => ({ cat, amount, icon:CAT_EMOJI[cat]||'💸', fill:COLORS[i%COLORS.length] }))
   .sort((a,b) => b.amount-a.amount);

  // Per-trip spending
  const tripSpend = trips.map(t => ({
    ...t,
    spent: allExps.filter(e=>String(e.trip)===String(t._id)).reduce((s,e)=>s+e.amount,0)
  })).sort((a,b)=>b.spent-a.spent).filter(t=>t.spent>0);

  const statusData = [
    { name:'Planning', value:trips.filter(t=>t.status==='planning').length, color:'#3B82F6' },
    { name:'Active',   value:trips.filter(t=>t.status==='active').length,   color:'#22c55e' },
    { name:'Done',     value:completed.length,                               color:'#8B5CF6' },
    { name:'Cancelled',value:trips.filter(t=>t.status==='cancelled').length, color:'#EF4444' },
  ].filter(s=>s.value>0);

  // Hero cards definition
  const heroCards = [
    {
      id:'countries', icon:<Globe size={22}/>, label:'Countries Visited',
      val:countries.length, sub:countries.slice(0,3).join(', ')||'—', color:'ocean',
      detail: countries.length > 0 && (
        <div className="sd-countries">
          {countries.map(c=><div key={c} className="sd-country-chip"><Globe size={12}/>{c}</div>)}
        </div>
      )
    },
    {
      id:'days', icon:<Calendar size={22}/>, label:'Days Travelled',
      val:totalDays, sub:`across ${trips.length} trip${trips.length!==1?'s':''}`, color:'coral',
      detail: tripSpend.length > 0 && (
        <div className="sd-trips">
          {trips.filter(t=>t.startDate&&t.endDate).map(t=>{
            const d = Math.max(1,differenceInDays(new Date(t.endDate),new Date(t.startDate)));
            return (
              <div key={t._id} className="sd-trip-row">
                <span className="sd-trip-name">{t.title}</span>
                <span className="sd-trip-dest">{t.destination}</span>
                <span className="sd-trip-val">{d} day{d!==1?'s':''}</span>
              </div>
            );
          })}
        </div>
      )
    },
    {
      id:'spent', icon:<DollarSign size={22}/>, label:'Total Spent',
      val:fmt$(totalSpent), sub:totalBudget>0?`of ${fmt$(totalBudget)} budgeted`:'No budget set', color:'sage',
      detail: tripSpend.length > 0 && (
        <div className="sd-trips">
          {tripSpend.map((t,i)=>(
            <div key={t._id} className="sd-trip-row">
              <div className="sd-trip-dot" style={{background:COLORS[i%COLORS.length]}}/>
              <span className="sd-trip-name">{t.title}</span>
              <div className="sd-mini-bar-wrap">
                <div className="sd-mini-bar" style={{width:`${totalSpent>0?Math.round((t.spent/totalSpent)*100):0}%`,background:COLORS[i%COLORS.length]}}/>
              </div>
              <span className="sd-trip-val">{fmt$(t.spent)}</span>
            </div>
          ))}
        </div>
      )
    },
    {
      id:'avg', icon:<TrendingUp size={22}/>, label:'Avg / Day',
      val:fmt$(avgSpendPerDay), sub:`${allExps.length} expenses`, color:'gold',
      detail: monthlyData.length > 1 && (
        <ResponsiveContainer width="100%" height={140}>
          <LineChart data={monthlyData} margin={{top:5,right:10,left:0,bottom:0}}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
            <XAxis dataKey="month" tick={{fontSize:10}}/>
            <YAxis tick={{fontSize:10}} tickFormatter={v=>`$${v}`} width={45}/>
            <Tooltip formatter={v=>[`$${Number(v).toLocaleString()}`,'Spent']}/>
            <Line type="monotone" dataKey="amount" stroke="#F5A623" strokeWidth={2.5} dot={{fill:'#F5A623',r:3}}/>
          </LineChart>
        </ResponsiveContainer>
      )
    },
    {
      id:'completed', icon:<Award size={22}/>, label:'Completed Trips',
      val:completed.length, sub:`${trips.filter(t=>t.status==='planning').length} planned`, color:'purple',
      detail: statusData.length > 0 && (
        <div className="sd-status">
          {statusData.map(s=>(
            <div key={s.name} className="sd-status-row">
              <div className="sd-status-dot" style={{background:s.color}}/>
              <span className="sd-status-name">{s.name}</span>
              <div className="sd-mini-bar-wrap">
                <div className="sd-mini-bar" style={{width:`${trips.length>0?Math.round((s.value/trips.length)*100):0}%`,background:s.color}}/>
              </div>
              <span className="sd-trip-val">{s.value}</span>
            </div>
          ))}
        </div>
      )
    },
    {
      id:'savings', icon:<Zap size={22}/>, label:'Budget Saved',
      val:`${savingsRate}%`, sub:totalBudget>0?`${fmt$(totalBudget-totalSpent)} under budget`:'No budget set',
      color:savingsRate>=0?'green':'red',
      detail: totalBudget > 0 && (
        <div className="sd-budget">
          <div className="sdb-row"><span>Total Budget</span><strong>{fmt$(totalBudget)}</strong></div>
          <div className="sdb-row"><span>Total Spent</span><strong style={{color:'var(--coral)'}}>{fmt$(totalSpent)}</strong></div>
          <div className="sdb-row"><span>Saved</span><strong style={{color:'var(--sage)'}}>{fmt$(Math.max(0,totalBudget-totalSpent))}</strong></div>
          <div className="sdb-bar">
            <div className="sdb-fill" style={{width:`${Math.min(100,100-savingsRate)}%`}}/>
          </div>
          <div className="sdb-labels">
            <span>Spent {Math.min(100,100-savingsRate).toFixed(0)}%</span>
            <span>Saved {Math.max(0,savingsRate)}%</span>
          </div>
        </div>
      )
    },
  ];

  const toggleCard = (id) => setOpenCard(o => o===id ? null : id);

  return (
    <div className="stats-page page-container">
      <div className="stats-header">
        <Link to="/dashboard" className="btn btn-ghost btn-sm"><ArrowLeft size={15}/> Dashboard</Link>
        <div>
          <h1>✈️ Your Travel Stats</h1>
          <p>Insights from {trips.length} trip{trips.length!==1?'s':''} · {allExps.length} expenses tracked</p>
        </div>
      </div>

      {/* ── CLICKABLE HERO CARDS ── */}
      <div className="stats-hero-grid">
        {heroCards.map(card => (
          <div key={card.id} className={`shero-card shero-${card.color} ${openCard===card.id?'open':''} ${card.detail?'clickable':''}`}
            onClick={() => card.detail && toggleCard(card.id)}>
            <div className="shero-top">
              <div className="shero-icon">{card.icon}</div>
              <div className="shero-text">
                <div className="shero-val">{card.val}</div>
                <div className="shero-label">{card.label}</div>
                <div className="shero-sub">{card.sub}</div>
              </div>
              {card.detail && (
                <div className="shero-chevron">{openCard===card.id?<X size={14}/>:<ChevronRight size={14}/>}</div>
              )}
            </div>
            {openCard===card.id && card.detail && (
              <div className="shero-detail" onClick={e=>e.stopPropagation()}>
                {card.detail}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── CHARTS ── */}
      <div className="stats-grid">

        {/* ── PIE + BAR SIDE BY SIDE, INTERACTIVE ── */}
        {catData.length > 0 && (
          <div className="stat-card stat-wide">
            <h3>💰 Spending by Category</h3>
            <div className="cat-charts-row">

              {/* Donut pie — active slice driven by bar click */}
              <div className="cat-pie-wrap">
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      activeIndex={activeCat}
                      activeShape={renderActiveShape}
                      data={catData}
                      cx="50%" cy="50%"
                      innerRadius={70} outerRadius={110}
                      dataKey="amount"
                      paddingAngle={3}
                      onMouseEnter={(_,i)=>setActiveCat(i)}
                      onClick={(_,i)=>setActiveCat(i)}
                    >
                      {catData.map((d,i)=><Cell key={i} fill={d.fill} cursor="pointer"/>)}
                    </Pie>
                    <Tooltip formatter={v=>`$${Number(v).toLocaleString()}`}/>
                  </PieChart>
                </ResponsiveContainer>
                <div className="pie-hint">Click a bar or slice to highlight</div>
              </div>

              {/* Bar chart — clicking a bar highlights pie slice */}
              <div className="cat-bar-wrap">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart
                    data={catData}
                    layout="vertical"
                    margin={{left:0,right:50,top:4,bottom:4}}
                    onClick={d => {
                      if(d?.activeTooltipIndex!=null) setActiveCat(d.activeTooltipIndex);
                    }}
                  >
                    <XAxis type="number" tick={{fontSize:10}} tickFormatter={v=>`$${v}`}/>
                    <YAxis type="category" dataKey="cat" tick={{fontSize:11}} width={95}
                      tickFormatter={cat=>`${CAT_EMOJI[cat]||'💸'} ${cat}`}/>
                    <Tooltip formatter={v=>[`$${Number(v).toLocaleString()}`,'Spent']}
                      cursor={{fill:'rgba(10,77,110,0.05)'}}/>
                    <Bar dataKey="amount" radius={[0,7,7,0]} cursor="pointer"
                      onClick={(_,i)=>setActiveCat(i)}>
                      {catData.map((d,i)=>(
                        <Cell key={i}
                          fill={i===activeCat ? d.fill : d.fill+'88'}
                          stroke={i===activeCat ? d.fill : 'none'}
                          strokeWidth={2}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

            </div>
          </div>
        )}

        {/* Spending trend — daily + monthly toggle */}
        {(dailyData.length > 0 || monthlyData.length > 1) && (
          <div className="stat-card stat-wide">
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12,flexWrap:'wrap',gap:8}}>
              <h3 style={{margin:0}}>📈 Spending Trend</h3>
              <div style={{display:'flex',gap:4,background:'#F1F5F9',padding:'3px',borderRadius:10}}>
                {['daily','monthly'].map(v=>(
                  <button key={v} onClick={()=>setTrendView(v)}
                    style={{padding:'5px 14px',border:'none',borderRadius:7,cursor:'pointer',
                      background:trendView===v?'white':'transparent',
                      color:trendView===v?'var(--ocean)':'#64748b',
                      fontWeight:600,fontSize:12,fontFamily:'DM Sans,sans-serif',
                      boxShadow:trendView===v?'0 1px 5px rgba(0,0,0,0.1)':'none',
                      transition:'all 0.15s'}}>
                    {v.charAt(0).toUpperCase()+v.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            {(trendView==='daily'?dailyData:monthlyData).length > 0 ? (
              <>
              {/* Colour legend row */}
              {trendView==='monthly' && monthlyData.length > 0 && (
                <div style={{display:'flex',flexWrap:'wrap',gap:5,marginBottom:10}}>
                  {monthlyData.map((d,i)=>(
                    <div key={i} style={{display:'flex',alignItems:'center',gap:4,fontSize:10,color:'#475569'}}>
                      <div style={{width:10,height:10,borderRadius:3,background:d.fill,flexShrink:0}}/>
                      <span style={{fontWeight:600}}>{d.date}</span>
                      <span style={{color:'#94a3b8'}}>${d.amount>=1000?(d.amount/1000).toFixed(1)+'k':d.amount.toFixed(0)}</span>
                    </div>
                  ))}
                </div>
              )}
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={trendView==='daily'?dailyData:monthlyData}
                  margin={{top:5,right:16,left:0,bottom:5}}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false}/>
                  <XAxis dataKey="date" tick={{fontSize:10,fill:'#94a3b8'}} tickLine={false}
                    axisLine={{stroke:'#E2E8F0'}} interval="preserveStartEnd"/>
                  <YAxis tick={{fontSize:10,fill:'#94a3b8'}} tickLine={false} axisLine={false}
                    tickFormatter={v=>v>=1000?`$${(v/1000).toFixed(0)}k`:`$${v}`} width={44}/>
                  <Tooltip
                    cursor={{fill:'rgba(10,77,110,0.05)'}}
                    content={({active,payload,label})=>{
                      if(!active||!payload?.length) return null;
                      const d=payload[0];
                      return(
                        <div style={{background:'white',border:'1.5px solid #E2E8F0',borderRadius:12,padding:'10px 14px',boxShadow:'0 8px 24px rgba(0,0,0,0.12)'}}>
                          <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:7,paddingBottom:6,borderBottom:'1px solid #F1F5F9'}}>
                            <div style={{width:12,height:12,borderRadius:4,background:d.payload?.fill}}/>
                            <span style={{fontSize:13,fontWeight:700,color:'#0F172A'}}>{label}</span>
                            {trendView==='monthly'&&<span style={{fontSize:10,color:'#94a3b8',marginLeft:2}}>{d.payload?.season||''}</span>}
                          </div>
                          <div style={{display:'flex',justifyContent:'space-between',gap:16,fontSize:12}}>
                            <span style={{color:'#64748b'}}>Spent</span>
                            <strong style={{color:'#0F172A',fontSize:14}}>${Number(d.value).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</strong>
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Bar dataKey="amount" radius={[6,6,0,0]} maxBarSize={44}>
                    {(trendView==='daily'?dailyData:monthlyData).map((d,i)=>(
                      <Cell key={i} fill={d.fill || (trendView==='daily'?DAY_PAL:MON_PAL)[i%(trendView==='daily'?DAY_PAL:MON_PAL).length]}/>
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              </>
            ) : (
              <div style={{padding:'28px',textAlign:'center',color:'#94a3b8',fontSize:13}}>
                No {trendView} data yet
              </div>
            )}
            {/* Summary */}
            {(trendView==='daily'?dailyData:monthlyData).length > 0 && (() => {
              const data = trendView==='daily' ? dailyData : monthlyData;
              const max  = data.reduce((m,d)=>d.amount>m.amount?d:m,data[0]);
              const avg  = data.reduce((s,d)=>s+d.amount,0)/data.length;
              return (
                <div style={{display:'flex',gap:0,marginTop:12,padding:'10px 14px',background:'#F8FAFC',borderRadius:12,flexWrap:'wrap'}}>
                  {[
                    {label:'Peak',val:`${max.date} · $${Math.round(max.amount).toLocaleString()}`},
                    {label:`Avg/${trendView==='daily'?'day':'month'}`,val:`$${Math.round(avg).toLocaleString()}`},
                    {label:'Total',val:`$${Math.round(allExps.reduce((s,e)=>s+e.amount,0)).toLocaleString()}`},
                  ].map((item,i,arr)=>(
                    <React.Fragment key={item.label}>
                      <div style={{flex:1,padding:'0 12px',minWidth:90}}>
                        <div style={{fontSize:10,color:'#94a3b8',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.4px'}}>{item.label}</div>
                        <div style={{fontSize:13,fontWeight:700,color:'#1e293b',marginTop:2}}>{item.val}</div>
                      </div>
                      {i<arr.length-1&&<div style={{width:1,height:32,background:'#E2E8F0',alignSelf:'center'}}/>}
                    </React.Fragment>
                  ))}
                </div>
              );
            })()}
          </div>
        )}

        {/* Top destinations */}
        {trips.length > 0 && (
          <div className="stat-card">
            <h3>📍 Top Destinations</h3>
            <div className="dest-list">
              {Object.entries(
                trips.reduce((acc,t)=>{ if(t.destination)acc[t.destination]=(acc[t.destination]||0)+1; return acc; },{})
              ).sort((a,b)=>b[1]-a[1]).slice(0,6).map(([dest,count],i)=>(
                <div key={dest} className="dest-row">
                  <span className="dest-rank">#{i+1}</span>
                  <span className="dest-name">{dest}</span>
                  <span className="dest-count">{count} trip{count!==1?'s':''}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Countries visited */}
        {countries.length > 0 && (
          <div className="stat-card">
            <h3>🌍 Countries Explored</h3>
            <div className="country-grid">
              {countries.map(c=>(
                <div key={c} className="country-chip"><Globe size={11}/> {c}</div>
              ))}
            </div>
            <div className="country-total">{countries.length} countr{countries.length===1?'y':'ies'} visited</div>
          </div>
        )}

        {trips.length === 0 && (
          <div className="stat-empty">
            <div style={{fontSize:64}}>✈️</div>
            <h3>No trips yet</h3>
            <p>Create your first trip to start seeing insights here</p>
            <Link to="/trips/new" className="btn btn-primary">Plan a Trip</Link>
          </div>
        )}
      </div>
    </div>
  );
}
