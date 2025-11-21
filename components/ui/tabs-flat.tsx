"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils/cn";
import { Search } from "lucide-react";
// Tab项的接口定义
export interface TabItem {
  id: string;
  label: string;
}

// Tabs组件的属性接口
export interface TabsProps {
  items: TabItem[];
  defaultActiveId?: string;
  onTabChange?: (activeId: string) => void;
  className?: string;
  tabClassName?: string;
  contentClassName?: string;
  underlineClassName?: string;
  showSearchBar?: boolean;
}

export default function TabsFlat({
  items,
  defaultActiveId,
  onTabChange,
  className,
  tabClassName,
  underlineClassName,
  showSearchBar = true,
}: TabsProps) {
  // 设置默认激活的tab
  const [activeId, setActiveId] = useState(
    defaultActiveId || (items.length > 0 ? items[0].id : "")
  );

  // 处理tab切换
  const handleTabClick = (id: string) => {
    setActiveId(id);
    onTabChange?.(id);
  };

  return (
    <div className={cn("w-full flex justify-between items-center", className)}>
      <div className="relative flex gap-2 ">
        {items.map((item) => {
          const isActive = item.id === activeId;
          return (
            <button
              key={item.id}
              onClick={() => handleTabClick(item.id)}
              className={cn(
                "relative px-4 py-3   transition-all duration-300 cursor-pointer w-fit",
                isActive
                  ? " text-[#F2f2f2] "
                  : " text-[#CFCFCF] hover:text-[#F2f2f2]  ",
                tabClassName
              )}
            >
              <span className="relative inline-block">{item.label}</span>

              {/* 下划线动画效果 - 参考Header组件的实现 */}
              <div
                className={cn(
                  "absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#3563D7] to-[#9747FF] transition-transform duration-300 origin-left rounded-full",
                  isActive ? "scale-x-100" : "scale-x-0",
                  underlineClassName
                )}
              />
            </button>
          );
        })}
      </div>

      {showSearchBar && (
        <div className="border border-[#857BA1] px-4 py-1 rounded-lg w-60 h-9 flex items-center justify-center gap-2">
          <Search color="#857BA1" className="w-4 h-4" />
          <input
            type="text"
            placeholder="search something..."
            className="w-full h-full bg-transparent text-[#CFCFCF] placeholder:text-[#857BA1] placeholder:text-xs text-xs outline-none"
          />
        </div>
      )}
    </div>
  );
}
