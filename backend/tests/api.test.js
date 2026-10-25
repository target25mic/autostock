import {describe,it,expect,beforeAll} from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import app from '../src/app.js';
import {db,init} from '../src/db.js';

const user={name:'Ann',email:'ann@x.com',password:'password1'};
let admin, member;
const car={make:'Toyota',model:'Camry',category:'Sedan',price:25000,quantity:2};

beforeAll(async()=>{
  await init();
  await db().execute({sql:'INSERT INTO users(name,email,password_hash,role) VALUES(?,?,?,?)',args:['Boss','boss@x.com',await bcrypt.hash('adminpass1',4),'admin']});
  admin=request.agent(app); await admin.post('/api/auth/login').send({email:'boss@x.com',password:'adminpass1'});
  member=request.agent(app);
});

describe('auth',()=>{
  it('registers a user without exposing hash and ignores role',async()=>{
    const r=await request(app).post('/api/auth/register').send({...user,role:'admin'});
    expect(r.status).toBe(201); expect(r.body.user.role).toBe('user'); expect(JSON.stringify(r.body)).not.toContain('hash');
    const row=await db().execute({sql:'SELECT password_hash FROM users WHERE email=?',args:[user.email]});
    expect(row.rows[0].password_hash).not.toBe(user.password);
  });
  it('rejects duplicate email',async()=>{ expect((await request(app).post('/api/auth/register').send(user)).status).toBe(409); });
  it('rejects invalid registration input',async()=>{ expect((await request(app).post('/api/auth/register').send({name:'',email:'bad',password:'1'})).status).toBe(400); });
  it('logs in, returns /me, logs out',async()=>{
    expect((await member.post('/api/auth/login').send({email:user.email,password:user.password})).status).toBe(200);
    expect((await member.get('/api/auth/me')).body.user.email).toBe(user.email);
    await member.post('/api/auth/logout');
    expect((await member.get('/api/auth/me')).status).toBe(401);
    await member.post('/api/auth/login').send({email:user.email,password:user.password});
  });
  it('rejects wrong credentials',async()=>{
    expect((await request(app).post('/api/auth/login').send({email:user.email,password:'wrongpass1'})).status).toBe(401);
    expect((await request(app).post('/api/auth/login').send({email:'no@x.com',password:'whatever12'})).status).toBe(401);
  });
  it('rejects garbage token',async()=>{ expect((await request(app).get('/api/auth/me').set('Cookie','token=abc')).status).toBe(401); });
});

describe('vehicles',()=>{
  let id;
  it('blocks non-admin creation',async()=>{
    expect((await request(app).post('/api/vehicles').send(car)).status).toBe(401);
    expect((await member.post('/api/vehicles').send(car)).status).toBe(403);
  });
  it('admin creates and validates',async()=>{
    const r=await admin.post('/api/vehicles').send(car); expect(r.status).toBe(201); id=r.body.vehicle.id;
    expect((await admin.post('/api/vehicles').send({...car,price:-1})).status).toBe(400);
    expect((await admin.post('/api/vehicles').send({...car,quantity:-1})).status).toBe(400);
    expect((await admin.post('/api/vehicles').send({...car,make:''})).status).toBe(400);
    await admin.post('/api/vehicles').send({make:'Honda',model:'Civic',category:'Sedan',price:30000,quantity:1});
    await admin.post('/api/vehicles').send({make:'Ford',model:'F-150',category:'Truck',price:50000,quantity:3});
  });
  it('lists and gets details',async()=>{
    expect((await request(app).get('/api/vehicles')).body.vehicles.length).toBe(3);
    expect((await request(app).get(`/api/vehicles/${id}`)).body.vehicle.model).toBe('Camry');
    expect((await request(app).get('/api/vehicles/9999')).status).toBe(404);
    expect((await request(app).get('/api/vehicles/abc')).status).toBe(404);
  });
  it('searches case-insensitively with combined filters',async()=>{
    expect((await request(app).get('/api/vehicles/search?make=toyo')).body.vehicles.length).toBe(1);
    expect((await request(app).get('/api/vehicles/search?category=SEDAN&maxPrice=26000')).body.vehicles.length).toBe(1);
    expect((await request(app).get('/api/vehicles/search?minPrice=40000')).body.vehicles[0].make).toBe('Ford');
    expect((await request(app).get('/api/vehicles/search?model=civ&category=truck')).body.vehicles.length).toBe(0);
  });
  it('updates and deletes (admin only)',async()=>{
    expect((await member.put(`/api/vehicles/${id}`).send(car)).status).toBe(403);
    const r=await admin.put(`/api/vehicles/${id}`).send({...car,price:26000}); expect(r.body.vehicle.price).toBe(26000);
    expect((await admin.put(`/api/vehicles/${id}`).send({...car,price:-5})).status).toBe(400);
    expect((await admin.put('/api/vehicles/9999').send(car)).status).toBe(404);
    expect((await member.delete(`/api/vehicles/${id}`)).status).toBe(403);
    const c=await admin.post('/api/vehicles').send(car);
    expect((await admin.delete(`/api/vehicles/${c.body.vehicle.id}`)).status).toBe(200);
    expect((await admin.delete(`/api/vehicles/${c.body.vehicle.id}`)).status).toBe(404);
  });
});

describe('inventory',()=>{
  const mk=async q=>(await admin.post('/api/vehicles').send({...car,model:'Inv'+Math.random(),quantity:q})).body.vehicle.id;
  it('requires login to purchase',async()=>{ const id=await mk(1); expect((await request(app).post(`/api/vehicles/${id}/purchase`)).status).toBe(401); });
  it('purchases one unit then rejects at zero stock',async()=>{
    const id=await mk(1);
    const r=await member.post(`/api/vehicles/${id}/purchase`); expect(r.status).toBe(200); expect(r.body.vehicle.quantity).toBe(0);
    expect((await member.post(`/api/vehicles/${id}/purchase`)).status).toBe(409);
  });
  it('rejects purchase of unknown vehicle',async()=>{ expect((await member.post('/api/vehicles/9999/purchase')).status).toBe(404); });
  it('never oversells under concurrent purchases',async()=>{
    const id=await mk(3);
    const rs=await Promise.all(Array.from({length:10},()=>member.post(`/api/vehicles/${id}/purchase`)));
    expect(rs.filter(r=>r.status===200).length).toBe(3);
    expect((await request(app).get(`/api/vehicles/${id}`)).body.vehicle.quantity).toBe(0);
  });
  it('restocks (admin only, positive integer)',async()=>{
    const id=await mk(0);
    expect((await member.post(`/api/vehicles/${id}/restock`).send({amount:5})).status).toBe(403);
    expect((await admin.post(`/api/vehicles/${id}/restock`).send({amount:0})).status).toBe(400);
    expect((await admin.post(`/api/vehicles/${id}/restock`).send({amount:-2})).status).toBe(400);
    expect((await admin.post(`/api/vehicles/${id}/restock`).send({amount:5})).body.vehicle.quantity).toBe(5);
    expect((await admin.post('/api/vehicles/9999/restock').send({amount:1})).status).toBe(404);
  });
  it('persists data in the database',async()=>{
    const r=await db().execute('SELECT COUNT(*) AS n FROM vehicles'); expect(Number(r.rows[0].n)).toBeGreaterThan(3);
  });
});
