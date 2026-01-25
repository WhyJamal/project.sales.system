import React, { useState, useRef, useEffect, Suspense, lazy } from "react";
import { Icon } from "@iconify/react";
import {
  Button,
  Spinner,
  SearchInput,
  UserDropdown,
} from "@/shared/components";
import { useUserStore } from "@shared/stores/userStore";
import { DropdownKeys } from "./navbar.types";
import { useNavigate } from "react-router-dom";
import menus from "./config/NavbarData";
import useDropdownData from "./config/useDropdownData";

const Dropdown = lazy(() => import("./dropdown"));
const RegionSelector = lazy(() => import("./region-selector"));
const Modal = lazy(() => import("@/shared/components/common/modal"));
const Auth = lazy(() => import("@/features/auth/auth-form"));

const Navbar: React.FC = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownData = useDropdownData();
  const [activeMenu, setActiveMenu] = useState<DropdownKeys | null>(null);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [regionSelectorOpen, setRegionSelectorOpen] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [mobileDropdownOpen, setMobileDropdownOpen] =
    useState<DropdownKeys | null>(null);

  const { user, logout } = useUserStore();
  const navigate = useNavigate();

  const userDropdownRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const regionSelectorRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  const handleCountrySelect = (country: string) => {
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
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target as Node) &&
        !(event.target as Element).closest('button[aria-label="Меню"]')
      ) {
        setMenuOpen(false);
        setMobileDropdownOpen(null);
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

  const toggleMobileDropdown = (menu: DropdownKeys) => {
    if (mobileDropdownOpen === menu) {
      setMobileDropdownOpen(null);
    } else {
      setMobileDropdownOpen(menu);
    }
  };

  const toggleUserDropdown = () => setUserDropdownOpen(!userDropdownOpen);

  const handleLogout = () => {
    logout();
    setUserDropdownOpen(false);
  };

  const handleOpenModal = () => {
    setModalOpen(true);
    setAuthLoading(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setAuthLoading(false);
    setIsRegister(false);
  };

  interface AuthLoaderProps {
    closeModal: () => void;
    isRegister: boolean;
    setIsRegister: React.Dispatch<React.SetStateAction<boolean>>;
  }

  const AuthLoader: React.FC<AuthLoaderProps> = ({
    closeModal,
    isRegister,
    setIsRegister,
  }) => {
    useEffect(() => {
      setAuthLoading(false);
    }, []);

    return (
      <Auth
        closeModal={closeModal}
        isRegister={isRegister}
        setIsRegister={setIsRegister}
      />
    );
  };

  return (
    <nav className="flex items-center justify-between px-4 sm:px-6 py-3 bg-white shadow-sm relative">
      <div className="flex items-center gap-3 sm:gap-5 p-1">
        <div className="flex items-center gap-2 select-none">
          <div
            onClick={() => navigate("/")}
            className="px-2 shadow-sm tracking-wider select-none font-roboto"
          >
            <img
              src="/brands/logo.webp"
              alt="APS Logo"
              className="h-6 sm:h-7 w-auto select-none"
            />
          </div>
        </div>

        <ul className="hidden md:flex items-center gap-6 text-gray-500 text-sm font-medium">
          {menus.map((menu) => (
            <li key={menu.key} className="relative hover:text-blue-900">
              <button
                onClick={() => {
                  if (menu.url) {
                    navigate(menu.url);
                    setDropdownOpen(false);
                    setActiveMenu(null);
                  } else {
                    toggleDropdown(menu.key);
                  }
                }}
                className={`font-sf flex items-center gap-1 ${
                  activeMenu === menu.key ? "text-blue-900" : ""
                }`}
              >
                {menu.label}
                {!menu.url && dropdownData[menu.key] && (
                  <Icon
                    icon={
                      activeMenu === menu.key && dropdownOpen
                        ? "mdi:chevron-up"
                        : "mdi:chevron-down"
                    }
                    width={16}
                    className="mt-0.5"
                  />
                )}
              </button>

              {activeMenu === menu.key &&
                dropdownOpen &&
                dropdownData[menu.key] &&
                !menu.url && (
                  <Suspense
                    fallback={
                      <div className="absolute top-11 bg-white p-2 shadow">
                        <Spinner />
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

      <div className="flex items-center gap-3 sm:gap-4 text-gray-700">
        <SearchInput />

        <div className="flex items-center gap-3 sm:gap-4">
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

              <UserDropdown
                user={user}
                isOpen={userDropdownOpen}
                onClose={() => setUserDropdownOpen(false)}
                onLogout={handleLogout}
              />
            </div>
          ) : (
            <Button
              size="sm"
              variant="primary"
              onClick={handleOpenModal}
              aria-label="Войти"
              className="relative"
            >
              <span
                className={
                  authLoading ? "opacity-0" : "opacity-100 font-semibold"
                }
              >
                Войти
              </span>

              {authLoading && (
                <span className="absolute inset-0 flex items-center justify-center">
                  <Icon
                    icon="line-md:loading-twotone-loop"
                    className="w-5 h-5 animate-spin"
                  />
                </span>
              )}
            </Button>
          )}
        </div>

        <Suspense fallback={<Spinner />}>
          <div className="relative" ref={regionSelectorRef}>
            <RegionSelector onCountrySelect={handleCountrySelect}>
              <Icon
                icon="mdi:earth"
                width={20}
                className="text-gray-500 hover:text-blue-900"
              />
            </RegionSelector>
          </div>
        </Suspense>

        <button
          className="md:hidden hover:text-blue-600"
          aria-label="Меню"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <Icon icon={menuOpen ? "mdi:close" : "mdi:menu"} width={20} />
        </button>
      </div>

      {menuOpen && (
        <div
          className="md:hidden absolute top-full left-0 right-0 bg-white shadow-lg z-40 max-h-[calc(100vh-4rem)] overflow-y-auto"
          ref={mobileMenuRef}
        >
          <div className="px-4 py-3 border-t border-gray-100">
            <ul className="space-y-1">
              {menus.map((menu) => (
                <li
                  key={menu.key}
                  className="border-b border-gray-100 last:border-b-0"
                >
                  <div className="flex items-center justify-between py-3">
                    <button
                      onClick={() => {
                        if (menu.url) {
                          navigate(menu.url);
                          setMenuOpen(false);
                          setMobileDropdownOpen(null);
                        } else if (dropdownData[menu.key]) {
                          toggleMobileDropdown(menu.key);
                        }
                      }}
                      className="text-left flex-1"
                    >
                      {menu.label}
                    </button>
                    {!menu.url && dropdownData[menu.key] && (
                      <button
                        onClick={() => toggleMobileDropdown(menu.key)}
                        className="p-2"
                      >
                        <Icon
                          icon={
                            mobileDropdownOpen === menu.key
                              ? "mdi:chevron-up"
                              : "mdi:chevron-down"
                          }
                          width={20}
                          className="text-gray-500"
                        />
                      </button>
                    )}
                  </div>

                  {mobileDropdownOpen === menu.key &&
                    dropdownData[menu.key] &&
                    !menu.url && (
                      <div className="mb-3">
                        <Suspense fallback={<Spinner />}>
                          <Dropdown
                            sections={dropdownData[menu.key]}
                            isMobile={true}
                          />
                        </Suspense>
                      </div>
                    )}
                </li>
              ))}
            </ul>

            <div className="pt-4 border-t border-gray-100 mt-3">
              <a className="block py-3 hover:bg-gray-50 rounded text-gray-700 hover:text-blue-900 text-base">
                Подробнее о APSoft
              </a>
              <button className="w-full text-left py-3 hover:bg-gray-50 rounded text-gray-700 hover:text-blue-900 text-base flex items-center gap-2">
                <Icon icon="mdi:magnify" width={18} />
                Поиск
              </button>
            </div>
          </div>
        </div>
      )}

      {modalOpen && (
        <Suspense fallback={null}>
          <Modal
            open={modalOpen}
            onClose={handleCloseModal}
            title={isRegister ? "Создать аккаунт" : "С возвращением"}
          >
            <AuthLoader
              closeModal={handleCloseModal}
              isRegister={isRegister}
              setIsRegister={setIsRegister}
            />
          </Modal>
        </Suspense>
      )}
    </nav>
  );
};

export default Navbar;
