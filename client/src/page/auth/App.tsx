import Banner from "./components/banner";
import LenisScroll from "./components/lenis-scroll";
import Navbar from "./components/navbar";
import Footer from "./components/footer";
import HeroSection from "./sections/hero-section";
import HowItWorksSection from "./sections/how-it-works-section";
import FaqSection from "./sections/faq-section";
import CallToActionSection from "./sections/call-to-action-section";

const App: React.FC = () => {
  return (
    <>
      <LenisScroll />
      <Navbar />
      <main className='px-4'>
        <HeroSection />
        <HowItWorksSection />
        <FaqSection />
        <CallToActionSection />
      </main>
      <Footer />
    </>
  );
};

export default App;