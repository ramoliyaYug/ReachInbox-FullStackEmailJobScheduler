import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Compose from "./pages/Compose";
import ScheduledEmails from "./pages/ScheduledEmails";
import SentEmails from "./pages/SentEmails";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />

        <Route path="/dashboard" element={<Dashboard />} />

        <Route path="/compose" element={<Compose />} />

        <Route path="/scheduled" element={<ScheduledEmails />} />

        <Route path="/sent" element={<SentEmails />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;