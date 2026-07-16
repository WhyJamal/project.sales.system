import React, { lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "../Layout";
import PaymentSuccess from "@/views/pages/payment/PaymentSuccess";
//import { P } from "framer-motion/dist/types.d-DagZKalS";

const HomePage = lazy(() => import("@pages/home/HomeView"));
const ProfileView = lazy(() => import("@pages/profile/ProfileView"));

const ProductsView = lazy(() => import("@/views/pages/products/ProductsView"));
const ProductForm = lazy(() => import("@pages/products/forms/ProductForm"));
// const LoginPage = lazy(() => import("@pages/auth/LoginView"));

const PlansView = lazy(() => import("@pages/plans/PlansView"));

const UpdateView = lazy(() => import("@pages/updates/UpdateView"));

const NotFoundPage = lazy(() => import("@views/maintenance/error/Error404"));

export const ROUTES = {
  HOME: "/",

  PROFILE: "/profile",

  Plans: "/plans",

  PRODUCT: "/product/:productKey",
  PRODUCTS: "/products",

  UpdateView: "/product/updates/:productKey/:id/:version",

  PAYMENT_SUCCESS: "/payment/success",
  NOT_FOUND: "/404",
};

const AppRouter: React.FC = () => {
  return (
    <Routes>
      <Route
        element={<Layout />}
      >
        <Route path={ROUTES.HOME} element={<HomePage />} />

        <Route path={ROUTES.PROFILE} element={<ProfileView />} />

        <Route path={ROUTES.PRODUCTS} element={<ProductsView />} />
        <Route path={ROUTES.PRODUCT} element={<ProductForm />} />
       
        <Route path={ROUTES.Plans} element={<PlansView />} />

        <Route path={ROUTES.UpdateView} element={<UpdateView />} />

        <Route path={ROUTES.PAYMENT_SUCCESS} element={<PaymentSuccess />} />

      </Route>

      {/*  
      <Route path={ROUTES.LOGIN} element={<LoginPage />} />*/}
      <Route path={ROUTES.NOT_FOUND} element={<NotFoundPage />} />

      <Route path="*" element={<Navigate to={ROUTES.NOT_FOUND} replace />} />
    </Routes>
  );
};

export default AppRouter;
