import "../styles/hero.css";
import image1 from "../assets/imageSlider1.jpg";
import image2 from "../assets/imageSlider2.jpg";
import image3 from "../assets/imageSlider3.jpg";
import image4 from "../assets/imageSlider4.jpg";
import image5 from "../assets/imageSlider5.jpg";

export default function HeroImageSlider() {
  const images = [
    image1,
    image2,
    image3,
    image4,
    image5,
  ];

  const loopedImages = [...images, ...images, ...images];

  return (
    <div className="slider-container">
      <div className="slider-track">
        {loopedImages.map((imgSrc, index) => (
          <img
            key={index}
            src={imgSrc}
            alt={`Slide ${index % images.length + 1}`}
            className="slider-image"
          />
        ))}
      </div>
    </div>
  );
}
