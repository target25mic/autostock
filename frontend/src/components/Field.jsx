export default function Field({label,id,error,...props}){
  return <div className="mb-4"><label htmlFor={id} className="block text-sm font-semibold mb-1">{label}</label>
    <input id={id} aria-invalid={!!error} aria-describedby={error?id+'-err':undefined} className="w-full rounded border border-gray-300 bg-white px-3 py-2" {...props}/>
    {error&&<p id={id+'-err'} className="mt-1 text-sm text-accent">{error}</p>}</div>;
}
