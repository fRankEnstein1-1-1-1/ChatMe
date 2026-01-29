import Login from "./components/Login";
import SignUp from "./components/SignUp";
import Home from "./components/Home";
import ChatPage from "./components/ChatPage";
import Unread from "./components/Unread";
import { BrowserRouter,Routes,Route } from "react-router-dom";
function App(){

  return<BrowserRouter>
  <Routes>
<Route path = "/" element={<SignUp/>}/>
<Route path = "/login" element={<Login/>}/>
  <Route path = "/home" element={<Home/>}/>
  <Route path = "/unread" element={<Unread/>}/>
<Route path="/chat/:otheruser" element={<ChatPage />} />
</Routes>
  </BrowserRouter>
}
export default App