import React, { useEffect, useState } from "react";
import axiosInstance from "@shared/services/axiosInstance";
import TrustedCompanies from "./TrustedCompanies";

const TrustedCompaniesWrapper: React.FC = () => {
  const [logos, setLogos] = useState<string[]>([]);

  useEffect(() => {
    let mounted = true;

    const fetchCompanies = async () => {
      try {
        const res = await axiosInstance.get("/organizations/companies/");
        const companies = res.data;

        if (!mounted || !Array.isArray(companies) || companies.length === 0)
          return;

        const urls = companies
          .map((c: any) => c.logo)
          .filter((url: string | undefined) => !!url);

        setLogos(urls);
      } catch (error) {
        console.error(error);
      }
    };

    fetchCompanies();
    return () => {
      mounted = false;
    };
  }, []);

  return <TrustedCompanies logos={logos} />;
};

export default TrustedCompaniesWrapper;
