"use client";

import React, {
  createContext,
  use,
  useState,
  ReactNode,
  useCallback,
  lazy,
  Suspense,
  useEffect,
} from "react";

import { signOut } from "next-auth/react";

import type { User } from "@/lib/db/schema/user";
import { customError, customLog } from "../utils/log";
import { getUserInfo } from "@/actions/auth";

// 使用动态导入懒加载 InsufficientPointsModal 组件
const InsufficientPointsModal = lazy(
  () => import("@/components/InsufficientPointsModal")
);

interface UserContextType {
  isLogin: boolean;
  user: User | null;
  logout: () => void;
  refreshUserInfo: () => void;
  // 新增 InsufficientPointsModal 相关方法
  showInsufficientPointsModal: () => void;
  hideInsufficientPointsModal: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUserInfo = () => {
  const ctx = use(UserContext);
  if (!ctx) {
    throw new Error("useUserInfo must be used within UserProvider");
  }
  return ctx;
};

export const UserProvider = ({
  children,
 }: {
  children: ReactNode;
 }) => {
  const [user, setUser] = useState<User | null>(null);
  // 新增 InsufficientPointsModal 状态管理
  const [isInsufficientPointsModalOpen, setIsInsufficientPointsModalOpen] =
    useState(false);

  const refreshUserInfo = useCallback(async () => {
    try {
      const result = await getUserInfo();

      if (result.success) {
        setUser(result.data);
      } else {
        customError(
          `context > user-context > refreshUserInfo 获取用户信息失败: ${result.message}`
        );
      }
    } catch (error) {
      customError(
        `context > user-context > refreshUserInfo 获取用户信息失败: ${JSON.stringify(error)}`
      );
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await signOut({
        redirect: false,
      });
      customLog("context > user-context > logout 登出成功");

      // 清除本地用户状态
      setUser(null);
    } catch (error) {
      customError(
        "context > user-context > catch-error  退出登录失败：${JSON.stringify(error)}"
      );
    }
  }, []);

  useEffect(() => {
    console.log("useUserInfo");
    
    refreshUserInfo();
  }, [refreshUserInfo]);


  // 新增 InsufficientPointsModal 控制方法
  const showInsufficientPointsModal = useCallback(() => {
    setIsInsufficientPointsModalOpen(true);
  }, []);

  const hideInsufficientPointsModal = useCallback(() => {
    setIsInsufficientPointsModalOpen(false);
  }, []);

  const contextValue = {
    user,
    isLogin: user !== null,
    logout,
    refreshUserInfo,
    showInsufficientPointsModal,
    hideInsufficientPointsModal,
  };

  return (
    <UserContext value={contextValue}>
      {children}
      {/* 使用 Suspense 包装懒加载的 InsufficientPointsModal 组件 */}
      <Suspense fallback={null}>
        <InsufficientPointsModal
          open={isInsufficientPointsModalOpen}
          onOpenChange={setIsInsufficientPointsModalOpen}
        />
      </Suspense>
    </UserContext>
  );
};
