import HeroSection from "../components/Hero";
import HeroImageSlider from "../components/HeroImageSlider";
import FeaturesSection from "../components/FeaturesSection";
import StatsSection from "../components/StatsSection";
import CTASection from "../components/CTASection";
import Footer from "../layouts/Footer";
import Header from "../layouts/Header";
import "../styles/home.css";

export default function Home() {
  return (
    <div>
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