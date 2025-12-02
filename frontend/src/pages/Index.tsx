import { Navigation } from '@/components/Navigation';
import { HeroSection } from '@/components/HeroSection';
import { ProtocolSection } from '@/components/ProtocolSection';
import { AppSection } from '@/components/AppSection';
import { Footer } from '@/components/Footer';
const Index = () => {
  return <div className="min-h-screen bg-background">
     {/*  <Navigation /> */}
      <main>
        <HeroSection />
        <ProtocolSection />
        <AppSection />
      </main>
      <Footer />
    </div>;
};
export default Index;
