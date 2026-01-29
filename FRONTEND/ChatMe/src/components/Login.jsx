import { useState } from "react"
import {Link, Navigate} from "react-router-dom"
import axios from "axios"
import { useNavigate } from "react-router-dom"
import './Login.css'
function Login()
{
    const navigate = useNavigate();
    const [username,setusername] = useState("");
    const [password,setpassword] = useState("");

    const handlesubmit = async(e)=>{
        e.preventDefault();
        try{
            if(!username||!password)
            {
                alert("Please fill all details");
            }
            else{
            const res = await axios.post("https://chatme-y7yq.onrender.com/login",{username,password});
            alert(res.data.message);
            localStorage.setItem("username",username);
            console.log(`${username} added to localstorage`);
            navigate('/home')
        }
        }
       catch (error) {
    console.error("Login Error:", error);
    alert(error.response?.data?.error || error.message || "Login failed");
}

    };

return (<div className="Main">
    <div className="NavBar">
         <h1><span style={{color:"gold"}}>C</span>hat<span  style={{color:"aqua"}}>M</span>e</h1>
       </div>
    <div className="Details">
    
        <h2>Login</h2>
        <form className="Info" onSubmit={handlesubmit}>
          <label>Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setusername(e.target.value)}
          />
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setpassword(e.target.value)}
          />
          <Link to="/">Sign Up?</Link>
          <div className="bttn">
            <button type="submit">Login</button>
          </div>
        </form>
      
    </div>
  </div>
);
}
export default Login