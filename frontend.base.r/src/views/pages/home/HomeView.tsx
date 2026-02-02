import React from "react";
import HomeContent from "./components/HomeContent";

const HomeView: React.FC = () => {
  return (
    <div className="min-h-screen mt-3 md:mt-2 lg:mt-2 bg-slate-50">
      <HomeContent />
    </div>
  );
};

export default HomeView;
