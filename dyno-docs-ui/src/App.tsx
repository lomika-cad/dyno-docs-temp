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
import Documentation from "./pages/Documentation"
import ContactUs from "./pages/ContactUs"
import Partnerships from "./pages/Partnerships"
import Templates from "./pages/Templates"

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
        <Route path="/contact" element={<ContactUs />} />
        <Route path="/documentation" element={<Documentation />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/agency-data" element={<AgencyData />} />
        <Route path="/partnerships" element={<Partnerships />} />
        <Route path="/templates" element={<Templates />} />
      </Routes>
      <Toast />
    </>
  )
}

export default App
