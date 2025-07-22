let express  =require("express");
let mongoose = require("mongoose");
let cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const app = express();
app.use(cors());
app.use(express.json());
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
   origin: ["http://localhost:3000", "http://localhost:5173"],
    methods: ["GET", "POST"]
  }
});


mongoose.connect("mongodb://127.0.0.1:27017/ChatMe",{
     useNewUrlParser: true,
    useUnifiedTopology: true
}).then(()=>console.log("MongoDB connected!"))
.catch((error)=>console.log(error));

const Message = mongoose.model("Message", {
  senderId: String,
  receiverId: String,
  message: String,
  timestamp: { type: Date, default: Date.now },
  seen:{type:Boolean, default:false}
});

const User = mongoose.model("User",{
    name:String,
    username:String,
    password:String
});



io.on("connection", (socket) => {
  console.log(" A user connected:", socket.id);

  socket.on("join", ({ senderId, receiverId }) => {
    const roomId = [senderId, receiverId].sort().join("_");
    socket.join(roomId);
    console.log(` User joined room: ${roomId}`);
  });

  socket.on("sendMessage", async ({ senderId, receiverId, message }) => {
    const roomId = [senderId, receiverId].sort().join("_");

    console.log("📨 Incoming message:", { senderId, receiverId, message });

    try {
      const newMessage = new Message({ senderId, receiverId, message });
      await newMessage.save();
      console.log(" Message saved to DB:", newMessage);

      io.to(roomId).emit("receiveMessage", { senderId, message });
    } catch (err) {
      console.error("❌ Error saving message to MongoDB:", err);
    }
  });

  socket.on("disconnect", () => {
    console.log(" User disconnected:", socket.id);
  });
});



app.post("/signup",async(req,res)=>{
    const {name,username,password} = req.body;
    const user = new User({ name, username, password });
    await user.save();
    console.log("Saved user:", user);  
    res.json({message:"User Registered Sucessfully!"});
});

app.post("/login",async(req,res)=>{
    const {username,password} = req.body;
    const user =  await User.findOne({username})
    if(!user)
    {
        return res.status(400).json({message:"user unidentified"})
    }
    if(user.password!==password)
    {
        return res.status(401).json({messege:"INCORRECT PASSWORD"})
    }
    res.json({message:"Login Sucessfull"})
});

app.get("/search",async(req,res)=>{
    let {username} = req.query;
    if(!username)
    {
        return res.json({message:"Need Username To Search"})
    }
    try{
        const user =await User.findOne({username});
        res.json({username:user.username})
    }
    
        catch(error)
    {
        return res.json({message:"Error occured"});
    }

});

app.get("/randomsearch",async(req,res)=>{
  
  try{
    let excludeUser = req.query.exclude;
  let users =  await User.find({
       username: { $exists: true, $ne: excludeUser }
  });
  let count = users.length;
     if (count === 0) {
      return res.status(404).json({ message: "No other users available" });
    }
  const randomNumber = Math.floor(Math.random()*count);
  const randomUser = users[randomNumber];
  if(!randomUser || !randomUser.username)
  {
    return res.json({message:"No Users in Database"});
  }
  res.json({username:randomUser.username});
  }
  catch(err){
   return res.json({message:"Error Occured While Random Search by Server"})
  }
})

app.get("/unseen", async (req, res) => {
  const { receiverId } = req.query;

  if (!receiverId) {
    return res.status(400).json({ message: "receiverId is required" });
  }

  // Step 1: Get unique senderIds of messages unseen by receiver
  const unseenMessages = await Message.find({ receiverId, seen: false }).select("senderId");

  const senderIds = [...new Set(unseenMessages.map(msg => msg.senderId))];

  // Step 2: Fetch the usernames of these senders
  const users = await User.find({ username: { $in: senderIds } }).select("username name");

  res.json(users);
});


app.get("/messages", async (req, res) => {
  const { senderId, receiverId } = req.query;

  if (!senderId || !receiverId) {
    return res.status(400).json({ message: "Both sender and receiver are required" });
  }

  const messages = await Message.find({
    $or: [
      { senderId, receiverId },
      { senderId: receiverId, receiverId: senderId }
    ]
  }).sort({ timestamp: 1 });

  res.json(messages);
});
app.post("/markseen", async (req, res) => {
  const { senderId, receiverId } = req.body;

  if (!senderId || !receiverId) {
    return res.status(400).json({ message: "Both sender and receiver are required" });
  }

  await Message.updateMany(
    { senderId, receiverId, seen: false },
    { $set: { seen: true } }
  );

  res.json({ message: "Messages marked as seen." });
});





server.listen(5000, () => {
  console.log("Server is running on port 5000");
});
