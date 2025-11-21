"use client";

import React, {
  createContext,
  use,
  useState,
  ReactNode,
  useCallback,
} from "react";
// TODO 性能处理：使用动态导入和条件渲染保持异步加载优势，但添加延迟卸载来支持关闭动画
import LoginModal from "@/components/LoginModal";
// const LoginModal = dynamic(() => import("@/components/LoginModal"));

interface LoginContextType {
  showLogin: () => void;
  hideLogin: () => void;
  isLoginOpen: boolean;
}

const LoginDialogContext = createContext<LoginContextType | undefined>(
  undefined
);

export const useLogin = () => {
  const ctx = use(LoginDialogContext);
  if (!ctx) {
    throw new Error("useLogin must be used within LoginDialogProvider");
  }
  return ctx;
};

export const LoginDialogProvider = ({ children }: { children: ReactNode }) => {
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  const showLogin = useCallback(() => setIsLoginOpen(true), []);
  const hideLogin = useCallback(() => setIsLoginOpen(false), []);

  const contextValue = {
    showLogin,
    hideLogin,
    isLoginOpen,
  };

  return (
    <LoginDialogContext value={contextValue}>
      {children}
      <LoginModal open={isLoginOpen} onOpenChange={setIsLoginOpen} />
    </LoginDialogContext>
  );
};
