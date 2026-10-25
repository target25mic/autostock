import {money} from '../services/api.js';
export default function VehicleCard({vehicle:v,onPurchase}){
  const out=v.quantity===0;
  return <article className="flex flex-col overflow-hidden rounded-lg bg-white shadow-sm">
    <div aria-hidden="true" className="flex h-28 items-end bg-gradient-to-br from-gray-700 to-ink p-3 text-4xl font-black text-white/20">{v.make}</div>
    <div className="flex flex-1 flex-col p-4">
      <h3 className="text-lg font-bold">{v.make} {v.model}</h3>
      <p className="text-sm text-gray-600">{v.category}</p>
      <p className="mt-2 text-xl font-extrabold">{money(v.price)}</p>
      <p className={`text-sm ${out?'font-semibold text-accent':'text-gray-600'}`}>{out?'Out of stock':`${v.quantity} in stock`}</p>
      <button disabled={out} onClick={()=>onPurchase(v)} className="mt-4 rounded bg-accent px-4 py-2 font-semibold text-white hover:bg-accent-dark disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500">Purchase</button>
    </div></article>;
}
