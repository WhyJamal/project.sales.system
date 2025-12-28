import { HeroSection } from '../components/HeroSection';
import { InnovationSection } from '../components/InnovationSection';
import { SolutionsSection } from '../components/SolutionsSection';

export default function ProductForm() {
  return (
    <div className="min-h-screen bg-white">
      <HeroSection />
      <InnovationSection />
      <SolutionsSection />
    </div>
  );
}
