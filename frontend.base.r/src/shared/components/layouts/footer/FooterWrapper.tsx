import { useLocation } from "react-router-dom";
import Footer from "./index";

export default function FooterWrapper() {
  const { pathname } = useLocation();

  const hideFooterRoutes = [
    "/products",
    "/plans",
    "/profile",
    "/invite",
  ];

  const shouldHideFooter =
    hideFooterRoutes.includes(pathname) ||
    pathname.startsWith("/product/updates/") ||
    pathname.startsWith("/product/") ||
    pathname.startsWith("/invite/");

  if (shouldHideFooter) {
    return null;
  }

  return <Footer />;
}