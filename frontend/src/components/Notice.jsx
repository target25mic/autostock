export default function Notice({notice}){
  if(!notice) return null;
  const ok=notice.type==='success';
  return <p role={ok?'status':'alert'} className={`mb-4 rounded px-4 py-3 text-sm font-medium ${ok?'bg-green-100 text-green-900':'bg-red-100 text-red-900'}`}>{notice.message}</p>;
}
