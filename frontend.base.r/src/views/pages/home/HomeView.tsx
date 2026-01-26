import React from "react";
import HomeContent from "./components/HomeContent";

const HomeView: React.FC = () => {
  return (
    <div className="min-h-screen mt-4 md:mt-4 lg:mt-6 bg-slate-50">
      <HomeContent />
    </div>
  );
};

export default HomeView;
