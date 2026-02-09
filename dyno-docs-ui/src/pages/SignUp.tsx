import Header from "../layouts/Header";
import Footer from "../layouts/Footer";
import SignUpStepper from "../components/SignUpStepper/SignUpStepper";
import "../styles/signUp.css";
import "../styles/agencyData.css";

export default function SignUpPage() {
  return (
    <div>
      <Header />

      <main className="signup-page">
        <div className="signup-container">
          <SignUpStepper />
        </div>
      </main>

      <Footer />
    </div>
  );
}
