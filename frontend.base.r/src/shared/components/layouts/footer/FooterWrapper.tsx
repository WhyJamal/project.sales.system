import { useLocation } from "react-router-dom";
import Footer from "./index";

export default function FooterWrapper() {
  const { pathname } = useLocation();

  const hideFooterRoutes = [
    "/products",
    "/plans",
    "/profile"
  ];

  const shouldHideFooter =
    hideFooterRoutes.includes(pathname) ||
    pathname.startsWith("/product/updates/") ||
    pathname.startsWith("/product/");

  if (shouldHideFooter) {
    return null;
  }

  return <Footer />;
}