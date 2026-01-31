import { useState, useEffect, useRef, useCallback } from "react";
import { DropdownKeys } from "../navbar.types";
import useOutsideClick from "./useOutsideClick";

interface UseNavbarProps {
  navigate: (path: string) => void;
  logout: () => void;
}

const useNavbar = ({ navigate, logout }: UseNavbarProps) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState<DropdownKeys | null>(null);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [regionSelectorOpen, setRegionSelectorOpen] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [mobileDropdownOpen, setMobileDropdownOpen] = useState<DropdownKeys | null>(null);

  const [mobileStep, setMobileStep] = useState<"menu" | "sections" | "items">("menu");
  const [activeMenuKey, setActiveMenuKey] = useState<DropdownKeys | null>(null);
  const [activeSectionIndex, setActiveSectionIndex] = useState<number | null>(null);

  const userDropdownRef = useRef<HTMLDivElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const regionSelectorRef = useRef<HTMLDivElement | null>(null);
  const mobileMenuRef = useRef<HTMLDivElement | null>(null);

  useOutsideClick([userDropdownRef, dropdownRef, regionSelectorRef, mobileMenuRef], (targetRef) => {
    if (targetRef === userDropdownRef) setUserDropdownOpen(false);
    if (targetRef === dropdownRef) {
      setDropdownOpen(false);
      setActiveMenu(null);
    }
    if (targetRef === regionSelectorRef) setRegionSelectorOpen(false);
    if (targetRef === mobileMenuRef) {
      setMenuOpen(false);
      setMobileDropdownOpen(null);
    }
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
        setModalOpen(false);
        setDropdownOpen(false);
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const toggleDropdown = (menu: DropdownKeys) => {
    if (activeMenu === menu) {
      setDropdownOpen((v) => !v);
      if (dropdownOpen) setActiveMenu(null);
    } else {
      setActiveMenu(menu);
      setDropdownOpen(true);
    }
  };

  const toggleUserDropdown = () => setUserDropdownOpen((v) => !v);

  const handleLogout = useCallback(() => {
    logout();
    setUserDropdownOpen(false);
  }, [logout]);

  const handleOpenModal = () => {
    setModalOpen(true);
    setAuthLoading(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setAuthLoading(false);
    setIsRegister(false);
  };

  const handleCountrySelect = (country: string) => {
    setRegionSelectorOpen(false);
  };

  const openSections = (key: DropdownKeys) => {
    setActiveMenuKey(key);
    setMobileStep("sections");
  };

  const openItems = (index: number) => {
    setActiveSectionIndex(index);
    setMobileStep("items");
  };

  const backToMenu = () => {
    setActiveMenuKey(null);
    setActiveSectionIndex(null);
    setMobileStep("menu");
  };

  const backToSections = () => {
    setActiveSectionIndex(null);
    setMobileStep("sections");
  };

  const translateClass =
    mobileStep === "menu" ? "translate-x-0" : mobileStep === "sections" ? "-translate-x-1/3" : "-translate-x-2/3";

  return {
    menuOpen,
    setMenuOpen,
    dropdownOpen,
    setDropdownOpen,
    activeMenu,
    setActiveMenu,
    userDropdownOpen,
    setUserDropdownOpen,
    modalOpen,
    setModalOpen,
    isRegister,
    setIsRegister,
    authLoading,
    setAuthLoading,
    regionSelectorOpen,
    setRegionSelectorOpen,
    mobileDropdownOpen,
    setMobileDropdownOpen,
    mobileStep,
    setMobileStep,
    activeMenuKey,
    setActiveMenuKey,
    activeSectionIndex,
    setActiveSectionIndex,
    userDropdownRef,
    dropdownRef,
    regionSelectorRef,
    mobileMenuRef,
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
  } as const;
};

export default useNavbar;
