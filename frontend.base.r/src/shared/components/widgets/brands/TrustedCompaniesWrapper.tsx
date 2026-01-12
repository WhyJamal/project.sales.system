import React, { useEffect, useState } from "react";
import axiosInstance from "@shared/services/axiosInstance";
import TrustedCompanies from "./TrustedCompanies";

const TrustedCompaniesWrapper: React.FC = () => {
  const [urls, setUrls] = useState<string[]>([]);

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const res = await axiosInstance.get("/organizations/companies/");

        let data = res.data;

        if (typeof data === "string") {
          data = data
            .split(",")
            .map((x: string) => x.trim())
            .filter((x: string) => x.length > 0);
        }

        if (Array.isArray(data)) {
          setUrls(data);
        }

      } catch (error) {
        console.error(error);
      }
    };

    fetchCompanies();
  }, []);

  return <TrustedCompanies urls={urls} />;
};

export default TrustedCompaniesWrapper;
