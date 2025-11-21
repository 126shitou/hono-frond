import i18next from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import resourcesToBackend from "i18next-resources-to-backend";
// import LocizeBackend from 'i18next-locize-backend'
import { initReactI18next } from "react-i18next/initReactI18next";
import { defaultLng, languages, defaultNS } from "./setting";

const runsOnServerSide = typeof window === "undefined";

i18next
  .use(initReactI18next)
  // 语言监测插件
  .use(LanguageDetector)
  .use(
    // 配置资源后端 动态导入翻译文件
    resourcesToBackend(
      (language: string, namespace: string) =>
        import(`./locales/${language}/${namespace}.json`)
    )
  )
  // 服务器端可以使用 Locize 后端，客户端使用本地文件
  // .use(runsOnServerSide ? LocizeBackend : resourcesToBackend((language, namespace) => import(`./locales/${language}/${namespace}.json`))) // locize backend could be used, but prefer to keep it in sync with server side
  .init({
    // debug: true,
    supportedLngs: languages,
    // 设置回退语言
    fallbackLng: defaultLng,
    // 不设置初始语言 让浏览器自动检查
    lng: undefined, // let detect the language on client side
    // 设置回退命名空间
    fallbackNS: defaultNS,
    // 设置默认命名空间
    defaultNS,
    // 语言监测顺序配置
    detection: {
      order: ["path", "htmlTag", "cookie", "navigator"],
    },
    // 服务器端预加载所有语言
    preload: runsOnServerSide ? languages : [],
    // backend: {
    //   projectId: '01b2e5e8-6243-47d1-b36f-963dbb8bcae3'
    // }
  });

export default i18next;
