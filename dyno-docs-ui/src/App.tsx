import { Route, Routes } from "react-router-dom"
import Home from "./pages/Home"
import Dashboard from "./pages/Dashboard"
import AgencyData from "./pages/AgencyData"

function App() {
  
  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/agency-data" element={<AgencyData />} />
      </Routes>
    </>
  )
}

export default App
