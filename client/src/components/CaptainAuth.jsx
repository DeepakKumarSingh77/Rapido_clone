import { useState } from "react";
import Taxi from "../assets/taxi.png";
import { useNavigate } from 'react-router-dom';
import axios from "axios";


const CaptainAuth = () => {
  const [toggle, setToggle] = useState(true);
  const navigate = useNavigate();
  const captainData = {
    username: "",
    email: "",
    password: "",
    confirmPassword: ""
  };
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [signupData, setSignupData] = useState(captainData);
  const handleChange = (e) => {
    console.log(signupData);
    setSignupData({ ...signupData, [e.target.name]: e.target.value });
  }
  const handleLoginChange = (e) => {
    console.log(loginData);
    setLoginData({ ...loginData, [e.target.name]: e.target.value });
  }
  const SignUpSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:3000/captain/register', signupData);
      console.log(response.data);
    } catch (error) {
      console.error(error);
    }
  }
  const LoginSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:3000/captain/login', loginData);
      // console.log(response.data);
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('captain', JSON.stringify(response.data.captain));
      alert("Login Successful");
      navigate('/');
    } catch (error) {
      console.error(error);
    }
  }
  return (
    <div className="flex justify-center items-center min-h-screen bg-[#D3DAD9] text-white">
      {
        toggle ?
          <div className="bg-[#44444E] p-4 rounded shadow h-99 w-80 flex flex-col justify-between">
            <div className="flex  items-center justify-center"> 
                <img src={Taxi} alt="logo" className='w-20 '/>    
                <h1 className='text-center text-3xl text-amber-300'>Captain Login</h1>
            </div>
            <div className="flex flex-col gap-4 mt-4 mb-4">
                <input type="text" placeholder='email' name="email" onChange={(e) => handleLoginChange(e)} className='p-2 rounded bg-[#555] border border-[#777] focus:outline-none focus:ring-2 focus:ring-amber-300'/>
                <input type="password" placeholder='Password' name="password" onChange={(e) => handleLoginChange(e)} className='p-2 rounded bg-[#555] border border-[#777] focus:outline-none focus:ring-2 focus:ring-amber-300'/>
                <button className='bg-blue-300 text-black p-2 rounded hover:bg-amber-400' onClick={(e) => LoginSubmit(e)}>Login</button>
            </div>
            <button onClick={() => setToggle(!toggle)} className='bg-amber-300 text-black p-2 rounded hover:bg-amber-400 '>Create Account</button>
            <button className='bg-amber-300 text-black p-2 rounded hover:bg-amber-400 mt-4' onClick={() => navigate('/login-user')}>Login as User</button>
          </div>
          :
          <div className="bg-[#44444E] p-4 rounded shadow h-123 w-80 flex flex-col justify-between">
            <div className="flex  items-center justify-center"> 
                <img src={Taxi} alt="logo" className='w-20 '/>    
                <h1 className='text-center text-3xl text-amber-300'>Create Captain Account</h1>
            </div>
            <div className="flex flex-col gap-4  mb-4">
                <input type="text" placeholder='Username' name="username" onChange={(e) => handleChange(e)} className='p-2 rounded bg-[#555] border border-[#777] focus:outline-none focus:ring-2 focus:ring-amber-300'/>
                <input type="email" placeholder='Email' name="email" onChange={(e) => handleChange(e)} className='p-2 rounded bg-[#555] border border-[#777] focus:outline-none focus:ring-2 focus:ring-amber-300'/>
                <input type="password" placeholder='Password' name="password" onChange={(e) => handleChange(e)} className='p-2 rounded bg-[#555] border border-[#777] focus:outline-none focus:ring-2 focus:ring-amber-300'/>
                <input type="password" placeholder='Confirm Password' name="confirmPassword" onChange={(e) => handleChange(e)} className='p-2 rounded bg-[#555] border border-[#777] focus:outline-none focus:ring-2 focus:ring-amber-300'/>
                <button className='bg-blue-300 text-black p-2 rounded hover:bg-amber-400' onClick={(e) => SignUpSubmit(e)}>Create Account</button>
            </div>
            <button onClick={() => setToggle(!toggle)} className='bg-amber-300 text-black p-2 rounded hover:bg-amber-400 '>Login</button>
          </div>
      }
    </div>
  )
}

export default CaptainAuth;
