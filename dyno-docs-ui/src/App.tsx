import { useEffect } from "react"
import { Route, Routes } from "react-router-dom"
import AOS from "aos"
import "aos/dist/aos.css"
import Home from "./pages/Home"
import Dashboard from "./pages/Dashboard"
import AgencyData from "./pages/AgencyData"
import Toast from "./components/Toast"
import PricingPage from "./pages/PricingPage"
import AboutUs from "./pages/AboutUs"

function App() {
  useEffect(() => {
    AOS.init({ duration: 900, once: true, easing: "ease-out-cubic" })
  }, [])
  
  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/about" element={<AboutUs />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/agency-data" element={<AgencyData />} />
      </Routes>
      <Toast />
    </>
  )
}

export default App
