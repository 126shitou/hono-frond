"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Image from "next/image";
import { useState } from "react";
import { signIn } from "next-auth/react"

import { useT } from "@/i18n/client";
// Loading Spinner组件
const LoadingSpinner = () => (
  <svg
    className="animate-spin h-5 w-5 text-primary"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    ></circle>
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    ></path>
  </svg>
);

// 定义组件props接口
interface LoginModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function LoginModal({ open, onOpenChange }: LoginModalProps) {
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const { t } = useT("modal");

  const handleGoogleLogin = async () => {

    setIsGoogleLoading(true);
    try {
      await signIn("google");
    } catch (error) {
      // 发生错误时重置loading状态
      setIsGoogleLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        // 登录过程中禁止关闭弹窗
        if (isGoogleLoading && !newOpen) {
          return;
        }
        onOpenChange(newOpen);
      }}
    >
      <DialogContent className="w-xs xs:w-md sm:w-lg md:w-xl bg-background-secondary text-txt-primary h-fit px-8">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-center gap-4 mb-6 ">
            <Image
              src="/icon.png"
              alt="logo"
              className="size-12 lg:size-14"
              width={48}
              height={48}
              quality={95}
            />
            <span className="text-2xl lg:text-3xl font-blod">AI Image Generator</span>
          </DialogTitle>
        </DialogHeader>
        <button
          className={`w-full cursor-pointer border border-bd-primary text-txt-primary rounded-2xl flex items-center justify-center gap-4 py-4 text-lg sm:text-xl hover:ring-2 hover:ring-bd-focus transition-all duration-200 mb-8 
            ${isGoogleLoading
              ? "opacity-70 cursor-not-allowed bg-btn-secondary-bg-active ring-2 ring-bd-focus"
              : " hover:bg-btn-secondary-bg-hover"
            }`}
          onClick={handleGoogleLogin}
          disabled={isGoogleLoading}
        >
          {isGoogleLoading ? (
            <>
              <LoadingSpinner />
              Loginging
            </>
          ) : (
            <>
              Continue With Google
            </>
          )}
        </button>
      </DialogContent>
    </Dialog>
  );
}
