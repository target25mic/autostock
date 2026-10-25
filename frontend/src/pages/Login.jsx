import {useState} from 'react';import {Link,useNavigate} from 'react-router-dom';
import {useAuth} from '../context/AuthContext.jsx';import Field from '../components/Field.jsx';import Notice from '../components/Notice.jsx';
export default function Login(){
  const {login}=useAuth();const nav=useNavigate();
  const [email,setEmail]=useState('');const [password,setPassword]=useState('');const [notice,setNotice]=useState(null);
  const submit=async e=>{e.preventDefault();
    if(!email||!password) return setNotice({type:'error',message:'Enter your email and password.'});
    try{await login({email,password});nav('/');}catch(err){setNotice({type:'error',message:err.message});}};
  return <main className="mx-auto max-w-md px-4 py-10"><h1 className="mb-4 text-2xl font-extrabold">Log in</h1>
    <form onSubmit={submit} noValidate className="rounded-lg bg-white p-6 shadow-sm"><Notice notice={notice}/>
      <Field id="email" label="Email" type="email" value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email"/>
      <Field id="password" label="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} autoComplete="current-password"/>
      <button className="w-full rounded bg-accent px-4 py-2 font-semibold text-white hover:bg-accent-dark">Log in</button></form>
    <p className="mt-4 text-sm">New here? <Link className="font-semibold text-accent" to="/register">Create an account</Link></p></main>;
}
