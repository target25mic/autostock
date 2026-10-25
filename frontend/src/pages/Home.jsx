import {useCallback,useEffect,useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {api,money} from '../services/api.js';
import {useAuth} from '../context/AuthContext.jsx';
import VehicleCard from '../components/VehicleCard.jsx';
import Notice from '../components/Notice.jsx';
const sel="rounded border border-gray-300 bg-white px-3 py-2";
export default function Home(){
  const {user}=useAuth();const nav=useNavigate();
  const [all,setAll]=useState([]);const [loading,setLoading]=useState(true);const [notice,setNotice]=useState(null);
  const [f,setF]=useState({text:'',category:'',min:'',max:''});
  const load=useCallback(()=>api.vehicles().then(d=>setAll(d.vehicles)).catch(e=>setNotice({type:'error',message:e.message})).finally(()=>setLoading(false)),[]);
  useEffect(()=>{load();},[load]);
  const set=k=>e=>setF({...f,[k]:e.target.value});
  const shown=all.filter(v=>`${v.make} ${v.model}`.toLowerCase().includes(f.text.toLowerCase())&&(!f.category||v.category===f.category)&&(f.min===''||v.price>=+f.min)&&(f.max===''||v.price<=+f.max));
  const buy=async v=>{
    if(!user) return nav('/login');
    try{await api.purchase(v.id);setNotice({type:'success',message:`You purchased a ${v.make} ${v.model}.`});await load();}
    catch(e){setNotice({type:'error',message:e.message});await load();}
  };
  const stats=[['Vehicle models',all.length],['Units in stock',all.reduce((s,v)=>s+v.quantity,0)],['Inventory value',money(all.reduce((s,v)=>s+v.price*v.quantity,0))]];
  return <main className="mx-auto max-w-6xl px-4 py-6">
    <h1 className="mb-4 text-3xl font-extrabold">Inventory</h1>
    <div className="mb-6 grid gap-3 sm:grid-cols-3">{stats.map(([l,v])=><div key={l} className="rounded-lg border-l-4 border-accent bg-white p-4 shadow-sm"><p className="text-sm text-gray-600">{l}</p><p className="text-2xl font-extrabold">{v}</p></div>)}</div>
    <Notice notice={notice}/>
    <form role="search" onSubmit={e=>e.preventDefault()} className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <div><label htmlFor="q" className="block text-sm font-semibold">Search make or model</label><input id="q" className={sel+' w-full'} value={f.text} onChange={set('text')}/></div>
      <div><label htmlFor="cat" className="block text-sm font-semibold">Category</label><select id="cat" className={sel+' w-full'} value={f.category} onChange={set('category')}><option value="">All categories</option>{[...new Set(all.map(v=>v.category))].map(c=><option key={c}>{c}</option>)}</select></div>
      <div><label htmlFor="min" className="block text-sm font-semibold">Min price</label><input id="min" type="number" min="0" className={sel+' w-full'} value={f.min} onChange={set('min')}/></div>
      <div><label htmlFor="max" className="block text-sm font-semibold">Max price</label><input id="max" type="number" min="0" className={sel+' w-full'} value={f.max} onChange={set('max')}/></div>
    </form>
    {loading?<p role="status">Loading inventory…</p>:shown.length===0?<p className="rounded bg-white p-6 text-center">No vehicles match your filters. Clear the search to see everything.</p>
    :<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{shown.map(v=><VehicleCard key={v.id} vehicle={v} onPurchase={buy}/>)}</div>}
  </main>;
}
