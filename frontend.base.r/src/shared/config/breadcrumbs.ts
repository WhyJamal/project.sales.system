export interface BreadcrumbConfigItem {
    path: string;
    label: string | ((params: any) => string);
  }
  
  export const BREADCRUMBS: BreadcrumbConfigItem[] = [
    {
      path: "/",
      label: "Home",
    },
    {
      path: "/products",
      label: "Products",
    },
    {
      path: "/product/:productKey",
      label: (params) => params.productName || "Product",
    },
    {
      path: "/plans",
      label: "Plans",
    },
    {
      path: "/profile",
      label: "Profile",
    },
  ];
  