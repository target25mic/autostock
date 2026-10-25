import {Navigate,Route,Routes} from 'react-router-dom';
import Navbar from './components/Navbar.jsx';import Home from './pages/Home.jsx';import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';import Admin from './pages/Admin.jsx';import NotFound from './pages/NotFound.jsx';
import {useAuth} from './context/AuthContext.jsx';
function RequireAdmin({children}){const {user,loading}=useAuth();
  if(loading) return <p role="status" className="p-6">Loading…</p>;
  return user?.role==='admin'?children:<Navigate to="/login" replace/>;}
export default function App(){return <><Navbar/><Routes>
  <Route path="/" element={<Home/>}/><Route path="/login" element={<Login/>}/><Route path="/register" element={<Register/>}/>
  <Route path="/admin" element={<RequireAdmin><Admin/></RequireAdmin>}/><Route path="*" element={<NotFound/>}/></Routes></>;}
