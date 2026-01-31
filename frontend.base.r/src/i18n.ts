import i18n from "i18next";
import { initReactI18next } from "react-i18next";

// TOON parser
const parseTOON = (str: string) => {
  const lines = str.split("\n").filter(Boolean);
  const result: any = {};

  const processLine = (line: string, obj: any, indent = 0) => {
    const match = line.match(/^(\s*)([^:]+):(.+)$/);
    if (!match) return;
    const [ , spaces, key, value ] = match;
    const level = spaces.length / 2;
    if (level > indent) return; // ignore nested for simplicity
    obj[key.trim()] = value.trim();
  };

  lines.forEach((line) => processLine(line, result));
  return result;
};

// dynamic import TOON files
const loadTOON = async (lang: string) => {
  const res = await fetch(`/locales/${lang}.toon`);
  const text = await res.text();
  return parseTOON(text);
};

i18n
  .use(initReactI18next)
  .init({
    lng: "uz",
    fallbackLng: "uz",
    resources: {},
    interpolation: { escapeValue: false },
  });

// TOONni yuklash
["uz", "ru", "en"].forEach(async (lang) => {
  const data = await loadTOON(lang);
  i18n.addResourceBundle(lang, "translation", data, true, true);
});

export default i18n;
