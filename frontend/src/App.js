import React, { useState, useEffect, useCallback } from 'react';

// ─── CONFIG ────────────────────────────────────────────────────────────────
const API = 'http://localhost:3001/api';

// ─── STYLES ────────────────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Inter',sans-serif;background:#f8fafc;color:#0f172a;-webkit-font-smoothing:antialiased}
  ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-thumb{background:#cbd5e1;border-radius:3px}
  @keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
  @keyframes spin{to{transform:rotate(360deg)}}
  .fade{animation:fadeIn .25s ease}
  .spin{animation:spin .8s linear infinite;display:inline-block}
  input,select,textarea{font-family:inherit}
  button{cursor:pointer;font-family:inherit}
`;

// ─── THEME TOKENS ──────────────────────────────────────────────────────────
const T = {
  bg:'#f8fafc', surface:'#ffffff', border:'#e2e8f0',
  primary:'#6366f1', primaryDark:'#4f46e5', primaryLight:'#eef2ff',
  success:'#10b981', successLight:'#d1fae5',
  warning:'#f59e0b', warningLight:'#fef3c7',
  danger:'#ef4444', dangerLight:'#fee2e2',
  muted:'#64748b', text:'#0f172a', textSm:'#475569',
  gray50:'#f8fafc', gray100:'#f1f5f9', gray200:'#e2e8f0',
};

const STATUS_META = {
  RECEIVED:   { color:'#6366f1', bg:'#eef2ff', label:'Received',   icon:'📥', next:'PROCESSING' },
  PROCESSING: { color:'#f59e0b', bg:'#fef3c7', label:'Processing', icon:'⚙️',  next:'READY'      },
  READY:      { color:'#10b981', bg:'#d1fae5', label:'Ready',      icon:'✅', next:'DELIVERED'  },
  DELIVERED:  { color:'#64748b', bg:'#f1f5f9', label:'Delivered',  icon:'📦', next: null        },
};

// ─── HELPERS ───────────────────────────────────────────────────────────────
const fmt = n => `₹${Number(n).toLocaleString('en-IN')}`;
const fmtDate = d => new Date(d).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'});

async function api(path, opts={}) {
  const res = await fetch(`${API}${path}`, {
    headers:{'Content-Type':'application/json'},
    ...opts
  });
  return res.json();
}

// ─── SMALL COMPONENTS ─────────────────────────────────────────────────────

function Badge({status}){
  const m = STATUS_META[status]||STATUS_META.RECEIVED;
  return(
    <span style={{display:'inline-flex',alignItems:'center',gap:4,padding:'3px 10px',
      borderRadius:20,fontSize:11,fontWeight:600,color:m.color,background:m.bg}}>
      {m.icon} {m.label}
    </span>
  );
}

function Card({children,style={}}){
  return(
    <div style={{background:T.surface,border:`1px solid ${T.border}`,
      borderRadius:12,padding:20,...style}}>
      {children}
    </div>
  );
}

function Btn({onClick,children,variant='primary',size='md',disabled=false,style={}}){
  const variants={
    primary:{background:T.primary,color:'#fff',border:'none'},
    secondary:{background:'transparent',color:T.primary,border:`1px solid ${T.primary}`},
    danger:{background:T.danger,color:'#fff',border:'none'},
    ghost:{background:'transparent',color:T.muted,border:`1px solid ${T.border}`},
  };
  const sizes={md:{padding:'9px 18px',fontSize:13},sm:{padding:'5px 12px',fontSize:12},lg:{padding:'12px 24px',fontSize:14}};
  return(
    <button onClick={onClick} disabled={disabled}
      style={{...variants[variant],...sizes[size],borderRadius:8,fontWeight:600,
        opacity:disabled?.6:1,cursor:disabled?'not-allowed':'pointer',
        transition:'all .15s',...style}}
      onMouseOver={e=>{if(!disabled)e.target.style.opacity='.85'}}
      onMouseOut={e=>{e.target.style.opacity='1'}}>
      {children}
    </button>
  );
}

function Input({label,error,...props}){
  return(
    <div style={{display:'flex',flexDirection:'column',gap:4}}>
      {label&&<label style={{fontSize:12,fontWeight:600,color:T.textSm}}>{label}</label>}
      <input {...props}
        style={{padding:'9px 12px',border:`1px solid ${error?T.danger:T.border}`,
          borderRadius:8,fontSize:13,outline:'none',width:'100%',
          background:T.surface,color:T.text,...props.style}}
        onFocus={e=>e.target.style.borderColor=T.primary}
        onBlur={e=>e.target.style.borderColor=error?T.danger:T.border}
      />
      {error&&<span style={{fontSize:11,color:T.danger}}>{error}</span>}
    </div>
  );
}

function Toast({toasts,remove}){
  return(
    <div style={{position:'fixed',top:16,right:16,zIndex:9999,display:'flex',flexDirection:'column',gap:8}}>
      {toasts.map(t=>(
        <div key={t.id} className="fade"
          style={{padding:'12px 16px',borderRadius:10,minWidth:260,maxWidth:340,
            background:t.type==='success'?T.successLight:t.type==='error'?T.dangerLight:T.warningLight,
            border:`1px solid ${t.type==='success'?T.success:t.type==='error'?T.danger:T.warning}`,
            display:'flex',gap:10,alignItems:'flex-start'}}>
          <span>{t.type==='success'?'✅':t.type==='error'?'❌':'⚠️'}</span>
          <span style={{fontSize:13,flex:1,color:T.text}}>{t.msg}</span>
          <button onClick={()=>remove(t.id)} style={{background:'none',border:'none',cursor:'pointer',color:T.muted,fontSize:14}}>✕</button>
        </div>
      ))}
    </div>
  );
}

// ─── SIDEBAR ───────────────────────────────────────────────────────────────
function Sidebar({active,setActive}){
  const nav=[
    {id:'dashboard',icon:'📊',label:'Dashboard'},
    {id:'orders',   icon:'📋',label:'All Orders'},
    {id:'create',   icon:'➕',label:'New Order'},
  ];
  return(
    <div style={{width:220,background:'#0f172a',display:'flex',flexDirection:'column',
      padding:'0 12px',flexShrink:0,height:'100vh',position:'sticky',top:0}}>
      <div style={{padding:'24px 12px 20px'}}>
        <div style={{fontSize:18,fontWeight:700,color:'#fff',letterSpacing:'-0.02em'}}>🧺 LaundryOS</div>
        <div style={{fontSize:11,color:'#64748b',marginTop:3}}>Order Management System</div>
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:2}}>
        {nav.map(n=>{
          const isActive=active===n.id;
          return(
            <button key={n.id} onClick={()=>setActive(n.id)}
              style={{display:'flex',alignItems:'center',gap:10,padding:'10px 14px',
                borderRadius:8,border:'none',background:isActive?'#6366f1':'transparent',
                color:isActive?'#fff':'#94a3b8',fontSize:13,fontWeight:isActive?600:400,
                textAlign:'left',width:'100%',transition:'all .15s',cursor:'pointer'}}
              onMouseOver={e=>{if(!isActive){e.currentTarget.style.background='#1e293b';e.currentTarget.style.color='#fff'}}}
              onMouseOut={e=>{if(!isActive){e.currentTarget.style.background='transparent';e.currentTarget.style.color='#94a3b8'}}}>
              <span style={{fontSize:15}}>{n.icon}</span>{n.label}
            </button>
          );
        })}
      </div>
      <div style={{flex:1}}/>
      <div style={{padding:'16px 12px',margin:'0 0 16px'}}>
        <div style={{background:'#1e293b',borderRadius:8,padding:'10px 12px'}}>
          <div style={{fontSize:11,color:'#6366f1',fontWeight:600}}>⚡ System Status</div>
          <div style={{fontSize:11,color:'#64748b',marginTop:2}}>API: localhost:3001</div>
        </div>
      </div>
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────
function Dashboard({addToast}){
  const [data,setData]=useState(null);
  const [loading,setLoading]=useState(true);

  const load=useCallback(async()=>{
    setLoading(true);
    try{
      const r=await api('/dashboard');
      if(r.success) setData(r.dashboard);
    }catch{addToast('Failed to load dashboard','error')}
    setLoading(false);
  },[]);

  useEffect(()=>{load();},[load]);

  if(loading) return <div style={{padding:32,textAlign:'center',color:T.muted}}><span className="spin">⟳</span> Loading...</div>;
  if(!data) return <div style={{padding:32,color:T.danger}}>Failed to load dashboard.</div>;

  const kpis=[
    {label:'Total Orders',   value:data.totalOrders||0,          icon:'📋', color:T.primary,  bg:T.primaryLight},
    {label:'Total Revenue',  value:fmt(data.totalRevenue||0),     icon:'💰', color:'#059669',  bg:'#d1fae5'},
    {label:"Today's Orders", value:data.today?.orders||0,  icon:'📅', color:'#d97706', bg:'#fef3c7'},
    {label:'Avg Order Value',value:fmt(data.averageOrderValue||0),icon:'📈', color:'#7c3aed',  bg:'#ede9fe'},
  ];

  const statusData=data.byStatus||data.ordersPerStatus||{};

  return(
    <div style={{padding:28,display:'flex',flexDirection:'column',gap:24}}>
      <div>
        <h1 style={{fontSize:20,fontWeight:700}}>Dashboard</h1>
        <p style={{fontSize:13,color:T.muted,marginTop:2}}>Live overview of your laundry operations</p>
      </div>

      {/* KPIs */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14}}>
        {kpis.map(k=>(
          <Card key={k.label} style={{borderTop:`3px solid ${k.color}`,padding:18}} className="fade">
            <div style={{fontSize:22,marginBottom:8}}>{k.icon}</div>
            <div style={{fontSize:26,fontWeight:700,fontFamily:"'JetBrains Mono',monospace",color:k.color}}>{k.value}</div>
            <div style={{fontSize:12,color:T.muted,marginTop:4}}>{k.label}</div>
          </Card>
        ))}
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
        {/* Status breakdown */}
        <Card>
          <div style={{fontWeight:600,fontSize:14,marginBottom:16}}>Orders by Status</div>
          <div style={{display:'flex',flexDirection:'column',gap:10}}>
            {Object.entries(STATUS_META).map(([s,m])=>{
              const count=statusData[s]||0;
              const total=Object.values(statusData).reduce((a,b)=>a+b,0)||1;
              return(
                <div key={s}>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                    <span style={{fontSize:13,display:'flex',alignItems:'center',gap:6}}>
                      <span className="chip" style={{display:'inline-block',width:8,height:8,borderRadius:'50%',background:m.color}}/>
                      {m.icon} {m.label}
                    </span>
                    <span style={{fontSize:13,fontWeight:600,fontFamily:"'JetBrains Mono',monospace"}}>{count}</span>
                  </div>
                  <div style={{height:5,background:T.gray100,borderRadius:3}}>
                    <div style={{height:'100%',width:`${(count/total)*100}%`,background:m.color,borderRadius:3,transition:'width .6s ease'}}/>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Top garments */}
        <Card>
          <div style={{fontWeight:600,fontSize:14,marginBottom:16}}>Top Garments</div>
          {(data.topGarments||[]).length===0?(
            <p style={{fontSize:13,color:T.muted}}>No data yet.</p>
          ):(
            <div style={{display:'flex',flexDirection:'column',gap:10}}>
              {(data.topGarments||[]).slice(0,6).map((g,i)=>(
                <div key={i} style={{display:'flex',alignItems:'center',gap:10}}>
                  <span style={{fontSize:11,color:T.muted,fontFamily:"'JetBrains Mono',monospace",minWidth:16}}>#{i+1}</span>
                  <span style={{fontSize:13,flex:1}}>{g.label||g.type}</span>
                  <span style={{fontSize:12,fontWeight:600,color:T.primary,fontFamily:"'JetBrains Mono',monospace"}}>×{g.count}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <div style={{textAlign:'right'}}>
        <Btn onClick={load} variant="ghost" size="sm">⟳ Refresh</Btn>
      </div>
    </div>
  );
}

// ─── ORDER LIST ────────────────────────────────────────────────────────────
function OrderList({addToast,onViewOrder}){
  const [orders,setOrders]=useState([]);
  const [loading,setLoading]=useState(true);
  const [filters,setFilters]=useState({status:'',name:'',phone:''});
  const [updating,setUpdating]=useState(null);

  const load=useCallback(async()=>{
    setLoading(true);
    try{
      const params=new URLSearchParams();
      if(filters.status) params.set('status',filters.status);
      if(filters.name)   params.set('name',filters.name);
      if(filters.phone)  params.set('phone',filters.phone);
      const r=await api(`/orders?${params}`);
      if(r.success) setOrders(r.orders||[]);
      else addToast(r.error||'Failed to load orders','error');
    }catch{addToast('Network error','error')}
    setLoading(false);
  },[filters]);

  useEffect(()=>{load();},[load]);

  async function advanceStatus(order){
    const next=STATUS_META[order.status]?.next;
    if(!next) return;
    setUpdating(order.id||order.orderId);
    try{
      const id=order.id||order.orderId;
      const r=await api(`/orders/${id}/status`,{
        method:'PATCH',
        body:JSON.stringify({status:next})
      });
      if(r.success){
        addToast(`Order moved to ${next}`,'success');
        load();
      } else addToast(r.error||'Update failed','error');
    }catch{addToast('Network error','error')}
    setUpdating(null);
  }

  const totalShown=orders.length;

  return(
    <div style={{padding:28,display:'flex',flexDirection:'column',gap:20}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-end'}}>
        <div>
          <h1 style={{fontSize:20,fontWeight:700}}>All Orders</h1>
          <p style={{fontSize:13,color:T.muted,marginTop:2}}>{totalShown} order{totalShown!==1?'s':''} found</p>
        </div>
        <Btn onClick={load} variant="ghost" size="sm">⟳ Refresh</Btn>
      </div>

      {/* Filters */}
      <Card style={{padding:16}}>
        <div style={{fontSize:12,fontWeight:600,color:T.muted,marginBottom:10}}>FILTERS</div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 2fr 2fr',gap:10}}>
          <div>
            <label style={{fontSize:12,fontWeight:600,color:T.textSm,display:'block',marginBottom:4}}>Status</label>
            <select value={filters.status} onChange={e=>setFilters(p=>({...p,status:e.target.value}))}
              style={{padding:'9px 12px',border:`1px solid ${T.border}`,borderRadius:8,fontSize:13,
                width:'100%',background:T.surface,color:T.text,outline:'none'}}>
              <option value="">All Statuses</option>
              {Object.entries(STATUS_META).map(([k,v])=>(
                <option key={k} value={k}>{v.icon} {v.label}</option>
              ))}
            </select>
          </div>
          <Input label="Customer Name" placeholder="Search by name…"
            value={filters.name} onChange={e=>setFilters(p=>({...p,name:e.target.value}))}/>
          <Input label="Phone Number" placeholder="Search by phone…"
            value={filters.phone} onChange={e=>setFilters(p=>({...p,phone:e.target.value}))}/>
        </div>
        <div style={{marginTop:10,display:'flex',gap:8}}>
          <Btn onClick={load} size="sm">Search</Btn>
          <Btn onClick={()=>setFilters({status:'',name:'',phone:''})} variant="ghost" size="sm">Clear</Btn>
        </div>
      </Card>

      {/* Table */}
      {loading?(
        <div style={{textAlign:'center',padding:40,color:T.muted}}><span className="spin">⟳</span> Loading orders…</div>
      ):orders.length===0?(
        <div style={{textAlign:'center',padding:40,color:T.muted}}>
          <div style={{fontSize:32,marginBottom:8}}>📭</div>
          <div style={{fontSize:14}}>No orders found</div>
        </div>
      ):(
        <Card style={{padding:0,overflow:'hidden'}}>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead>
              <tr style={{background:T.gray50,borderBottom:`1px solid ${T.border}`}}>
                {['Order ID','Customer','Phone','Garments','Total','Status','Est. Delivery','Actions'].map(h=>(
                  <th key={h} style={{padding:'10px 14px',textAlign:'left',fontSize:11,
                    fontWeight:700,color:T.muted,textTransform:'uppercase',letterSpacing:'.04em'}}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.map((o,i)=>{
                const id=o.id||o.orderId;
                const isUpdating=updating===id;
                const next=STATUS_META[o.status]?.next;
                return(
                  <tr key={id} className="fade"
                    style={{borderBottom:i<orders.length-1?`1px solid ${T.border}`:'none',
                      background:i%2===0?T.surface:T.gray50}}>
                    <td style={{padding:'12px 14px'}}>
                      <span style={{fontSize:11,fontFamily:"'JetBrains Mono',monospace",
                        color:T.primary,fontWeight:600}}>{id}</span>
                    </td>
                    <td style={{padding:'12px 14px',fontWeight:500,fontSize:13}}>
                      {o.customer?.name||o.customerName}
                    </td>
                    <td style={{padding:'12px 14px',fontSize:12,color:T.muted,fontFamily:"'JetBrains Mono',monospace"}}>
                      {o.customer?.phone||o.phoneNumber}
                    </td>
                    <td style={{padding:'12px 14px'}}>
                      <div style={{display:'flex',flexWrap:'wrap',gap:4}}>
                        {(o.garments||[]).slice(0,3).map((g,gi)=>(
                          <span key={gi} style={{fontSize:11,padding:'2px 7px',borderRadius:4,
                            background:T.primaryLight,color:T.primary,fontWeight:500}}>
                            {g.label||g.type} ×{g.quantity||g.qty}
                          </span>
                        ))}
                        {(o.garments||[]).length>3&&(
                          <span style={{fontSize:11,color:T.muted}}>+{(o.garments||[]).length-3} more</span>
                        )}
                      </div>
                    </td>
                    <td style={{padding:'12px 14px',fontWeight:700,fontSize:13,
                      fontFamily:"'JetBrains Mono',monospace",color:'#059669'}}>
                      {fmt(o.totalAmount||o.billAmount||0)}
                    </td>
                    <td style={{padding:'12px 14px'}}><Badge status={o.status}/></td>
                    <td style={{padding:'12px 14px',fontSize:11,color:T.muted}}>
                      {o.estimatedDelivery?fmtDate(o.estimatedDelivery):'—'}
                    </td>
                    <td style={{padding:'12px 14px'}}>
                      <div style={{display:'flex',gap:6}}>
                        <Btn onClick={()=>onViewOrder(o)} variant="ghost" size="sm">View</Btn>
                        {next&&(
                          <Btn onClick={()=>advanceStatus(o)} size="sm" disabled={isUpdating}
                            style={{background:STATUS_META[next].color}}>
                            {isUpdating?<span className="spin">⟳</span>:`→ ${STATUS_META[next].label}`}
                          </Btn>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}

// ─── ORDER DETAIL MODAL ────────────────────────────────────────────────────
function OrderModal({order,onClose,addToast,onUpdated}){
  const [updating,setUpdating]=useState(false);
  if(!order) return null;

  const id=order.id||order.orderId;
  const next=STATUS_META[order.status]?.next;

  async function advance(){
    if(!next) return;
    setUpdating(true);
    try{
      const r=await api(`/orders/${id}/status`,{
        method:'PATCH',body:JSON.stringify({status:next})
      });
      if(r.success){addToast(`Moved to ${next}`,'success');onUpdated(r.order);}
      else addToast(r.error,'error');
    }catch{addToast('Network error','error')}
    setUpdating(false);
  }

  return(
    <div onClick={onClose}
      style={{position:'fixed',inset:0,background:'rgba(0,0,0,.5)',zIndex:1000,
        display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
      <div onClick={e=>e.stopPropagation()} className="fade"
        style={{background:T.surface,borderRadius:16,padding:28,width:'100%',
          maxWidth:560,maxHeight:'90vh',overflowY:'auto',boxShadow:'0 20px 60px rgba(0,0,0,.3)'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:20}}>
          <div>
            <div style={{fontSize:18,fontWeight:700}}>{id}</div>
            <div style={{fontSize:12,color:T.muted,marginTop:2}}>Created {fmtDate(order.createdAt)}</div>
          </div>
          <button onClick={onClose} style={{background:'none',border:'none',fontSize:20,cursor:'pointer',color:T.muted}}>✕</button>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:20}}>
          <div style={{background:T.gray50,borderRadius:8,padding:12}}>
            <div style={{fontSize:11,color:T.muted,fontWeight:600}}>CUSTOMER</div>
            <div style={{fontSize:15,fontWeight:600,marginTop:4}}>{order.customer?.name||order.customerName}</div>
            <div style={{fontSize:12,color:T.muted,fontFamily:"'JetBrains Mono',monospace"}}>{order.customer?.phone||order.phoneNumber}</div>
          </div>
          <div style={{background:T.gray50,borderRadius:8,padding:12}}>
            <div style={{fontSize:11,color:T.muted,fontWeight:600}}>STATUS & DELIVERY</div>
            <div style={{marginTop:4}}><Badge status={order.status}/></div>
            <div style={{fontSize:11,color:T.muted,marginTop:4}}>
              {order.estimatedDelivery?`Est. ${fmtDate(order.estimatedDelivery)}`:'—'}
            </div>
          </div>
        </div>

        <div style={{marginBottom:20}}>
          <div style={{fontSize:12,fontWeight:600,color:T.muted,marginBottom:10}}>GARMENTS</div>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead>
              <tr style={{background:T.gray100}}>
                {['Item','Qty','Price/Item','Subtotal'].map(h=>(
                  <th key={h} style={{padding:'8px 10px',textAlign:h==='Item'?'left':'right',
                    fontSize:11,fontWeight:600,color:T.muted}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(order.garments||[]).map((g,i)=>(
                <tr key={i} style={{borderBottom:`1px solid ${T.border}`}}>
                  <td style={{padding:'9px 10px',fontSize:13}}>{g.label||g.type}</td>
                  <td style={{padding:'9px 10px',textAlign:'right',fontSize:13}}>{g.quantity||g.qty}</td>
                  <td style={{padding:'9px 10px',textAlign:'right',fontSize:13}}>{fmt(g.pricePerItem)}</td>
                  <td style={{padding:'9px 10px',textAlign:'right',fontSize:13,fontWeight:600}}>{fmt(g.subtotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{textAlign:'right',marginTop:10,fontSize:16,fontWeight:700,color:'#059669'}}>
            Total: {fmt(order.totalAmount||order.billAmount||0)}
          </div>
        </div>

        {/* Status flow */}
        <div style={{marginBottom:20}}>
          <div style={{fontSize:12,fontWeight:600,color:T.muted,marginBottom:10}}>STATUS PIPELINE</div>
          <div style={{display:'flex',alignItems:'center',gap:0}}>
            {Object.entries(STATUS_META).map(([s,m],i,arr)=>{
              const done=Object.keys(STATUS_META).indexOf(order.status)>=i;
              return(
                <React.Fragment key={s}>
                  <div style={{flex:1,textAlign:'center'}}>
                    <div style={{width:28,height:28,borderRadius:'50%',margin:'0 auto 4px',
                      background:done?m.color:T.gray200,display:'flex',alignItems:'center',
                      justifyContent:'center',fontSize:13}}>{m.icon}</div>
                    <div style={{fontSize:10,fontWeight:600,color:done?m.color:T.muted}}>{m.label}</div>
                  </div>
                  {i<arr.length-1&&(
                    <div style={{height:2,flex:.5,background:done?T.primary:T.gray200,
                      position:'relative',top:-10}}/>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
          <Btn onClick={onClose} variant="ghost">Close</Btn>
          {next&&(
            <Btn onClick={advance} disabled={updating}>
              {updating?<span className="spin">⟳</span>:`Mark as ${next}`}
            </Btn>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── CREATE ORDER ─────────────────────────────────────────────────────────
const CATALOG=[
  {type:'shirt',label:'Shirt',price:40},{type:'tshirt',label:'T-Shirt',price:30},
  {type:'pants',label:'Pants',price:50},{type:'jeans',label:'Jeans',price:60},
  {type:'saree',label:'Saree',price:120},{type:'kurta',label:'Kurta',price:40},
  {type:'salwar',label:'Salwar Suit',price:80},{type:'jacket',label:'Jacket',price:100},
  {type:'blazer',label:'Blazer',price:120},{type:'suit',label:'Suit (2 pc)',price:200},
  {type:'bedsheet',label:'Bedsheet',price:80},{type:'blanket',label:'Blanket',price:150},
  {type:'curtain',label:'Curtain',price:100},{type:'towel',label:'Towel',price:25},
  {type:'dress',label:'Dress',price:80},{type:'skirt',label:'Skirt',price:50},
  {type:'shorts',label:'Shorts',price:30},{type:'sweater',label:'Sweater',price:70},
];

function CreateOrder({addToast,onCreated}){
  const [form,setForm]=useState({customerName:'',phone:''});
  const [rows,setRows]=useState([{type:'shirt',qty:1,price:40}]);
  const [errors,setErrors]=useState({});
  const [loading,setLoading]=useState(false);
  const [created,setCreated]=useState(null);

  const total=rows.reduce((s,r)=>s+(r.price*r.qty),0);

  function setField(k,v){setForm(p=>({...p,[k]:v}));setErrors(p=>({...p,[k]:''}));}

  function addRow(){setRows(p=>[...p,{type:'shirt',qty:1,price:40}]);}
  function removeRow(i){if(rows.length>1)setRows(p=>p.filter((_,idx)=>idx!==i));}
  function setRow(i,k,v){
    setRows(p=>p.map((r,idx)=>{
      if(idx!==i) return r;
      if(k==='type'){const c=CATALOG.find(x=>x.type===v);return{...r,type:v,price:c?.price||r.price};}
      return{...r,[k]:v};
    }));
  }

  function validate(){
    const e={};
    if(!form.customerName.trim()) e.customerName='Customer name is required';
    if(!/^\d{10}$/.test(form.phone)) e.phone='Enter a valid 10-digit phone number';
    if(rows.some(r=>r.qty<1||!r.qty)) e.garments='All garment quantities must be ≥ 1';
    setErrors(e);
    return Object.keys(e).length===0;
  }

  async function submit(){
    if(!validate()) return;
    setLoading(true);
    try{
      const r=await api('/orders',{
        method:'POST',
        body:JSON.stringify({
          customerName:form.customerName.trim(),
          phone:form.phone.trim(),
          garments:rows.map(r=>({type:r.type,qty:parseInt(r.qty),pricePerItem:r.price}))
        })
      });
      if(r.success){
        setCreated(r.order);
        addToast('Order created successfully!','success');
        onCreated?.();
      } else {
        addToast(r.error||'Failed to create order','error');
      }
    }catch{addToast('Network error. Is the backend running?','error')}
    setLoading(false);
  }

  function reset(){setCreated(null);setForm({customerName:'',phone:''});setRows([{type:'shirt',qty:1,price:40}]);setErrors({});}

  if(created){
    return(
      <div style={{padding:28}}>
        <Card className="fade" style={{maxWidth:500,margin:'0 auto',textAlign:'center',padding:32}}>
          <div style={{fontSize:40,marginBottom:12}}>✅</div>
          <div style={{fontSize:18,fontWeight:700,marginBottom:4}}>Order Created!</div>
          <div style={{fontSize:13,color:T.muted,marginBottom:20}}>Your order has been received</div>
          <div style={{background:T.primaryLight,borderRadius:10,padding:16,marginBottom:20}}>
            <div style={{fontSize:11,color:T.muted,fontWeight:600}}>ORDER ID</div>
            <div style={{fontSize:22,fontWeight:700,color:T.primary,fontFamily:"'JetBrains Mono',monospace",marginTop:4}}>
              {created.id||created.orderId}
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginTop:12}}>
              <div>
                <div style={{fontSize:11,color:T.muted}}>Customer</div>
                <div style={{fontSize:13,fontWeight:600}}>{created.customer?.name||created.customerName}</div>
              </div>
              <div>
                <div style={{fontSize:11,color:T.muted}}>Total Bill</div>
                <div style={{fontSize:16,fontWeight:700,color:'#059669'}}>{fmt(created.totalAmount||created.billAmount||0)}</div>
              </div>
              <div>
                <div style={{fontSize:11,color:T.muted}}>Status</div>
                <Badge status="RECEIVED"/>
              </div>
              <div>
                <div style={{fontSize:11,color:T.muted}}>Est. Delivery</div>
                <div style={{fontSize:12,fontWeight:600}}>{created.estimatedDelivery?fmtDate(created.estimatedDelivery):'—'}</div>
              </div>
            </div>
          </div>
          <div style={{display:'flex',gap:8,justifyContent:'center'}}>
            <Btn onClick={reset}>+ New Order</Btn>
            <Btn onClick={()=>window.print()} variant="ghost">🖨️ Print</Btn>
          </div>
        </Card>
      </div>
    );
  }

  return(
    <div style={{padding:28,display:'flex',flexDirection:'column',gap:20,maxWidth:720}}>
      <div>
        <h1 style={{fontSize:20,fontWeight:700}}>Create New Order</h1>
        <p style={{fontSize:13,color:T.muted,marginTop:2}}>Fill in customer details and garment list</p>
      </div>

      {/* Customer */}
      <Card>
        <div style={{fontSize:12,fontWeight:600,color:T.muted,marginBottom:14}}>CUSTOMER DETAILS</div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
          <Input label="Customer Name *" placeholder="e.g. Arjun Sharma"
            value={form.customerName} onChange={e=>setField('customerName',e.target.value)}
            error={errors.customerName}/>
          <Input label="Phone Number *" placeholder="10-digit number"
            value={form.phone} onChange={e=>setField('phone',e.target.value)}
            error={errors.phone} maxLength={10}/>
        </div>
      </Card>

      {/* Garments */}
      <Card>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
          <div style={{fontSize:12,fontWeight:600,color:T.muted}}>GARMENTS</div>
          <Btn onClick={addRow} size="sm">+ Add Item</Btn>
        </div>
        {errors.garments&&<div style={{fontSize:12,color:T.danger,marginBottom:8}}>{errors.garments}</div>}
        <div style={{display:'flex',flexDirection:'column',gap:8}}>
          {rows.map((row,i)=>(
            <div key={i} style={{display:'grid',gridTemplateColumns:'2fr 1fr 1fr auto',gap:10,alignItems:'end'}}>
              <div>
                {i===0&&<label style={{display:'block',fontSize:12,fontWeight:600,color:T.textSm,marginBottom:4}}>Garment</label>}
                <select value={row.type} onChange={e=>setRow(i,'type',e.target.value)}
                  style={{padding:'9px 12px',border:`1px solid ${T.border}`,borderRadius:8,fontSize:13,
                    width:'100%',background:T.surface,color:T.text,outline:'none'}}>
                  {CATALOG.map(c=>(
                    <option key={c.type} value={c.type}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div>
                {i===0&&<label style={{display:'block',fontSize:12,fontWeight:600,color:T.textSm,marginBottom:4}}>Qty</label>}
                <input type="number" min={1} value={row.qty} onChange={e=>setRow(i,'qty',parseInt(e.target.value)||1)}
                  style={{padding:'9px 12px',border:`1px solid ${T.border}`,borderRadius:8,fontSize:13,
                    width:'100%',outline:'none',background:T.surface,color:T.text}}/>
              </div>
              <div>
                {i===0&&<label style={{display:'block',fontSize:12,fontWeight:600,color:T.textSm,marginBottom:4}}>Price/Item (₹)</label>}
                <input type="number" min={1} value={row.price} onChange={e=>setRow(i,'price',parseInt(e.target.value)||0)}
                  style={{padding:'9px 12px',border:`1px solid ${T.border}`,borderRadius:8,fontSize:13,
                    width:'100%',outline:'none',background:T.surface,color:T.text}}/>
              </div>
              <button onClick={()=>removeRow(i)} disabled={rows.length===1}
                style={{padding:'9px 12px',border:`1px solid ${T.border}`,borderRadius:8,
                  background:'none',cursor:rows.length===1?'not-allowed':'pointer',
                  color:rows.length===1?T.muted:T.danger,fontSize:14,
                  marginTop:i===0?0:'auto'}}>✕</button>
            </div>
          ))}
        </div>
      </Card>

      {/* Summary */}
      <Card style={{background:T.primaryLight,border:`1px solid ${T.primary}30`}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div>
            <div style={{fontSize:12,color:T.muted,fontWeight:600}}>ORDER SUMMARY</div>
            <div style={{fontSize:13,color:T.textSm,marginTop:2}}>
              {rows.reduce((s,r)=>s+r.qty,0)} garment{rows.reduce((s,r)=>s+r.qty,0)!==1?'s':''} · {rows.length} type{rows.length!==1?'s':''}
            </div>
          </div>
          <div style={{textAlign:'right'}}>
            <div style={{fontSize:11,color:T.muted}}>TOTAL BILL</div>
            <div style={{fontSize:28,fontWeight:700,color:T.primary,fontFamily:"'JetBrains Mono',monospace"}}>{fmt(total)}</div>
          </div>
        </div>
      </Card>

      <Btn onClick={submit} size="lg" disabled={loading} style={{alignSelf:'flex-start',minWidth:160}}>
        {loading?<><span className="spin">⟳</span> Creating…</>:'✓ Create Order'}
      </Btn>
    </div>
  );
}

// ─── ROOT APP ─────────────────────────────────────────────────────────────
export default function App(){
  const [page,setPage]=useState('dashboard');
  const [toasts,setToasts]=useState([]);
  const [modalOrder,setModalOrder]=useState(null);

  function addToast(msg,type='info'){
    const id=Date.now();
    setToasts(p=>[...p,{id,msg,type}]);
    setTimeout(()=>setToasts(p=>p.filter(t=>t.id!==id)),4000);
  }

  function removeToast(id){setToasts(p=>p.filter(t=>t.id!==id));}

  function handleUpdatedOrder(updated){
    setModalOrder(updated);
  }

  return(
    <>
      <style>{css}</style>
      <div style={{display:'flex',height:'100vh',overflow:'hidden'}}>
        <Sidebar active={page} setActive={setPage}/>
        <div style={{flex:1,overflowY:'auto'}}>
          {page==='dashboard'&&<Dashboard addToast={addToast}/>}
          {page==='orders'&&<OrderList addToast={addToast} onViewOrder={setModalOrder}/>}
          {page==='create'&&<CreateOrder addToast={addToast} onCreated={()=>setPage('orders')}/>}
        </div>
      </div>
      {modalOrder&&(
        <OrderModal order={modalOrder} onClose={()=>setModalOrder(null)}
          addToast={addToast} onUpdated={handleUpdatedOrder}/>
      )}
      <Toast toasts={toasts} remove={removeToast}/>
    </>
  );
}
