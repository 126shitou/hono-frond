"use client";
import { Languages } from "lucide-react";
import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { languagesWithFlag } from "@/i18n/setting";
import { useRouter, useParams, usePathname } from "next/navigation";

export default function LanguagesSwitch({ code }: { code: string }) {
  const [selectedLanguage, setSelectedLanguage] = useState(code);
  const router = useRouter();
  const { lng } = useParams();
  const pathname = usePathname();


  const handleChange = (code: string) => {
    let newPath = "/";
    const lngInPathname = pathname.split("/")[1];

    // 如果当前浏览器显示的url路径与服务端的lng一致 说明不是默认页面 直接替换
    newPath =
      lngInPathname == lng
        ? pathname.replace(`/${lngInPathname}`, `/${code}`)
        : code + pathname;
    router.push(newPath);
  };

  useEffect(() => {

    setSelectedLanguage(lng as string);
  }, [lng]);

  return (
    <div className="relative group">
      {/* 语言选择按钮 */}
      <button className="relative flex items-center gap-2 px-3 py-2 text-txt-secondary group-hover:text-primary  rounded-md cursor-pointer hover:bg-background-tertiary transition-colors duration-300" aria-haspopup="true" aria-label="language switch">
        <Languages className="size-4" />
        <span className="relative inline-block text-sm text-semibold w-16">
          {languagesWithFlag.find(
            (language) => language.code === selectedLanguage
          )?.name || selectedLanguage}
        </span>
        <ChevronDown className=" transition-all duration-300 text-txt-secondary group-hover:text-primary group-hover:rotate-180 size-4" />
      </button>

      {/* 下拉菜单 */}
      <div className="absolute right-0 top-full pt-3 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform group-hover:translate-y-0 translate-y-2">
        <nav className="bg-background-secondary border border-bd-secondary rounded-lg shadow-xl p-1">
          <div className="flex flex-col gap-2 mb-4 w-fit">
            {languagesWithFlag.map((language) => {
              const isSelected = selectedLanguage === language.code;
              return (
                <button
                  key={language.code}
                  onClick={() => handleChange(language.code)}
                  className={cn(
                    "flex items-center justify-between gap-3 px-4 py-2 rounded-md hover:bg-btn-secondary-bg-hover transition-colors cursor-pointer text-left w-full min-w-44",
                    isSelected ? "bg-btn-secondary-bg-hover text-txt-primary" : ""
                  )}
                >
                  <span className="text-sm font-medium text-txt-secondary leading-tight">
                    {language.name}
                  </span>
                  {isSelected && <span className="text-txt-tertiary text-xs">
                    Select
                  </span>}
                </button>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
