import "./Home.css"
import axios from "axios";
import { data, Link,useNavigate } from "react-router-dom";
import { useState ,useEffect} from "react";
import Avatar from "./Avatar";


function Home() {

  const navigate = useNavigate();

const [input, setinput] = useState("");
const [results,setresults] = useState(null);
const [error,seterror] = useState("");
const [unseenCount, setUnseenCount] = useState(0);

const currentuser = localStorage.getItem('username')

console.log(`username = ${currentuser}`)
useEffect(() => {
  const fetchUnseenCount = async () => {
    try {
      const res = await axios.get(
        `https://chatme-y7yq.onrender.com/unseen?receiverId=${currentuser}`
      );
      setUnseenCount(res.data.totalUnseen || 0);
    } catch (err) {
      console.log("error fetching unseen count");
    }
  };

  fetchUnseenCount();
}, [currentuser]);

const handlechange = async (e) => {
  e.preventDefault();
  try {
    if(!input)
    {
      alert("please Provide a Username other wise do Random!!!")
    }
    else{
    const res = await axios.get(`http://localhost:5000/search?username=${input}`);
    const data = res.data;
    
    seterror("");
    setresults(data);
}  } 
  catch (error) {
    console.error(error);
    if (error.response && error.response.data && error.response.data.message) {
      setresults(null);
      seterror(error.response.data.message);
    } else {
      seterror("An error occurred");
    }
  }};
 
const handleRandomSearch = async(e)=>{
 
    e.preventDefault();
    try{
      const res =  await axios.get(`http://localhost:5000/randomsearch?exclude=${currentuser}`);
      const data = res.data;
      seterror("");
      setresults(data);
    }
    catch(error){
      alert(`Cant Random search at the time `);
    }
  }

  const handleunseen =()=>
  {
    navigate('/unread');
  }

  const handleLogout=()=>{
localStorage.removeItem('username');
console.log(`${currentuser} removed from localstorage`);
navigate('/login');
  }

  return  <div className="home">
   
      <div className="Nav">
        <div className="NavInp">
             <input type="text" placeholder="Enter the usernames" value={input} onChange={(e)=>{setinput(e.target.value)}} />
        <button onClick={handlechange}>Search</button>
        <button onClick={handleRandomSearch}>Random</button>
      <button className="unseenBtn" onClick={handleunseen}>
  Unseen
  {unseenCount > 0 && <span className="badge">{unseenCount}</span>}
</button>

       </div>
        <div className="Link">
          <div className="Avtar">
          <Avatar name={currentuser} size={67}/>
      <p>{currentuser}</p>
      </div>
      <button onClick={handleLogout}>
        LogOut
      </button>
     </div> 
     </div>
     {error && <p>No Users Found</p>}
    {results && (
        <div className="searchresult">
          <div className="Rec" >
            <Avatar name={results.username} size={95}/>
          <h2>{results.username}</h2>
          </div>
           <Link to={`/chat/${results.username}`}>Chat with {results.username}</Link>
        </div>
      )}
    </div>
  
    }

export default Home;
