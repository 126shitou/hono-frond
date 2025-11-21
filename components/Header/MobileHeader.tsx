"use client";
import { ChevronDown, LogOut, Menu, MessageSquare, X, Languages } from "lucide-react";
import { useState, useEffect } from "react";
import { useT } from "@/i18n/client";
import Image from "next/image";
import Link from "next/link";
import { useLogin } from "@/lib/contexts/login-dialog-context";
import { useUserInfo } from "@/lib/contexts/user-context";
import CheckInModal from "../CheckInModal";
import FeedbackModal from "../FeedBackModal";
import { cn } from "@/lib/utils/cn";
import { languagesWithFlag } from "@/i18n/setting";
import { useRouter, useParams, usePathname } from "next/navigation";
import UserDropDown from "./UserDropDown";
import getLngCode from "@/lib/utils/getLngCode";
import GTMWrapper from "../GTMWrapper";

export default function MobileHeader({ className }: { className?: string }) {
    const { t, i18n } = useT("layout");
    const code = i18n.resolvedLanguage || "en";
    const [open, setOpen] = useState(false);
    const { isLogin, user, logout } = useUserInfo();
    const { showLogin } = useLogin();

    // 语言切换相关状态和逻辑
    const [selectedLanguage, setSelectedLanguage] = useState(code);
    const [languageMenuOpen, setLanguageMenuOpen] = useState(false);
    const router = useRouter();
    const { lng } = useParams();
    const pathname = usePathname();

    // 关闭侧边栏的统一方法
    const handleClose = () => {
        setOpen(false);
    };

    const handleLanguageChange = (code: string) => {
        let newPath = "/";
        const lngInPathname = pathname.split("/")[1];

        // 如果当前浏览器显示的url路径与服务端的lng一致 说明不是默认页面 直接替换
        newPath =
            lngInPathname == lng
                ? pathname.replace(`/${lngInPathname}`, `/${code}`)
                : code + pathname;
        router.push(newPath);
        setLanguageMenuOpen(false); // 选择后关闭菜单
        handleClose(); // 关闭侧边栏
    };

    const handleLogout = () => {
        // TODO 二次确认
        logout();
    };
    useEffect(() => {
        setSelectedLanguage(lng as string);
    }, [lng]);


    const tools = [
        {
            img: "https://r2.aiimagegenerator.us/static/example/image-tools/ai-face-swap.webp",
            title: t('header.aiTools.faceSwap'),
            alt: "AI Face Swap Example",
            src: "/face-swap",
        },
        {
            title: t("header.aiTools.imageUpscaler"),
            img: `${process.env.NEXT_PUBLIC_CLOUDFLARE_CDN_URL}/static/example/image-upscaler/image-upscaler.webp`,
            alt: "AI Image Upscaler",
            src: "/image-upscaler"
        },
        {
            title: t("header.aiTools.backRemover"),
            img: `${process.env.NEXT_PUBLIC_CLOUDFLARE_CDN_URL}/static/example/background-remover/ai-background-remover.webp`,
            alt: "AI Image Background Remover",
            src: "/background-remover",
        },
    ]

    return (
        <>
            <div className={`flex items-center ${className}`}>
                {isLogin && user && <UserDropDown user={user} code={code!} logout={handleLogout} t={t} />}
                <Menu color="#F2F2F2" className="cursor-pointer" onClick={() => setOpen(!open)} />
            </div>
            {open && <div className="h-dvh bg-[#120A28] fixed top-0 right-0 overflow-y-auto z-50 w-full sm:max-w-sm border-l border-[#413856] xl:hidden">
                <div className="flex items-center justify-between mb-8 text-[#F2F2F2] p-6">
                    <Link
                        href={getLngCode(code, "")}
                        title=""
                        onClick={handleClose}
                        className="flex items-center gap-3 shrink-0 group hover:scale-[1.02] transition-all duration-300"
                    >
                        <Image
                            src="/icon.png"
                            alt="AI Image Generator logo"
                            width={36}
                            height={36}
                        />
                        <span className="font-bold text-xl text-[#f2f2f2] tracking-tight">
                            AI Image Generator
                        </span>
                    </Link>
                    <X size={24} color="#F2F2F2" className="cursor-pointer" onClick={handleClose} />
                </div>
                <nav className="flow-root" aria-label="Mobile navigation">
                    <ul className="space-y-2 py-2">
                        <li>
                            <details className="group text-[#F2F2F2]">
                                <summary className="cursor-pointer py-4 font-medium   flex items-center justify-between p-4 text-sm">
                                    <span className="text-base">{t("header.aiTools.title")}</span>
                                    <ChevronDown className="w-5 h-5 text-white group-open:rotate-180 transition-transform group-hover:text-white group-open:text-white" />
                                </summary>
                                <ul className="">
                                    {
                                        tools.map((item, index) =>
                                            <Link key={index} href={getLngCode(code, item.src)} title={item.title} onClick={handleClose}>
                                                <div
                                                    className="flex items-center gap-x-3 p-2 rounded-md hover:bg-white/5 transition-colors cursor-pointer"
                                                >
                                                    <img
                                                        src={item.img}
                                                        alt={item.alt}
                                                        width={100}
                                                        height={50}
                                                        className="w-16 h-8 rounded object-cover shrink-0"
                                                        loading="lazy"
                                                    />
                                                    <span className="text-sm font-medium text-white/90 leading-tight">
                                                        {item.title}
                                                    </span>
                                                </div>
                                            </Link>
                                        )
                                    }

                                </ul>
                            </details>
                        </li>
                    </ul>
                </nav>
                <Link className="p-4 block text-[#F2F2F2]   font-medium transition-colors hover:bg-[#857BA1]" href={getLngCode(code, "/pricing")} onClick={handleClose}>
                    {t("header.navigation.pricing")}
                </Link>
                <Link className="p-4 block text-[#F2F2F2]   font-medium transition-colors hover:bg-[#857BA1]" href={getLngCode(code, "/creations")} onClick={handleClose}>
                    {t("header.navigation.creation")}
                </Link>
                <div className="h-px bg-[#413856] w-full my-2"></div>
                <CheckInModal>
                    <span className="text-[#F2F2F2] flex  items-center gap-2 transition-colors hover:bg-[#857BA1] cursor-pointer p-4">
                        <svg width={16} height={16} viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path
                                d="M7 4.33332V13M7 4.33332C6.75885 3.33959 6.34363 2.49003 5.80849 1.89543C5.27335 1.30083 4.64312 0.988781 4 0.999986C3.55797 0.999986 3.13405 1.17558 2.82149 1.48814C2.50893 1.8007 2.33333 2.22463 2.33333 2.66665C2.33333 3.10868 2.50893 3.5326 2.82149 3.84516C3.13405 4.15772 3.55797 4.33332 4 4.33332M7 4.33332C7.24115 3.33959 7.65637 2.49003 8.19151 1.89543C8.72665 1.30083 9.35688 0.988781 10 0.999986C10.442 0.999986 10.866 1.17558 11.1785 1.48814C11.4911 1.8007 11.6667 2.22463 11.6667 2.66665C11.6667 3.10868 11.4911 3.5326 11.1785 3.84516C10.866 4.15772 10.442 4.33332 10 4.33332M11.6667 6.99999V11.6667C11.6667 12.0203 11.5262 12.3594 11.2761 12.6095C11.0261 12.8595 10.687 13 10.3333 13H3.66667C3.31304 13 2.97391 12.8595 2.72386 12.6095C2.47381 12.3594 2.33333 12.0203 2.33333 11.6667V6.99999M1.66667 4.33332H12.3333C12.7015 4.33332 13 4.6318 13 4.99999V6.33332C13 6.70151 12.7015 6.99999 12.3333 6.99999H1.66667C1.29848 6.99999 1 6.70151 1 6.33332V4.99999C1 4.6318 1.29848 4.33332 1.66667 4.33332Z"
                                stroke="url(#paint0_linear_1225_648)" strokeWidth="2" strokeLinecap="round"
                                strokeLinejoin="round" />
                            <defs>
                                <linearGradient id="paint0_linear_1225_648" x1="3" y1="1.00018" x2="11.5" y2="14.5002"
                                    gradientUnits="userSpaceOnUse">
                                    <stop stopColor="#FACF72" />
                                    <stop offset="1" stopColor="#BA52F7" />
                                </linearGradient>
                            </defs>
                        </svg>
                        <span className="text-sm font-medium">
                            {t("header.userActions.checkIn")}
                        </span>
                    </span>
                </CheckInModal>
                <FeedbackModal>
                    <span className="text-[#F2F2F2] flex items-center gap-2 p-4 rounded-md  hover:bg-[#857BA1] cursor-pointer">
                        <MessageSquare className="size-4" />
                        <span className="text-sm font-medium">
                            {t("header.userActions.feedback")}
                        </span>
                    </span>
                </FeedbackModal>

                {/* 移动端语言切换 */}
                <div className="text-[#F2F2F2]">
                    <div
                        className="flex items-center gap-2 p-4 rounded-md hover:bg-[#857BA1] cursor-pointer justify-between"
                        onClick={() => setLanguageMenuOpen(!languageMenuOpen)}
                    >
                        <div className="flex items-center gap-2">
                            <Languages className="size-4" />
                            <span className="text-sm font-medium">
                                {languagesWithFlag.find(
                                    (language) => language.code === selectedLanguage
                                )?.name || selectedLanguage}
                            </span>
                        </div>
                        <ChevronDown className={cn(
                            "size-4 transition-transform duration-200",
                            languageMenuOpen ? "rotate-180" : ""
                        )} />
                    </div>

                    {languageMenuOpen && (
                        <div className="bg-[#1a0f2e] border border-[#857BA1] rounded-lg mx-4 mb-2 p-4 mt-2">
                            <div className="grid grid-cols-2 gap-2">
                                {languagesWithFlag.map((language) => {
                                    const isSelected = selectedLanguage === language.code;
                                    return (
                                        <button
                                            key={language.code}
                                            onClick={() => handleLanguageChange(language.code)}
                                            className={cn(
                                                "flex items-center gap-2 p-2 rounded-md hover:bg-white/20 transition-colors cursor-pointer text-left w-full",
                                                isSelected ? "bg-white/20 text-white" : "text-white/75"
                                            )}
                                        >
                                            <span className="text-xs font-medium leading-tight">
                                                {language.name}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>


                {!isLogin
                    ?
                    <GTMWrapper GTMName="Login-Intention">
                        <span className="text-[#F2F2F2] flex items-center gap-2 p-4 rounded-md  hover:bg-[#857BA1]   cursor-pointer" onClick={() => { showLogin(); handleClose(); }}>
                            <LogOut className="size-4" />
                            <span className="text-sm font-medium">
                                {t("header.userActions.login")}
                            </span>
                        </span>
                    </GTMWrapper>
                    :
                    <span className="text-[#F2F2F2] flex items-center gap-2 p-4 rounded-md  hover:bg-[#857BA1]   cursor-pointer justify-between">
                        <div className="flex items-center gap-2">
                            <img src={user?.avatar || ""} alt="user avatar" className="size-6 rounded-full overflow-hidden" />
                            <span className="text-sm font-medium text-[#CFCFCF]">
                                {user?.name || "test"}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 px-2 py-1 bg-[#2E2547] rounded-lg">
                            <Image src="/points.svg" alt="points icon" width={16} height={24} />
                            <span>{user?.totalPoints || 0}</span>
                        </div>
                    </span>}

            </div>}
        </>
    );
}
