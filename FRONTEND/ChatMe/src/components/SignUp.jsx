import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import axios from "axios"
import './Login.css';
function SignUp() {
      const navigate = useNavigate();
    const [name, setname] = useState("");
    const [username, setusername] = useState("");
    const [password, setpassword] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if(!name || !username || !password)
            {
                alert("Please Fill All details!");
            }
            else{
            const res = await axios.post("https://chatme-k5zt.onrender.com/signup", {
                name, username, password
            });
            alert(res.data.message);
            localStorage.setItem("username",username);
            navigate('/home')
        }
        } catch (err) {
            alert("Error registering user");
        }
    };

    return (
        <div className="Main">
              <div className="NavBar">
                <h1><span style={{color:"gold"}}>C</span>hat<span  style={{color:"aqua"}}>M</span>e</h1>
       </div>
            <div className="Details">
                <h2>SignUp</h2>
                <form className="Info" onSubmit={handleSubmit}>
                    <label>Name</label>
                    <input type="text" value={name} onChange={(e) => setname(e.target.value)} />
                    <label>Username</label>
                    <input type="text" value={username} onChange={(e) => setusername(e.target.value)} />
                    <label>Password</label>
                    <input type="password" value={password} onChange={(e) => setpassword(e.target.value)} />
                    <Link to='Login'>Login</Link>
                    <div className="bttn">
                        <button type="submit">SignUp</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default SignUp;
