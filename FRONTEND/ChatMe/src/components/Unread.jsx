import axios from "axios";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Avatar from "./Avatar";
import './unread.css';
function Unread() {
  const [unseen, setUnseen] = useState([]);
  const [error, setError] = useState("");

  const currentuser = localStorage.getItem("username");

  useEffect(() => {
    const fetchUnseen = async () => {
      try {
        const res = await axios.get(`https://chatme-y7yq.onrender.com/unseen?receiverId=${currentuser}`);
        setUnseen(res.data.senders || []);
        setError("");
      } catch (err) {
        console.error(err);
        setError("Something went wrong");
      }
    };

    fetchUnseen();
  }, [currentuser]);

  return (
    <div className="main1">
      <h2>Unread Messages</h2>
      {error && <p>{error}</p>}
      {unseen.length === 0 && !error && <p>No unseen messages</p>}
     {unseen.map((user, index) => (
  <div className="searchresult" key={index}>
    <div className="Rec">
      <Avatar name={user.username} size={95} />
      
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <h2>{user.username}</h2>

        {user.count > 0 && <span className="badgeSmall">{user.count}</span>}
      </div>
    </div>

    <Link to={`/chat/${user.username}`}>Chat with {user.username}</Link>
  </div>
))}

    </div>
  );
}

export default Unread;
