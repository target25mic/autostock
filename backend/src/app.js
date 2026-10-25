import express from 'express';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import {db,init} from './db.js';

const app=express();
app.use(express.json());
app.use(cookieParser());
const ready=init(); // create tables once (idempotent)
app.use((req,res,next)=>ready.then(()=>next(),next));

const wrap=fn=>(req,res,next)=>Promise.resolve(fn(req,res,next)).catch(next);
const fail=(status,message)=>Object.assign(new Error(message),{status});
const secret=()=>{ if(!process.env.JWT_SECRET) throw new Error('JWT_SECRET is not set'); return process.env.JWT_SECRET; };
const q=async(sql,args=[])=>(await db().execute({sql,args}));
const one=async(sql,args)=>(await q(sql,args)).rows[0]&&{...(await q(sql,args)).rows[0]};
const publicUser=u=>({id:Number(u.id),name:u.name,email:u.email,role:u.role});
const vehicle=v=>v&&{...v,id:Number(v.id),price:Number(v.price),quantity:Number(v.quantity)};

// ---- middleware ----
const requireAuth=(req,res,next)=>{
  try{ req.user=jwt.verify(req.cookies.token||'',secret()); next(); }
  catch{ next(fail(401,'Authentication required or token expired')); }
};
const requireAdmin=[requireAuth,(req,res,next)=>req.user.role==='admin'?next():next(fail(403,'Admin access required'))];

// ---- validation ----
const validVehicle=b=>{
  const s=k=>typeof b[k]==='string'&&b[k].trim();
  if(!s('make')||!s('model')||!s('category')) throw fail(400,'make, model and category are required');
  if(typeof b.price!=='number'||!(b.price>=0)) throw fail(400,'price must be a number >= 0');
  if(!Number.isInteger(b.quantity)||b.quantity<0) throw fail(400,'quantity must be an integer >= 0');
  return [b.make.trim(),b.model.trim(),b.category.trim(),b.price,b.quantity];
};
const getId=req=>{ const id=Number(req.params.id); return Number.isInteger(id)&&id>0?id:null; };
const find=async id=>{ const v=id&&vehicle(await one('SELECT * FROM vehicles WHERE id=?',[id])); if(!v) throw fail(404,'Vehicle not found'); return v; };

// ---- auth routes ----
app.post('/api/auth/register',wrap(async(req,res)=>{
  const {name,email,password}=req.body||{};
  if(typeof name!=='string'||!name.trim()) throw fail(400,'Name is required');
  if(typeof email!=='string'||!/^\S+@\S+\.\S+$/.test(email)) throw fail(400,'Valid email is required');
  if(typeof password!=='string'||password.length<8) throw fail(400,'Password must be at least 8 characters');
  const hash=await bcrypt.hash(password,10);
  try{ await q('INSERT INTO users(name,email,password_hash,role) VALUES(?,?,?,?)',[name.trim(),email.toLowerCase(),hash,'user']); }
  catch(e){ if(/UNIQUE/i.test(String(e.message))) throw fail(409,'Email already registered'); throw e; }
  res.status(201).json({user:publicUser(await one('SELECT * FROM users WHERE email=?',[email.toLowerCase()]))});
}));
app.post('/api/auth/login',wrap(async(req,res)=>{
  const {email,password}=req.body||{};
  const u=typeof email==='string'&&await one('SELECT * FROM users WHERE email=?',[email.toLowerCase()]);
  if(!u||typeof password!=='string'||!(await bcrypt.compare(password,u.password_hash))) throw fail(401,'Invalid email or password');
  const user=publicUser(u);
  res.cookie('token',jwt.sign(user,secret(),{expiresIn:'2h'}),{httpOnly:true,sameSite:'strict',secure:process.env.NODE_ENV==='production',maxAge:7200000});
  res.json({user});
}));
app.post('/api/auth/logout',(req,res)=>{ res.clearCookie('token'); res.json({message:'Logged out'}); });
app.get('/api/auth/me',requireAuth,(req,res)=>res.json({user:{id:req.user.id,name:req.user.name,email:req.user.email,role:req.user.role}}));

