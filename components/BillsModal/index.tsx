"use client";

import React, { useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
  DialogFooter,
} from "@/components/ui/dialog";
import { XIcon, Info } from "lucide-react";
import Tabs, { TabItem } from "@/components/ui/tabs";
import { DialogTrigger } from "@radix-ui/react-dialog";
import { Loading } from "@/components/Loading";
 
import { useUserInfo } from "@/lib/contexts/user-context";
import { type PointsHistoryItem } from "@/app/api/point/route";
import { useT } from "@/i18n/client";

export default function BillsModal({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useUserInfo();
  const { t } = useT("modal");

  // 状态管理：当前选中的tab
  const [activeTab, setActiveTab] = useState("all");
  const [loading, setLoading] = useState(false);
  const [pointsHistory, setPointsHistory] = useState<PointsHistoryItem[]>([]);
  const [originData, setOriginData] = useState<PointsHistoryItem[]>([]);

  // 定义选项卡数据
  // 注意：所有 key 值都应该在 handleTabChange 的 switch 中有对应的处理逻辑
  const tabItems: TabItem[] = [
    { key: "all", label: t("bills.body.tab-1") },           // 全部
    { key: "consumed", label: t("bills.body.tab-2") },      // 消耗 (action: deduct)
    { key: "purchased", label: t("bills.body.tab-3") },     // 购买 (action: purchase)
    { key: "obtained", label: t("bills.body.tab-4") },      // 获得 (action: purchase OR reward)
    // 可选：如果需要显示更多分类，取消下面的注释
    // { key: "refunded", label: t("bills.body.tab-5") },   // 退款 (action: refund)
    // { key: "rewarded", label: t("bills.body.tab-6") },   // 奖励 (action: reward)
  ];

  // 处理选项卡切换（前端过滤）
  const handleTabChange = (key: string) => {
    setActiveTab(key);
    
    if (key === "all") {
      setPointsHistory(originData);
      return;
    }

    // 根据新的数据结构（action + pointsDetail）进行前端过滤
    let filterData: PointsHistoryItem[] = [];

    switch (key) {
      case "consumed":
        // 消耗记录：action 为 'deduct'
        filterData = originData.filter((item) => item.action === "deduct");
        break;
        
      case "refunded":
        // 退款记录：action 为 'refund'
        filterData = originData.filter((item) => item.action === "refund");
        break;
        
      case "purchased":
        // 购买记录：action 为 'purchase'
        filterData = originData.filter((item) => item.action === "purchase");
        break;
        
      case "rewarded":
        // 奖励记录：action 为 'reward'
        filterData = originData.filter((item) => item.action === "reward");
        break;
        
      case "obtained":
        // 获得记录：action 为 'purchase' 或 'reward'
        filterData = originData.filter(
          (item) => item.action === "purchase" || item.action === "reward"
        );
        break;
        
      default:
        filterData = originData;
        break;
    }

    setPointsHistory(filterData);
  };

  const open = async (open: boolean) => {
    if (!open) {
      setActiveTab("all");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/point`);
      const result = await response.json();

      if (result.success) {
        setOriginData(result.data || []);
        setPointsHistory(result.data || []);
      } else {
        console.error('Failed to fetch points history:', result.message);
        setOriginData([]);
        setPointsHistory([]);
      }
    } catch (error) {
      console.error('Error fetching points history:', error);
      setOriginData([]);
      setPointsHistory([]);
    }

    setLoading(false);
  };

  return (
    <Dialog onOpenChange={open}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent
        className="w-[90vw] h-fit max-w-xs xs:max-w-md sm:max-w-lg md:max-w-2xl lg:max-w-3xl xl:max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl bg-[#413856] text-[#F2F2F2] p-4 sm:p-6"
        showCloseButton={false}
      >
        <DialogHeader className="relative">
          <DialogTitle className="text-white text-center text-xl sm:text-2xl lg:text-3xl font-semibold pr-8">
           </DialogTitle>
        </DialogHeader>

        <DialogClose className="absolute top-2 right-2 xl:top-6 xl:right-6 size-8 rounded-full z-3 flex items-center justify-center cursor-pointer bg-[#180f2e]">
          <XIcon className="size-5 text-white" />
        </DialogClose>

        
 

        {!loading ? (
          <PointsHistoryList pointsHistory={pointsHistory} />
        ) : (
          <Loading className="flex-1" />
        )}

        <DialogFooter className="flex gap-2 items-center w-full justify-center flex-col lg:flex-row mt-2">
          <Info className="size-4 sm:size-5 shrink-0" />
          <p className="text-[#CFCFCF] text-center text-xs sm:text-sm leading-relaxed">{t("bills.footer")}</p>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PointsHistoryList({
  pointsHistory,
}: {
  pointsHistory: PointsHistoryItem[];
}) {
  const { t, i18n } = useT("modal");

  if (pointsHistory.length === 0)
    return (
      <div className="flex flex-col gap-6 sm:gap-8 justify-center items-center h-full min-h-[200px] select-none py-8">
        <LogoNoBorderIcon
          width={80}
          height={80}
          className="sm:w-32 sm:h-32 blur-sm shadow-2xl"
        />

        <p className="text-[#CFCFCF] text-lg sm:text-2xl font-bold">No records yet</p>
      </div>
    );

  return (
    <div className="w-full flex-1 overflow-hidden">
      {/* 表头 - 固定不滚动 */}
      <div className="grid grid-cols-4 justify-items-center gap-2 sm:gap-4 pb-3 sm:pb-4">
        <span className="font-semibold text-xs sm:text-sm">{t("bills.body.colb-1")}</span>
        <span className="font-semibold text-xs sm:text-sm">{t("bills.body.colb-2")}</span>
        <span className="font-semibold text-xs sm:text-sm">{t("bills.body.colb-3")}</span>
        <span className="font-semibold text-xs sm:text-sm">{t("bills.body.colb-4")}</span>
      </div>

      {/* 数据内容 - 可滚动区域 */}
      <div
        className="overflow-y-auto max-h-60 sm:max-h-80 pt-3 sm:pt-4 pb-8 sm:pb-12"
        style={{
          overscrollBehavior: "contain",
          WebkitOverflowScrolling: "touch",
        }}
        onWheel={(e) => {
          // 强制处理滚轮事件
          e.currentTarget.scrollTop += e.deltaY;
        }}
      >
        {pointsHistory.map((item) => {
          // 显示操作类型（action）
          const displayType = t(`bills.body.types.${item.action}`);

          return (
            <div
              key={item.id}
              className="grid grid-cols-4 justify-items-center gap-2 sm:gap-4 py-2 sm:py-3 hover:bg-white/5 transition-colors"
            >
              <span className="text-xs sm:text-sm truncate px-1">
                {item.points > 0
                  ? t("bills.body.increase")
                  : t("bills.body.decrease")}
              </span>
              <span className="text-xs sm:text-sm font-medium">{item.points}</span>
              <span className="text-xs sm:text-sm truncate px-1 text-center">
                {displayType || "-"}
              </span>
              <span className="text-xs sm:text-sm text-center">
                {new Date(item.createdAt).toLocaleString(
                  i18n.resolvedLanguage === "zh" ? "zh-CN" : "en-US",
                  {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                    timeZone: "UTC",
                  }
                )}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
