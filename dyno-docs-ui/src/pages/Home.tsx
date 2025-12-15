import HeroSection from "../components/Hero";
import HeroImageSlider from "../components/HeroImageSlider";
import Footer from "../layouts/Footer";
import Header from "../layouts/Header";
import "../styles/home.css";

export default function Home() {
  return (
    <div>
        <Header />

        <HeroSection />

        <HeroImageSlider />

        <Footer />
    </div>
  );
}