// ---- vehicle routes ----
app.get('/api/vehicles',wrap(async(req,res)=>res.json({vehicles:(await q('SELECT * FROM vehicles ORDER BY id')).rows.map(vehicle)})));
app.get('/api/vehicles/search',wrap(async(req,res)=>{
  const w=[],a=[],{make,model,category,minPrice,maxPrice}=req.query;
  for(const [k,v] of Object.entries({make,model,category})) if(v){ w.push(`LOWER(${k}) LIKE ?`); a.push(`%${String(v).toLowerCase()}%`); }
  if(minPrice!==undefined&&minPrice!==''){ if(isNaN(minPrice)) throw fail(400,'minPrice must be a number'); w.push('price>=?'); a.push(Number(minPrice)); }
  if(maxPrice!==undefined&&maxPrice!==''){ if(isNaN(maxPrice)) throw fail(400,'maxPrice must be a number'); w.push('price<=?'); a.push(Number(maxPrice)); }
  const r=await q(`SELECT * FROM vehicles ${w.length?'WHERE '+w.join(' AND '):''} ORDER BY id`,a);
  res.json({vehicles:r.rows.map(vehicle)});
}));
app.get('/api/vehicles/:id',wrap(async(req,res)=>res.json({vehicle:await find(getId(req))})));
app.post('/api/vehicles',requireAdmin,wrap(async(req,res)=>{
  const r=await q('INSERT INTO vehicles(make,model,category,price,quantity) VALUES(?,?,?,?,?)',validVehicle(req.body||{}));
  res.status(201).json({vehicle:await find(Number(r.lastInsertRowid))});
}));
app.put('/api/vehicles/:id',requireAdmin,wrap(async(req,res)=>{
  const id=getId(req); await find(id);
  await q('UPDATE vehicles SET make=?,model=?,category=?,price=?,quantity=?,updated_at=CURRENT_TIMESTAMP WHERE id=?',[...validVehicle(req.body||{}),id]);
  res.json({vehicle:await find(id)});
}));
app.delete('/api/vehicles/:id',requireAdmin,wrap(async(req,res)=>{
  const id=getId(req); await find(id); await q('DELETE FROM vehicles WHERE id=?',[id]); res.json({message:'Vehicle deleted'});
}));

// ---- inventory ----
app.post('/api/vehicles/:id/purchase',requireAuth,wrap(async(req,res)=>{
  const id=getId(req); await find(id);
  // Atomic: the stock check and decrement are ONE conditional UPDATE, so two buyers can never take the last unit.
  const r=await q('UPDATE vehicles SET quantity=quantity-1,updated_at=CURRENT_TIMESTAMP WHERE id=? AND quantity>0',[id]);
  if(r.rowsAffected===0) throw fail(409,'Vehicle is out of stock');
  res.json({message:'Purchase successful',vehicle:await find(id)});
}));
app.post('/api/vehicles/:id/restock',requireAdmin,wrap(async(req,res)=>{
  const id=getId(req),n=req.body?.amount; await find(id);
  if(!Number.isInteger(n)||n<=0) throw fail(400,'amount must be a positive integer');
  await q('UPDATE vehicles SET quantity=quantity+?,updated_at=CURRENT_TIMESTAMP WHERE id=?',[n,id]);
  res.json({vehicle:await find(id)});
}));

// ---- errors ----
app.use('/api',(req,res,next)=>next(fail(404,'Route not found')));
app.use((err,req,res,next)=>{
  if(err instanceof SyntaxError) err=fail(400,'Invalid JSON');
  const status=err.status||500;
  if(status===500) console.error(err);
  res.status(status).json({error:status===500?'Internal server error':err.message});
});
export default app;
