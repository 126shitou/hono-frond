"use client";

import { cn } from "@/lib/utils";

// 选项卡项的接口定义
export interface TabItem {
  key: string; // 选项卡的唯一标识
  label: string; // 显示的文本
  disabled?: boolean; // 是否禁用
}

// Tabs组件的属性接口
export interface TabsProps {
  items: TabItem[]; // 选项卡数组
  activeKey: string; // 当前激活的选项卡key
  onChange: (key: string) => void; // 选项卡切换时的回调函数
  className?: string; // 自定义样式类名
  tabClassName?: string; // 单个选项卡的自定义样式
  backgroundClassName?: string; // 滑动背景的自定义样式
  containerClassName?: string; // 容器的自定义样式
  tabWidth?: string; // 单个选项卡的宽度
}

/**
 * 可复用的选项卡组件
 * 纯受控模式，需要外部管理状态
 */
export default function Tabs({
  items,
  activeKey,
  onChange,
  className,
  tabClassName,
  backgroundClassName,
  containerClassName,
  tabWidth = "w-40",
}: TabsProps) {
  // 处理选项卡点击事件
  const handleTabClick = (key: string, disabled?: boolean) => {
    if (disabled) return;
    onChange(key);
  };

  // 计算滑动背景的位置
  const getBackgroundPosition = () => {
    const activeIndex = items.findIndex((item) => item.key === activeKey);

    // Check if the tab index exceeds the maximum supported number
    if (activeIndex > 5) {
      throw new Error(
        `Tab index ${activeIndex} exceeds maximum supported count of 5. Please reduce the number of tabs or extend component support.`
      );
    }

    // 根据索引返回对应的位移类名
    switch (activeIndex) {
      case 0:
        return "translate-x-0";
      case 1:
        return "translate-x-full";
      case 2:
        return "translate-x-[200%]";
      case 3:
        return "translate-x-[300%]";
      case 4:
        return "translate-x-[400%]";
      case 5:
        return "translate-x-[500%]";
      default:
        return "translate-x-0";
    }
  };

  return (
    <div className={cn("flex justify-center", className)}>
      <div
        className={cn(
          "relative flex bg-[#2E2547] rounded-full p-1",
          containerClassName
        )}
      >
        {/* 滑动背景元素 */}
        <div
          className={cn(
            "absolute top-1 left-1 h-[calc(100%-0.5rem)] bg-[#857BA1] rounded-full transition-transform duration-500 ease-out",
            tabWidth,
            getBackgroundPosition(),
            backgroundClassName
          )}
        />

        {items.map((item) => (
          <button
            key={item.key}
            onClick={() => handleTabClick(item.key, item.disabled)}
            disabled={item.disabled}
            className={cn(
              "relative z-10 px-6 py-3 rounded-full text-sm font-medium transition-colors duration-300",
              tabWidth,
              // 激活状态样式
              activeKey === item.key
                ? "text-[#F2F2F2]"
                : "text-[#CFCFCF] hover:text-[#F2F2F2]",
              // 禁用状态样式
              item.disabled && "opacity-50 cursor-not-allowed",
              // 非禁用状态的鼠标样式
              !item.disabled && "cursor-pointer",
              tabClassName
            )}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}
