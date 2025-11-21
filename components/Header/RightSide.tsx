"use client";
import {
  LogIn,
  MessageSquare,
  Plus,
} from "lucide-react";
import Link from "next/link";
import LanguagesSwitch from "../LanguagesSwitch";



//  TODO 懒加载
import CheckInModal from "../CheckInModal";

import FeedbackModal from "../FeedBackModal";

import { useT } from "@/i18n/client";
import { useLogin } from "@/lib/contexts/login-dialog-context";
import { useUserInfo } from "@/lib/contexts/user-context";
import getLngCode from "@/lib/utils/getLngCode";

import UserDropDown from "./UserDropDown";
import GTMWrapper from "../GTMWrapper";

export default function RightSide({ className }: { className?: string }) {
  const { showLogin } = useLogin();
  const { user, isLogin, logout } = useUserInfo();
  const { t, i18n } = useT("layout");
  const code = i18n.resolvedLanguage || "en";

  const handleLogout = () => {
    // TODO 二次确认
    logout();
  };

  const getLevel = (type: string) => {
    if (type === "free") {
      return "Free";
    } else if (type === "basic") {
      return "Basic";
    } else if (type === "ultimate") {
      return "Ultimate";
    }
  }
  return (
    <div className={`h-full flex items-center gap-4 ${className}`}>
      {/* <CheckInModal>
        <button className="text-txt-secondary flex items-center gap-2 p-2 rounded-md  hover:bg-background-tertiary transition-colors duration-200 hover:text-primary cursor-pointer ">
          <CheckInICon className="size-4" />
          <span className="text-sm font-medium">
            Free Credit
          </span>
        </button>
      </CheckInModal> */}
      <FeedbackModal>
        <span className="text-txt-secondary flex items-center gap-2 p-2 rounded-md  hover:bg-background-tertiary transition-colors duration-200 hover:text-primary cursor-pointer">
          <MessageSquare className="size-4" />
          <span className="text-sm font-medium">
            Feedback
          </span>
        </span>
      </FeedbackModal>

      <LanguagesSwitch code={code!} />

      {!(isLogin && user) ? (
        <GTMWrapper GTMName="Login-Intention">
          <button
            className="text-txt-secondary flex items-center gap-2 p-2 rounded-md  hover:bg-background-tertiary transition-colors duration-200 hover:text-primary cursor-pointer"
            aria-haspopup="dialog"
            aria-label="login"
            onClick={showLogin}
          >
            <LogIn className="size-4" />
            <span className="text-sm font-medium">
              Login
            </span>
          </button>
        </GTMWrapper>
      ) : (
        <>
          <UserDropDown user={user} code={code!} logout={handleLogout} t={t} />
          <button className="relative flex items-center gap-2 px-2 py-1 text-txt-primary rounded-md cursor-pointer bg-btn-tertiary-bg transition-colors duration-300" aria-haspopup="true" aria-label="free points">
            <span>{user?.totalPoints}</span>
          </button>
        </>
      )}
    </div>
  );
}
