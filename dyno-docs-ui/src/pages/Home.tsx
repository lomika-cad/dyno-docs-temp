import HeroSection from "../components/Hero";
import HeroImageSlider from "../components/HeroImageSlider";
import FeaturesSection from "../components/FeaturesSection";
import StatsSection from "../components/StatsSection";
import CTASection from "../components/CTASection";
import Footer from "../layouts/Footer";
import Header from "../layouts/Header";
import "../styles/home.css";
import { useEffect } from "react";
import ScrollToTop from "../components/ScrollToTop";

export default function Home() {

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div>
      <ScrollToTop />
      
      <Header />

      <HeroSection />

      <HeroImageSlider />

      <FeaturesSection />

      <CTASection />

      <StatsSection />

      <Footer />
    </div>
  );
}