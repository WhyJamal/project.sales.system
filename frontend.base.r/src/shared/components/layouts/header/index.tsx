import React, { useState, useRef, useEffect, Suspense, lazy } from "react";
import { Icon } from "@iconify/react";
import { useUser } from "@app/providers/UserProvider";
import { Button } from "@shared/components/ui/Button";
import { useApp } from "@/app/providers/AppProvider";
import dropdownData from "./DropdownData";
import { DropdownKeys } from "./navbar.types";
import menus from "./config/NavbarData";

const Dropdown = lazy(() => import("./Dropdown"));
const RegionSelector = lazy(() => import("./RegionSelector"));
const Modal = lazy(() => import("@shared/components/common/Modal"));
const Auth = lazy(() => import("@/features/auth/Auth"));

const Navbar: React.FC = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState<DropdownKeys | null>(null);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [regionSelectorOpen, setRegionSelectorOpen] = useState(false);

  const { user, logout } = useUser();
  const { showToast } = useApp();

  const userDropdownRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const regionSelectorRef = useRef<HTMLDivElement>(null);

  const handleCountrySelect = (country: string) => {
    // i18n lib
    setRegionSelectorOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        userDropdownRef.current &&
        !userDropdownRef.current.contains(event.target as Node)
      ) {
        setUserDropdownOpen(false);
      }
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
        setActiveMenu(null);
      }
      if (
        regionSelectorRef.current &&
        !regionSelectorRef.current.contains(event.target as Node)
      ) {
        setRegionSelectorOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const toggleDropdown = (menu: DropdownKeys) => {
    if (activeMenu === menu) {
      setDropdownOpen(!dropdownOpen);
      if (dropdownOpen) setActiveMenu(null);
    } else {
      setActiveMenu(menu);
      setDropdownOpen(true);
    }
  };

  const setActive = (menu: DropdownKeys) => {
    setActiveMenu(menu);
    setDropdownOpen(false);
    setMenuOpen(false);
  };

  const toggleUserDropdown = () => setUserDropdownOpen(!userDropdownOpen);

  const handleLogout = () => {
    logout();
    setUserDropdownOpen(false);
    showToast("Вы успешно вышли", "success");
  };

  return (
    <nav className="flex items-center justify-between px-6 py-3 bg-white shadow-sm relative">
      <div className="flex items-center gap-5 p-1">
        <div className="flex items-center gap-2 select-none">
          <div className="px-2 shadow-sm tracking-wider select-none font-roboto">
            <img
              src="brands/logo.png"
              alt="APS Logo"
              className="h-7 w-auto select-none"
            />
          </div>
        </div>

        <ul className="hidden md:flex items-center gap-6 text-gray-500 text-sm font-medium">
          {menus.map((menu) => (
            <li key={menu.key} className="relative hover:text-blue-900  ">
              <button
                onClick={() => toggleDropdown(menu.key)}
                className={`font-sf ${
                  activeMenu === menu.key ? "text-blue-900" : ""
                }`}
              >
                {menu.label}
              </button>

              {activeMenu === menu.key && dropdownOpen && (
                <Suspense
                  fallback={
                    <div className="absolute top-10 left-0 bg-white p-4 shadow">
                      Loading...
                    </div>
                  }
                >
                  <div ref={dropdownRef}>
                    <Dropdown sections={dropdownData[menu.key]} />
                  </div>
                </Suspense>
              )}
            </li>
          ))}
        </ul>
      </div>

      <div className="flex items-center gap-4 text-gray-700">
        <a className="hidden sm:inline text-sm hover:text-blue-600 font-sf">
          Подробнее о APSoft
        </a>
        <button
          aria-label="Поиск"
          className="hover:text-blue-600 hidden sm:inline"
        >
          <Icon
            icon="mdi:magnify"
            width={20}
            className="text-gray-500 hover:text-blue-900"
          />
        </button>

        <div className="flex items-center gap-4">
          {user ? (
            <div className="relative" ref={userDropdownRef}>
              <button
                onClick={toggleUserDropdown}
                className="flex items-center gap-2"
                aria-label="User menu"
              >
                <Icon
                  icon="mdi:user"
                  width={20}
                  className={
                    userDropdownOpen
                      ? "text-blue-900"
                      : "text-gray-500 hover:text-blue-900"
                  }
                />
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 top-11 bg-white shadow-2xl w-full h-full sm:w-[300px] sm:h-auto sm:rounded border-0 sm:border sm:border-gray-200">
                  <div className="px-4 py-2 border-b">
                    <p className="text-sm font-medium text-gray-900 truncate max-w-[10rem]">
                      {user.username}
                    </p>
                    <p className="text-xs text-gray-500 truncate max-w-[10rem]">
                      {user.email}
                    </p>
                  </div>

                  <button
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                    onClick={() => setUserDropdownOpen(false)}
                  >
                    <Icon icon="mdi:cog" width={16} />
                    Settings
                  </button>

                  <div className="border-t my-1"></div>

                  <button
                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-100 flex items-center gap-2"
                    onClick={handleLogout}
                  >
                    <Icon icon="mdi:logout" width={16} />
                    Log Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Button
              size="sm"
              variant="primary"
              onClick={() => setModalOpen(true)}
              aria-label="Sign In"
            >
              Sign In
            </Button>
          )}
        </div>

        <Suspense fallback={<div>Loading...</div>}>
          <div className="relative" ref={regionSelectorRef}>
            <RegionSelector onCountrySelect={handleCountrySelect}>
              <Icon
                icon="mdi:earth"
                width={20}
                className="hidden sm:inline text-gray-500 hover:text-blue-900 mr-5"
              />
            </RegionSelector>
          </div>
        </Suspense>

        <button
          className="md:hidden hover:text-blue-600"
          aria-label="Меню"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <Icon icon="mdi:menu" width={20} />
        </button>
      </div>

      {modalOpen && (
        <Suspense fallback={<div>Loading...</div>}>
          <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="">
            <Auth closeModal={() => setModalOpen(false)} />
          </Modal>
        </Suspense>
      )}
    </nav>
  );
};

export default Navbar;
