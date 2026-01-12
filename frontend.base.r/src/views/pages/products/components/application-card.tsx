import { useNavigate } from "react-router-dom";
import Button from "@/shared/components/ui/button";
import React from "react";

interface ProductCardProps {
  product: {
    id: number; 
    title: string;
    description: string;
    icon: string;
    link?: string;
    badge?: string;
    tags?: string[];
    name: string; 
  };
  className?: string;
  onStartClick?: () => void;
}

const ApplicationCard: React.FC<ProductCardProps> = ({ 
  product, 
  className = "",
  onStartClick 
}) => {
  const navigate = useNavigate();

  const handleButtonClick = () => {
    if (onStartClick) {
      onStartClick();
    }
    navigate(`/product/${product.id}`);
  };

  return (
    <div className="group relative">
      {product.badge && (
        <span className="absolute -top-2 -right-2 z-10 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">
          {product.badge}
        </span>
      )}
      
      <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-start bg-white rounded-md shadow-lg hover:shadow-2xl transition-all duration-500 p-6 sm:p-8 max-w-5xl w-full border border-gray-100 group-hover:border-orange-100">
        
        <div className="relative flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center rounded-xl bg-gradient-to-br from-orange-50 to-red-50 transition-all duration-500 group-hover:scale-105 group-hover:from-orange-100 group-hover:to-red-100">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-red-500/5 rounded-xl"></div>
          <img 
            src={product.icon} 
            alt={product.title} 
            className="w-12 h-12 sm:w-16 sm:h-16 object-contain p-1" 
            loading="lazy"
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-4">
            <h2 className="text-red-600 text-lg sm:text-xl font-bold mb-2 sm:mb-0">
              {product.title}
            </h2>
            
            {product.tags && product.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {product.tags.slice(0, 2).map((tag, index) => (
                  <span 
                    key={index}
                    className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
          
          <p className="text-gray-600 mb-6 leading-relaxed text-sm sm:text-base line-clamp-3">
            {product.description}
          </p>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-6">
              <a
                href={product.link || "#"}
                onClick={(e) => e.preventDefault()}
                className="inline-flex items-center gap-2 text-blue-600 hover:text-red-700 font-medium transition-colors text-sm group/link"
              >
                Ознакомиться
              </a>
            </div>
            
            <Button
              onClick={handleButtonClick} 
              className="px-6 py-3 text-sm font-semibold hover:to-red-700 text-white shadow-md hover:shadow-lg transition-all duration-300 transform group/link"
            >
              <span className="flex items-center gap-2">
                Начать работу!
                <svg className="w-4 h-4 group-hover/link:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplicationCard;
