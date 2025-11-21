"use client";
import {
    Settings,
    Crown,
    Sparkle,
    LogOut,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import getLngCode from "@/lib/utils/getLngCode";
import Image from "next/image";

import AccountModal from "../AccountModal";
import BillsModal from "../BillsModal";

import { type User } from "@/lib/db/schema/user";
export default function UserDropDown({
    user,
    code,
    logout,
    t,
}: {
    user: User;
    code: string;
    logout: () => void;
    t: (key: string) => string;
}) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div
            className="relative group"
            onMouseEnter={() => setIsOpen(true)}
            onMouseLeave={() => { setIsOpen(false) }}
        >
            {/* 用户头像按钮 */}
            <button
                className="relative flex items-center gap-2 px-3 py-2 text-txt-primary  rounded-md cursor-pointer hover:bg-background-tertiary transition-colors duration-300"
                onClick={() => setIsOpen(!isOpen)}
            >
                <img
                    // TODO 处理avatar为空的情况
                    src={user.avatar!}
                    alt="avatar"
                    className="rounded-full size-6"
                    width={24}
                    height={24}
                />
                <span className="truncate max-w-24 hidden xs:block">{user.name || user.email}</span>
            </button>

            {/* 下拉菜单 - 支持桌面端 hover 和移动端 click */}
            <div className={`
                absolute right-0 top-12 p-4 z-50 bg-card-secondary-bg rounded-xl w-80
                transition-all duration-200 transform border border-bd-secondary
                ${(isOpen)
                    ? 'opacity-100 visible translate-y-0'
                    : ' translate-y-2 opacity-0 invisible'
                }
            `}>

                <div className="space-y-2 py-2">
                    <span className="text-base text-txt-primary font-medium truncate">
                        {user.name || user.email}
                    </span>
                    <p className="text-txt-tertiary text-xs truncate">{user.email}</p>
                </div>
                <div className="h-0.5 bg-background-tertiary w-full  "></div>
                <div className="flex items-center gap-2 mt-4">

                    <span className="text-sm text-txt-primary capitalize">
                        {user.totalPoints} Credits Left
                    </span>
                </div>

                <Link href={getLngCode(code, "/pricing")}  >
                    <div className="flex items-center justify-center py-3 mt-3 rounded-full   gap-2 bg-btn-primary-bg leading-6 text-txt-inverse">
                        UP to 50% off

                    </div>
                </Link>

                <div className="space-y-2 pt-4">
                    <AccountModal user={user}>
                        <button
                            className="flex items-center gap-2 text-txt-primary text-sm  hover:bg-btn-secondary-bg-hover rounded-md p-2 w-full cursor-pointer"
                            onClick={() => setIsOpen(false)}
                        >
                            <Settings className="size-5" />
                            ManageAccount
                        </button>
                    </AccountModal>

                    <Link
                        href={getLngCode(code!, "/pricing")}
                        className="flex items-center gap-2 text-txt-primary text-sm  hover:bg-btn-secondary-bg-hover rounded-md p-2"
                        onClick={() => setIsOpen(false)}
                    >
                        <Crown className="size-5" />
                        Manage Subscription
                    </Link>

                    <BillsModal>
                        <button
                            className="flex items-center gap-2 text-txt-primary text-sm  hover:bg-btn-secondary-bg-hover rounded-md p-2 w-full cursor-pointer"
                            onClick={() => setIsOpen(false)}
                        >
                            <Sparkle className="size-5" />
                            Points Details
                        </button>
                    </BillsModal>

                    <button
                        className="flex items-center gap-2 text-txt-primary text-sm hover:bg-btn-secondary-bg-hover rounded-md p-2 w-full cursor-pointer"
                        onClick={() => {
                            setIsOpen(false);
                            logout();
                        }}
                    >
                        <LogOut className="size-5" />
                        Log out
                    </button>
                </div>
            </div>
        </div>
    );
}
