// Single API client: every component talks to the backend through here.
async function req(path,{method='GET',body}={}){
  const r=await fetch('/api'+path,{method,credentials:'same-origin',headers:{'Content-Type':'application/json'},body:body&&JSON.stringify(body)});
  const d=await r.json().catch(()=>({}));
  if(!r.ok) throw new Error(d.error||'Request failed');
  return d;
}
export const api={
  register:b=>req('/auth/register',{method:'POST',body:b}),
  login:b=>req('/auth/login',{method:'POST',body:b}),
  logout:()=>req('/auth/logout',{method:'POST'}),
  me:()=>req('/auth/me'),
  vehicles:()=>req('/vehicles'),
  create:b=>req('/vehicles',{method:'POST',body:b}),
  update:(id,b)=>req(`/vehicles/${id}`,{method:'PUT',body:b}),
  remove:id=>req(`/vehicles/${id}`,{method:'DELETE'}),
  purchase:id=>req(`/vehicles/${id}/purchase`,{method:'POST'}),
  restock:(id,amount)=>req(`/vehicles/${id}/restock`,{method:'POST',body:{amount}}),
};
export const money=n=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(n);
