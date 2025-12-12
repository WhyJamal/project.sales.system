import { Header } from './components/Header';
import { HeroSection } from './components/HeroSection';
import { InnovationSection } from './components/InnovationSection';
import { SolutionsSection } from './components/SolutionsSection';

export default function App() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <HeroSection />
      <InnovationSection />
      <SolutionsSection />
    </div>
  );
}
