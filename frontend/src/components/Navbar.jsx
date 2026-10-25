import {Link,useNavigate} from 'react-router-dom';
import {useAuth} from '../context/AuthContext.jsx';
export default function Navbar(){
  const {user,logout}=useAuth();const nav=useNavigate();
  const link="px-3 py-2 rounded hover:bg-white/10";
  return <header className="bg-ink text-white"><nav className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-3">
    <Link to="/" className="text-xl font-extrabold tracking-tight"><span className="text-accent">▲</span> AutoStock</Link>
    <div className="flex flex-wrap items-center gap-1 text-sm">
      <Link className={link} to="/">Inventory</Link>
      {user?.role==='admin'&&<Link className={link} to="/admin">Admin</Link>}
      {user?<><span className="px-3 text-gray-300">{user.name}</span>
        <button className={link} onClick={async()=>{await logout();nav('/');}}>Log out</button></>
      :<><Link className={link} to="/login">Log in</Link><Link className="rounded bg-accent px-3 py-2 font-semibold hover:bg-accent-dark" to="/register">Register</Link></>}
    </div></nav></header>;
}
