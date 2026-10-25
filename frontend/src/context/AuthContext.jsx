import {createContext,useContext,useEffect,useState} from 'react';
import {api} from '../services/api.js';
export const AuthContext=createContext({user:null});
export const useAuth=()=>useContext(AuthContext);
export function AuthProvider({children}){
  const [user,setUser]=useState(null);const [loading,setLoading]=useState(true);
  useEffect(()=>{api.me().then(d=>setUser(d.user)).catch(()=>{}).finally(()=>setLoading(false));},[]);
  const login=async b=>{const d=await api.login(b);setUser(d.user);return d.user;};
  const logout=async()=>{await api.logout();setUser(null);};
  return <AuthContext.Provider value={{user,loading,login,logout}}>{children}</AuthContext.Provider>;
}
