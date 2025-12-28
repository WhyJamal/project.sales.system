import React, { lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "../Layout";

const HomePage = lazy(() => import("@pages/home/HomeView"));
const ProductsView = lazy(() => import("@/views/pages/products/ProductsView"));
const ProductForm = lazy(() => import("@pages/products/forms/ProductForm"));
// const LoginPage = lazy(() => import("@pages/auth/LoginView"));
const PlansView = lazy(() => import("@pages/plans/PlansView"));
const NotFoundPage = lazy(() => import("@views/maintenance/error/Error404"));

export const ROUTES = {
  HOME: "/",
  Plans: "/plans",
  PRODUCT: "/product/:id",
  PRODUCTS: "/products",
  NOT_FOUND: "/404",
};

const AppRouter: React.FC = () => {
  return (
    <Routes>
      <Route
        element={<Layout />}
      >
        <Route path={ROUTES.HOME} element={<HomePage />} />
        <Route path={ROUTES.PRODUCTS} element={<ProductsView />} />
        <Route path={ROUTES.PRODUCT} element={<ProductForm />} />
        <Route path={ROUTES.Plans} element={<PlansView />} />
      </Route>

      {/*  
      <Route path={ROUTES.LOGIN} element={<LoginPage />} />*/}
      <Route path={ROUTES.NOT_FOUND} element={<NotFoundPage />} />

      <Route path="*" element={<Navigate to={ROUTES.NOT_FOUND} replace />} />
    </Routes>
  );
};

export default AppRouter;
