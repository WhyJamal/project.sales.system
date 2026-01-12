import React, { useEffect, useState } from "react";
import axiosInstance from "@shared/services/axiosInstance";
import TrustedCompanies from "./TrustedCompanies";

const TrustedCompaniesWrapper: React.FC = () => {
  const [urls, setUrls] = useState<string[]>([]);

  useEffect(() => {
    let mounted = true;

    const fetchCompanies = async () => {
      try {
        const res = await axiosInstance.get("/organizations/companies/");
        const companies = res.data;

        if (!mounted || !Array.isArray(companies)) return;

        const companyUrls = companies
          .map((c: any) => c.url)
          .filter((url: string | undefined) => !!url);

        setUrls(companyUrls);
      } catch (error) {
        console.error(error);
      }
    };

    fetchCompanies();
    return () => {
      mounted = false;
    };
  }, []);

  return <TrustedCompanies urls={urls} />;
};

export default TrustedCompaniesWrapper;
