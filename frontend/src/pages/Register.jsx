import {useState} from 'react';import {Link,useNavigate} from 'react-router-dom';
import {api} from '../services/api.js';import Field from '../components/Field.jsx';import Notice from '../components/Notice.jsx';
export const validate=f=>{const e={};
  if(!f.name.trim()) e.name='Enter your name.';
  if(!/^\S+@\S+\.\S+$/.test(f.email)) e.email='Enter a valid email address.';
  if(f.password.length<8) e.password='Password must be at least 8 characters.';
  if(f.confirm!==f.password) e.confirm='Passwords do not match.';
  return e;};
export default function Register(){
  const nav=useNavigate();const [f,setF]=useState({name:'',email:'',password:'',confirm:''});
  const [errors,setErrors]=useState({});const [notice,setNotice]=useState(null);
  const set=k=>e=>setF({...f,[k]:e.target.value});
  const submit=async e=>{e.preventDefault();const v=validate(f);setErrors(v);if(Object.keys(v).length) return;
    try{await api.register({name:f.name,email:f.email,password:f.password});nav('/login');}catch(err){setNotice({type:'error',message:err.message});}};
  return <main className="mx-auto max-w-md px-4 py-10"><h1 className="mb-4 text-2xl font-extrabold">Create an account</h1>
    <form onSubmit={submit} noValidate className="rounded-lg bg-white p-6 shadow-sm"><Notice notice={notice}/>
      <Field id="name" label="Name" value={f.name} onChange={set('name')} error={errors.name}/>
      <Field id="email" label="Email" type="email" value={f.email} onChange={set('email')} error={errors.email}/>
      <Field id="password" label="Password" type="password" value={f.password} onChange={set('password')} error={errors.password}/>
      <Field id="confirm" label="Confirm password" type="password" value={f.confirm} onChange={set('confirm')} error={errors.confirm}/>
      <button className="w-full rounded bg-accent px-4 py-2 font-semibold text-white hover:bg-accent-dark">Register</button></form>
    <p className="mt-4 text-sm">Already registered? <Link className="font-semibold text-accent" to="/login">Log in</Link></p></main>;
}
