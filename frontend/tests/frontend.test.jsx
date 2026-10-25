import {describe,it,expect,vi,beforeEach} from 'vitest';
import {render,screen,waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {MemoryRouter} from 'react-router-dom';
import {AuthContext} from '../src/context/AuthContext.jsx';
import VehicleCard from '../src/components/VehicleCard.jsx';
import Navbar from '../src/components/Navbar.jsx';
import Home from '../src/pages/Home.jsx';
import Register from '../src/pages/Register.jsx';
import Login from '../src/pages/Login.jsx';
import {api} from '../src/services/api.js';
vi.mock('../src/services/api.js',async orig=>({...(await orig()),api:{vehicles:vi.fn(),register:vi.fn(),purchase:vi.fn()}}));

const cars=[{id:1,make:'Toyota',model:'Camry',category:'Sedan',price:26000,quantity:2},{id:2,make:'Ford',model:'F-150',category:'Truck',price:45000,quantity:0}];
const wrap=(ui,auth={user:null})=><AuthContext.Provider value={auth}><MemoryRouter>{ui}</MemoryRouter></AuthContext.Provider>;
beforeEach(()=>vi.clearAllMocks());

describe('VehicleCard',()=>{
  it('shows make, model, category, price and stock',()=>{
    render(<VehicleCard vehicle={cars[0]} onPurchase={()=>{}}/>);
    expect(screen.getByText('Toyota Camry')).toBeInTheDocument(); expect(screen.getByText('Sedan')).toBeInTheDocument();
    expect(screen.getByText('$26,000')).toBeInTheDocument(); expect(screen.getByText('2 in stock')).toBeInTheDocument();
    expect(screen.getByRole('button',{name:'Purchase'})).toBeEnabled();
  });
  it('disables Purchase at zero stock',()=>{
    render(<VehicleCard vehicle={cars[1]} onPurchase={()=>{}}/>);
    expect(screen.getByRole('button',{name:'Purchase'})).toBeDisabled();
  });
});
describe('Home',()=>{
  it('filters by search text and shows stats',async()=>{
    api.vehicles.mockResolvedValue({vehicles:cars});
    render(wrap(<Home/>));
    expect(await screen.findByText('Ford F-150')).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText(/search/i),'toy');
    expect(screen.queryByText('Ford F-150')).not.toBeInTheDocument(); expect(screen.getByText('Toyota Camry')).toBeInTheDocument();
  });
  it('filters by category and price',async()=>{
    api.vehicles.mockResolvedValue({vehicles:cars});
    render(wrap(<Home/>)); await screen.findByText('Ford F-150');
    await userEvent.selectOptions(screen.getByLabelText('Category'),'Truck');
    expect(screen.queryByText('Toyota Camry')).not.toBeInTheDocument();
    await userEvent.type(screen.getByLabelText('Min price'),'99999');
    expect(screen.getByText(/No vehicles match/)).toBeInTheDocument();
  });
  it('refreshes stock after a purchase',async()=>{
    api.vehicles.mockResolvedValueOnce({vehicles:cars}).mockResolvedValue({vehicles:[{...cars[0],quantity:1},cars[1]]});
    api.purchase.mockResolvedValue({});
    render(wrap(<Home/>,{user:{id:1,name:'A',role:'user'}}));
    await userEvent.click((await screen.findAllByRole('button',{name:'Purchase'}))[0]);
    expect(await screen.findByText('1 in stock')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('You purchased');
  });
});
describe('forms',()=>{
  it('registration shows validation messages and does not call the API',async()=>{
    render(wrap(<Register/>));
    await userEvent.type(screen.getByLabelText('Password'),'short'); await userEvent.type(screen.getByLabelText('Confirm password'),'other');
    await userEvent.click(screen.getByRole('button',{name:'Register'}));
    expect(screen.getByText('Enter your name.')).toBeInTheDocument(); expect(screen.getByText('Passwords do not match.')).toBeInTheDocument();
    expect(api.register).not.toHaveBeenCalled();
  });
  it('registration shows server errors',async()=>{
    api.register.mockRejectedValue(new Error('Email already registered'));
    render(wrap(<Register/>));
    await userEvent.type(screen.getByLabelText('Name'),'Ann'); await userEvent.type(screen.getByLabelText('Email'),'a@b.co');
    await userEvent.type(screen.getByLabelText('Password'),'password1'); await userEvent.type(screen.getByLabelText('Confirm password'),'password1');
    await userEvent.click(screen.getByRole('button',{name:'Register'}));
    expect(await screen.findByRole('alert')).toHaveTextContent('Email already registered');
  });
  it('login shows an error for wrong credentials',async()=>{
    const login=vi.fn().mockRejectedValue(new Error('Invalid email or password'));
    render(wrap(<Login/>,{user:null,login}));
    await userEvent.type(screen.getByLabelText('Email'),'a@b.co'); await userEvent.type(screen.getByLabelText('Password'),'wrongwrong');
    await userEvent.click(screen.getByRole('button',{name:'Log in'}));
    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid email or password');
  });
});
describe('Navbar admin visibility',()=>{
  const logout=()=>{};
  it('hides Admin link from guests and normal users',()=>{
    const {unmount}=render(wrap(<Navbar/>)); expect(screen.queryByText('Admin')).not.toBeInTheDocument(); unmount();
    render(wrap(<Navbar/>,{user:{name:'U',role:'user'},logout})); expect(screen.queryByText('Admin')).not.toBeInTheDocument();
  });
  it('shows Admin link to admins',()=>{
    render(wrap(<Navbar/>,{user:{name:'Boss',role:'admin'},logout})); expect(screen.getByText('Admin')).toBeInTheDocument();
  });
});
