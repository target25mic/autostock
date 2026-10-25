import {useCallback,useEffect,useState} from 'react';
import {api,money} from '../services/api.js';import Field from '../components/Field.jsx';import Notice from '../components/Notice.jsx';
const empty={make:'',model:'',category:'',price:'',quantity:''};
export default function Admin(){
  const [list,setList]=useState([]);const [f,setF]=useState(empty);const [editId,setEditId]=useState(null);const [notice,setNotice]=useState(null);
  const load=useCallback(()=>api.vehicles().then(d=>setList(d.vehicles)).catch(e=>setNotice({type:'error',message:e.message})),[]);
  useEffect(()=>{load();},[load]);
  const set=k=>e=>setF({...f,[k]:e.target.value});
  const run=async(fn,msg)=>{try{await fn();setNotice({type:'success',message:msg});await load();return true;}catch(e){setNotice({type:'error',message:e.message});return false;}};
  const submit=async e=>{e.preventDefault();
    if(!f.make.trim()||!f.model.trim()||!f.category.trim()||f.price===''||f.quantity==='') return setNotice({type:'error',message:'Fill in every field.'});
    const body={...f,price:Number(f.price),quantity:Number(f.quantity)};
    if(await run(()=>editId?api.update(editId,body):api.create(body),editId?'Vehicle updated.':'Vehicle added.')){setF(empty);setEditId(null);}};
  const restock=v=>{const n=Number(window.prompt(`Units to add to ${v.make} ${v.model}:`,'1'));if(n) run(()=>api.restock(v.id,n),'Stock updated.');};
  const del=v=>{if(window.confirm(`Delete ${v.make} ${v.model}? This cannot be undone.`)) run(()=>api.remove(v.id),'Vehicle deleted.');};
  const btn="rounded px-2 py-1 text-sm font-semibold hover:bg-gray-100";
  return <main className="mx-auto max-w-6xl px-4 py-6"><h1 className="mb-4 text-3xl font-extrabold">Manage inventory</h1><Notice notice={notice}/>
    <form onSubmit={submit} noValidate className="mb-8 grid gap-x-4 rounded-lg bg-white p-6 shadow-sm sm:grid-cols-2 lg:grid-cols-5">
      <h2 className="mb-2 text-lg font-bold sm:col-span-2 lg:col-span-5">{editId?'Edit vehicle':'Add vehicle'}</h2>
      <Field id="make" label="Make" value={f.make} onChange={set('make')}/><Field id="model" label="Model" value={f.model} onChange={set('model')}/>
      <Field id="category" label="Category" value={f.category} onChange={set('category')}/>
      <Field id="price" label="Price (USD)" type="number" min="0" value={f.price} onChange={set('price')}/><Field id="quantity" label="Quantity" type="number" min="0" step="1" value={f.quantity} onChange={set('quantity')}/>
      <div className="flex gap-2"><button className="rounded bg-accent px-4 py-2 font-semibold text-white hover:bg-accent-dark">{editId?'Save changes':'Add vehicle'}</button>
        {editId&&<button type="button" className="rounded border px-4 py-2" onClick={()=>{setEditId(null);setF(empty);}}>Cancel</button>}</div></form>
    <div className="overflow-x-auto rounded-lg bg-white shadow-sm"><table className="w-full text-left text-sm"><thead className="bg-gray-100"><tr>{['Vehicle','Category','Price','Stock','Actions'].map(h=><th key={h} className="px-4 py-2">{h}</th>)}</tr></thead>
      <tbody>{list.map(v=><tr key={v.id} className="border-t"><td className="px-4 py-2 font-semibold">{v.make} {v.model}</td><td className="px-4 py-2">{v.category}</td><td className="px-4 py-2">{money(v.price)}</td><td className="px-4 py-2">{v.quantity}</td>
        <td className="px-4 py-2"><button className={btn} onClick={()=>{setEditId(v.id);setF({make:v.make,model:v.model,category:v.category,price:String(v.price),quantity:String(v.quantity)});}}>Edit</button>
        <button className={btn} onClick={()=>restock(v)}>Restock</button><button className={btn+' text-accent'} onClick={()=>del(v)}>Delete</button></td></tr>)}
      {list.length===0&&<tr><td colSpan="5" className="px-4 py-6 text-center">No vehicles yet. Add one above.</td></tr>}</tbody></table></div></main>;
}
