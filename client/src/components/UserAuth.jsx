import React, { useState } from 'react'
import Taxi from "../assets/taxi.png";
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
export default function UserAuth(){
    const [toggle, setToggle] = useState(true);
    const navigate = useNavigate();
    const User_Data={
        username:"",
        email:"",
        password:""
    }
    const [loginData,setLoginData]=useState({email:"",password:""}); 
    const [signupData,setSignupData]=useState(User_Data);
    const handleChange=(e)=>{
        console.log(signupData);
        setSignupData({...signupData,[e.target.name]:e.target.value});
    }
    const handleLoginChange=(e)=>{
        console.log(loginData);
        setLoginData({...loginData,[e.target.name]:e.target.value});
    }
    const SignupSubmit=async(e)=>{
        e.preventDefault();
        try{
            const res=await axios.post("http://localhost:3000/user/register",signupData);
            // console.log(res.data);
            localStorage.setItem("token",res.data.token);
            localStorage.setItem("user",JSON.stringify(res.data.newUser));
            alert("User Created Successfully");
            setToggle(true);
        }catch(err){
            console.log(err);
            alert("Error in creating user");
        }
    }
    const LoginSubmit=async(e)=>{
        e.preventDefault(); 
        try{
            const res=await axios.post("http://localhost:3000/user/login",loginData);
            // console.log(res.data);
            localStorage.setItem("token",res.data.token);
            localStorage.setItem("user",JSON.stringify(res.data.user));
            localStorage.setItem("profile", JSON.stringify({ role: "user" }));
            alert("Login Successful");
            navigate('/'); 
        }catch(err){
            console.log(err);
            alert("Error in login");
        }
    }
    return(
      <>
      <div className='flex justify-center items-center min-h-screen bg-[#D3DAD9] text-white'>
        {
         toggle?
         <div className='bg-[#44444E] p-4 rounded shadow h-99 w-80 flex flex-col justify-between'>
            <div className='flex  items-center justify-center'>
                <img src={Taxi} alt="logo" className='w-20 '/>    
                <h1 className='text-center text-3xl text-amber-300'>User Login</h1>
            </div>
            <div className='flex flex-col gap-4 mt-4 mb-4'>
                <input type="text" placeholder='email' name='email' className='p-2 rounded bg-[#555] border border-[#777] focus:outline-none focus:ring-2 focus:ring-amber-300' onChange={(e)=>handleLoginChange(e)}/>
                <input type="password" placeholder='password' name='password' className='p-2 rounded bg-[#555] border border-[#777] focus:outline-none focus:ring-2 focus:ring-amber-300' onChange={(e)=>handleLoginChange(e)}/>
                <button className='bg-blue-300 text-black p-2 rounded hover:bg-amber-400' onClick={(e)=>LoginSubmit(e)}>Login</button>
            </div>
            <button onClick={()=>setToggle(!toggle)} className='bg-amber-300 text-black p-2 rounded hover:bg-amber-400 '>Create Account</button>
            <button className='bg-amber-300 text-black p-2 rounded hover:bg-amber-400 mt-4' onClick={()=>navigate('/driver-login')}>Login as Driver</button>
         </div>
         : 
         <div className='bg-[#44444E] p-4 rounded shadow h-96 w-80 flex flex-col justify-between'>
            <div className='flex  items-center justify-center'>
                <img src={Taxi} alt="logo" className='w-20 '/>    
                <h1 className='text-center text-3xl text-amber-300'>Create Account</h1>
            </div>
            <div className='flex flex-col gap-4  mb-4'>
                <input type="text" placeholder='username' name='username' className='p-2 rounded bg-[#555] border border-[#777] focus:outline-none focus:ring-2 focus:ring-amber-300' onChange={(e)=>handleChange(e)}/>
                <input type="email" placeholder='email' name='email' className='p-2 rounded bg-[#555] border border-[#777] focus:outline-none focus:ring-2 focus:ring-amber-300' onChange={(e)=>handleChange(e)}/>
                <input type="password" placeholder='password' name='password' className='p-2 rounded bg-[#555] border border-[#777] focus:outline-none focus:ring-2 focus:ring-amber-300'onChange={(e)=>handleChange(e)}/>
                <button className='bg-blue-300 text-black p-2 rounded hover:bg-amber-400' onClick={(e)=>SignupSubmit(e)}>Create User</button>
            </div>
            <button onClick={()=>setToggle(!toggle)} className='bg-amber-300 text-black p-2 rounded hover:bg-amber-400'>Login</button>
         </div>
         }
      </div>
         
      </>
    )
}
