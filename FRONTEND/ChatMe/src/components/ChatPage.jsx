import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import io from "socket.io-client";
import axios from "axios";
import './ChatPage.css'
import Avatar from "./Avatar";
const socket = io("http://localhost:5000");

function ChatPage()
{
    const[message,setmessage] = useState([]);
    const {otheruser }= useParams();
    const[input,setinput] = useState("");
    const currentuser = localStorage.getItem("username");
     useEffect(() => {
  if (currentuser && otheruser) {
    // 1. Fetch old messages from MongoDB
    fetch(`http://localhost:5000/messages?senderId=${currentuser}&receiverId=${otheruser}`)
      .then(res => res.json())
      .then(data => setmessage(data));

    // 2. Join Socket.IO room
    socket.emit("join", { senderId: currentuser, receiverId: otheruser });

    // 3. Listen for new incoming messages
    const handleReceiveMessage = (data) => {
      setmessage(prev => [...prev, data]);
    };
    socket.on("receiveMessage", handleReceiveMessage);

    // 4. Clean up on unmount or change
    return () => {
      socket.off("receiveMessage", handleReceiveMessage);
    };
  }
}, [currentuser, otheruser]);

useEffect(() => {
  // Assuming you have senderId (person you're chatting with) and receiverId (current user)
  axios.post("http://localhost:5000/markseen", {
    senderId: otheruser,
    receiverId: currentuser
  });
}, [otheruser]);


  function handlemessage()
  {
    if(input)
    {
        socket.emit("sendMessage",{
            senderId:currentuser,
            receiverId:otheruser,
            message:input
        });
        /* setmessage((prev)=>[...prev,{senderId:currentuser,message:input}]); */
        setinput("");
    }
    else{
        alert("please enter a message before sending ");
    }
  }

   return (
  <div className="main">
   <div className="nav">
  <div className="nav-left">
    <Avatar name={otheruser} size={51} />
  </div>
  <div className="nav-center">
    <h3>{otheruser}</h3>
  </div>
  <div className="nav-right">{/* Empty, just for spacing */}</div>
</div>


    <div className="messagecontainer">
      {message.map((msg, index) => (
       <div
  className={`messages ${msg.senderId === currentuser ? "sent" : "received"}`}
  key={index}
>
  <p>{msg.message}</p>
</div>

      ))}
    </div>

    <div className="Input">
      <input
        type="text"
        placeholder="Enter your message here"
        value={input}
        onChange={(e) => setinput(e.target.value)}
      />
      <button onClick={handlemessage}>Send</button>
    </div>
  </div>
);

}
export default ChatPage;