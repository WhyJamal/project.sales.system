import React, { Suspense } from "react";
import { Icon } from "@iconify/react";
import {
  Button,
  Spinner,
  SearchInput,
  UserDropdown,
} from "@/shared/components";
import { useUserStore } from "@shared/stores/userStore";
import { useNavigate } from "react-router-dom";
import useNavbarConfig from "./config";
import useNavbar from "./hooks/useNavbar";
import { useTranslation } from "react-i18next";

const Dropdown = React.lazy(() => import("./dropdown"));
const RegionSelector = React.lazy(() => import("./region-selector"));
const Modal = React.lazy(() => import("@/shared/components/common/modal"));
const Auth = React.lazy(() => import("@/features/auth/auth-form"));

const Navbar: React.FC = () => {
  const { t } = useTranslation("navbar");
  const { user, logout } = useUserStore();
  const navigate = useNavigate();
  const menus = useNavbarConfig();

  const {
    // state
    menuOpen,
    dropdownOpen,
    activeMenu,
    userDropdownOpen,
    modalOpen,
    isRegister,
    authLoading,
    mobileStep,
    activeMenuKey,
    activeSectionIndex,
    mobileDropdownOpen,
    // refs (ADD THESE)
    userDropdownRef,
    dropdownRef,
    regionSelectorRef,
    mobileMenuRef,
    hamburgerRef,
    // handlers
    setMenuOpen,
    toggleDropdown,
    toggleUserDropdown,
    handleLogout,
    handleOpenModal,
    handleCloseModal,
    handleCountrySelect,
    openSections,
    openItems,
    backToMenu,
    backToSections,
    translateClass,
    setMobileDropdownOpen,
    setUserDropdownOpen,
  } = useNavbar({ navigate, logout });

  const AuthLoader: React.FC<{
    closeModal: () => void;
    isRegister: boolean;
    setIsRegister: (v: boolean) => void;
  }> = ({ closeModal, isRegister, setIsRegister }) => {
    return (
      <Auth
        closeModal={closeModal}
        isRegister={isRegister}
        setIsRegister={setIsRegister}
      />
    );
  };

  const getMenuByKey = (key?: string | null) =>
    menus.find((m) => m.key === key) as (typeof menus)[number] | undefined;

  return (
    <nav
      className="flex items-center justify-between px-4 sm:px-4 py-2 sm:py-0 bg-white shadow-md relative min-h-[3rem]"
      style={{ backgroundColor: "rgba(255,255,255,0.97)" }}
    >
      <div className="flex items-center gap-3 sm:gap-5 sm:p-1">
        <div className="items-center select-none block sm:hidden lg:block">
          {!menuOpen && (
            <div
              onClick={() => navigate("/")}
              className="sm:px-2"
            >
              <img
                src="/brands/logo.webp"
                alt="APS Logo"
                className="h-9 w-auto"
              />
            </div>
          )}
        </div>

        <ul 
          className="hidden md:flex items-center gap-6 text-gray-500 text-sm font-medium"
        >
          {menus.map((menu) => {
            const hasDropdown = !!menu.dropdown && menu.dropdown.length > 0;

            return (
              <li key={menu.key} className="relative hover:text-blue-900">
                <button
                  onClick={() => {
                    if (menu.url) {
                      navigate(menu.url);
                      setMobileDropdownOpen(null);
                    } else if (hasDropdown) {
                      toggleDropdown(menu.key);
                    }
                  }}
                  className={`font-sf flex items-center gap-1 ${
                    activeMenu === menu.key ? "text-blue-900" : ""
                  }`}
                >
                  {t(menu.labelKey)}
                  {hasDropdown && (
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
                  hasDropdown &&
                  !menu.url && (
                    <Suspense
                      fallback={
                        <div className="absolute top-11 bg-white p-2 shadow">
                          <Spinner />
                        </div>
                      }
                    >
                      <div ref={dropdownRef}>
                        <Dropdown sections={menu.dropdown!} />
                      </div>
                    </Suspense>
                  )}
              </li>
            );
          })}
        </ul>
      </div>

      <div className="flex items-center gap-2 sm:gap-2 text-gray-700">
        <SearchInput />

        <div className={`sm:block`} ref={regionSelectorRef}>
          <Suspense fallback={<Spinner />}>
            <RegionSelector onCountrySelect={handleCountrySelect} />
          </Suspense>
        </div>

        <div className={`flex items-center gap-3 sm:gap-4`}>
          {user ? (
            <div className="relative" ref={userDropdownRef}>
              <button
                onClick={toggleUserDropdown}
                className="flex items-center gap-2"
                aria-label="User menu"
              >
                {user?.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.username}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gray-400 flex items-center justify-center text-white">
                    {user?.username?.[0]?.toUpperCase() || "?"}
                  </div>
                )}
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
              className="relative font-semibold"
              loading={authLoading}
            >
              Войти
            </Button>
          )}
        </div>

        {menuOpen && (
          <div className="text-gray-700 font-normal md:hidden">|</div>
        )}

        <button
          ref={hamburgerRef}
          className="md:hidden hover:text-blue-600"
          aria-label="Menu"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <Icon icon={menuOpen ? "mdi:close" : "mdi:menu"} width={20} />
        </button>
      </div>

      {menuOpen && (
        <div ref={mobileMenuRef} className="md:hidden absolute top-full left-0 right-0 bg-white border-r shadow-lg z-40 max-h-[calc(100vh-4rem)] overflow-hidden">
          <div className="border-t border-gray-100">
            <div
              className={`flex w-[300%] transition-transform duration-300 ease-in-out ${translateClass}`}
            >
              <div className="w-1/3 px-4 py-3 overflow-y-auto max-h-[calc(100vh-4rem)]">
                <div className="w-full flex items-center gap-2 py-3 px-3 rounded-full hover:bg-gray-50">
                  <Icon
                    icon="mdi:magnify"
                    width={18}
                    className="text-gray-500"
                  />
                  <input
                    type="text"
                    placeholder="Поиск"
                    className="w-full bg-transparent outline-none"
                  />
                </div>

                <ul className="space-y-1">
                  {menus.map((menu) => (
                    <li
                      key={menu.key}
                      className="border-b border-gray-100 last:border-b-0"
                    >
                      <button
                        onClick={() => {
                          if (menu.url) {
                            navigate(menu.url);
                            setMobileDropdownOpen(null);
                            setMenuOpen(false);
                          } else if (menu.dropdown && menu.dropdown.length) {
                            openSections(menu.key);
                          }
                        }}
                        className="w-full flex items-center justify-between py-3 text-left"
                      >
                        <span>{t(menu.labelKey)}</span>
                        {!menu.url &&
                          menu.dropdown &&
                          menu.dropdown.length > 0 && (
                            <Icon icon="mdi:chevron-right" width={20} />
                          )}
                      </button>
                    </li>
                  ))}
                </ul>

                <div className="pt-4 border-t border-gray-100 mt-3">
                  <a className="block py-3 hover:bg-gray-50 rounded text-gray-700 hover:text-blue-900 text-base">
                    Подробнее о APSoft
                  </a>
                </div>
              </div>

              <div className="w-1/3 px-4 py-3 overflow-y-auto max-h-[calc(100vh-4rem)]">
                <button
                  onClick={backToMenu}
                  className="flex items-center gap-2 py-2 text-sm font-medium"
                >
                  <Icon icon="mdi:chevron-left" width={18} />
                  Назад
                </button>

                {activeMenuKey &&
                  getMenuByKey(activeMenuKey)?.dropdown?.map(
                    (section, index) => (
                      <button
                        key={section.titleKey}
                        onClick={() => openItems(index)}
                        className="w-full flex items-center justify-between py-3 border-b"
                      >
                        <span>{t(section.titleKey)}</span>
                        <Icon icon="mdi:chevron-right" width={18} />
                      </button>
                    )
                  )}
              </div>

              <div className="w-1/3 px-4 py-3 overflow-y-auto max-h-[calc(100vh-4rem)]">
                <button
                  onClick={backToSections}
                  className="flex items-center gap-2 py-2 text-sm font-medium"
                >
                  <Icon icon="mdi:chevron-left" width={18} />
                  Назад
                </button>

                {getMenuByKey(activeMenuKey)?.dropdown?.[
                  activeSectionIndex!
                ]?.items.map((item) => (
                  <button
                    key={item.label ?? (item.labelKey || item.url)}
                    onClick={() => {
                      if (item.url) {
                        navigate(item.url);
                        setMenuOpen(false);
                      }
                    }}
                    className="w-full text-left py-3 border-b"
                  >
                    {item.labelKey ? t(item.labelKey) : item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {modalOpen && (
        <Suspense fallback={null}>
          <Modal
            open={modalOpen}
            onClose={handleCloseModal}
            title={isRegister ? t("modals.register") : t("modals.login")}
          >
            <AuthLoader
              closeModal={handleCloseModal}
              isRegister={isRegister}
              setIsRegister={() => {}}
            />
          </Modal>
        </Suspense>
      )}
    </nav>
  );
};

export default Navbar;