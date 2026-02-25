import React from "react";
import { Icon } from "@iconify/react";
import { footerSections } from "./footer.config";
import { ContactSection } from "./ContactSection";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

const Footer: React.FC = () => {
  const { t } = useTranslation("footer");

  return (
    <>
      <ContactSection />
      <footer className="bg-gray-200 py-14 font-sf p-6">
        <div className="mx-auto px-4 md:px-10 flex flex-col md:flex-row md:justify-between gap-8">
          <div className="flex flex-col gap-6 items-start md:items-start">
            <div className="flex justify-start md:justify-start">
              <img
                src="/brands/logo.webp"
                alt="APS"
                className="w-24 object-cover"
              />
            </div>

            <div className="flex flex-col gap-3 items-start">
              <div className="flex items-center gap-2">
                <Icon
                  icon="mdi:account-circle"
                  width={24}
                  className="text-black"
                />
                <span className="text-gray-700 text-sm">
                  {t("contact.title")}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Icon icon="mdi:chat" width={24} className="text-gray-700" />
                <span className="text-gray-700 text-sm">
                  {t("contact.chatDisabled")}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 md:mt-0 flex-1 flex flex-col md:grid md:grid-cols-3 gap-6 text-left md:text-right">
            {footerSections.map((section) => (
              <div key={section.title}>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {t(`sections.${section.title}.title`)}
                </h3>

                <ul className="space-y-1">
                  {section.items.map((item) => (
                    <li key={item.label}>
                      <Link
                        to={item.url}
                        className="text-gray-600 text-sm hover:text-black hover:underline"
                      >
                        {t(`sections.${section.title}.${item.label}`)}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <hr className="my-6 border-gray-300" />

        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-600 text-sm text-left md:text-left">
            {t("copyright")}
          </p>

          <div className="flex gap-4 mt-4 md:mt-0 justify-end">
            <Icon
              icon="mdi:facebook"
              width={20}
              className="text-gray-600 cursor-pointer hover:text-blue-600"
            />
            <Icon
              icon="mdi:twitter"
              width={20}
              className="text-gray-600 cursor-pointer hover:text-blue-400"
            />
            <Icon
              icon="mdi:instagram"
              width={20}
              className="text-gray-600 cursor-pointer hover:text-pink-500"
            />
            <Icon
              icon="mdi:linkedin"
              width={20}
              className="text-gray-600 cursor-pointer hover:text-blue-700"
            />
          </div>
        </div>
      </footer>
    </>
  );
};

export default Footer;
