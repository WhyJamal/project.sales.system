import { Link, useLocation, useParams } from "react-router-dom";
import { useProductStore } from "@shared/stores/productsStore";
import { Home, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Crumb {
  path: string;
  label: string;
  isLast: boolean;
}

const Breadcrumbs = () => {
  const location = useLocation();
  const params = useParams<{ productKey?: string }>();
  const { getProductById } = useProductStore();

  if (location.pathname === "/") {
    return null;
  }

  const pathname = location.pathname;
  const crumbs: Crumb[] = [];

  crumbs.push({ path: "/", label: "Главная", isLast: false });

  if (pathname.startsWith("/products") || pathname.startsWith("/product")) {
    crumbs.push({ path: "/products", label: "Продукты", isLast: false });
  }

  if (pathname.startsWith("/product/") && params.productKey) {
    const product = getProductById(Number(params.productKey));
    crumbs.push({ path: pathname, label: product?.name || "Product", isLast: true });
  }

  if (pathname === "/plans") {
    crumbs.push({ path: "/plans", label: "Тарифы", isLast: true });
  }

  if (pathname === "/profile") {
    crumbs.push({ path: "/profile", label: "Профиль", isLast: true });
  }

  crumbs.forEach((c, i) => (c.isLast = i === crumbs.length - 1));

  const containerVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.05 } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.2 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
  };

  return (
    <AnimatePresence>
      <motion.nav
        className="px-10 flex mb-4 bg-gray-50"
        aria-label="Breadcrumb"
        initial="hidden"
        animate="visible"
        exit="exit"
        variants={containerVariants}
      >
        <ol className="inline-flex items-center space-x-1 md:space-x-2">
          {crumbs.map((crumb, i) => (
            <motion.li
              key={crumb.path}
              aria-current={crumb.isLast ? "page" : undefined}
              variants={itemVariants}
            >
              <div className="flex items-center space-x-1.5">
                {i !== 0 && <ChevronRight size={14} strokeWidth={2.5} className="text-gray-400" />}

                {i === 0 ? (
                  <Link
                    to="/"
                    className="inline-flex items-center text-sm font-medium text-body hover:text-blue-700"
                  >
                    <Home className="w-3.5 h-3.5 mr-2" />
                    Главная
                  </Link>
                ) : crumb.isLast ? (
                  <span className="text-sm font-medium text-body-subtle">{crumb.label}</span>
                ) : (
                  <Link to={crumb.path} className="text-sm font-medium hover:text-blue-700">
                    {crumb.label}
                  </Link>
                )}
              </div>
            </motion.li>
          ))}
        </ol>
      </motion.nav>
    </AnimatePresence>
  );
};

export default Breadcrumbs;
