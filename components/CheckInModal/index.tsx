"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useState } from "react";

import { XIcon } from "lucide-react";
 

import { CheckinRecord } from "@/lib/db/schema/user";
import { useUserInfo } from "@/lib/contexts/user-context";
import { useT } from "@/i18n/client";
import { toast } from "@/components/ui/sonner";
// Removed server action imports - now using API calls
import PointsIcon from "@/components/icon/points";
import { sendGTMEvent } from "@/lib/gtm";



export default function CheckInModal({
  children,
}: {
  children: React.ReactNode;
}) {
  const [hasCheckedToday, setHasCheckedToday] = useState(false);
  const [loading, setLoading] = useState(false);
  const [weeklyCheckins, setWeeklyCheckins] = useState<
    (CheckinRecord | null)[]
  >(new Array(7).fill(null));
  const { t } = useT("modal");

  const { user, isLogin, refreshUserInfo } = useUserInfo();

  const open = async (open: boolean) => {

    if (open) sendGTMEvent({
      event: "FreeCredit-Click",
    });


    if (!open || !isLogin) return;
    // TODO 将签到状态存在本地 避免每次都发送请求
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/checkin/history`);
      const res = await response.json();

      if (res.success && res.data) {
        const { weeklyData, canCheckinToday } = res.data;
        setWeeklyCheckins(weeklyData);
        setHasCheckedToday(!canCheckinToday);
      } else {
        toast.fail(res.message || "Fail: Failed to retrieve check-in history");
      }
    } catch (error) {
      toast.error("Error: Failed to retrieve check-in history");
    }

  };

  const checkIn = async () => {
    if (hasCheckedToday || loading) return;

    setLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/checkin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const result = await response.json();

      if (result.success && result.data) {
        setHasCheckedToday(true);

        // 重新获取签到状态
        const historyResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/checkin/history`);
        const historyResult = await historyResponse.json();
        if (historyResult.success && historyResult.data) {
          const { weeklyData, canCheckinToday } = historyResult.data;
          setWeeklyCheckins(weeklyData);
          setHasCheckedToday(!canCheckinToday);
          // 刷新用户信息
        }
        await refreshUserInfo();
        toast.success(
          `Check-in successful! Earned ${result.data.rewardPoints} points`
        );
      } else {
        toast.fail(result.message || "Check-in failed");
      }
    } catch (error) {
      toast.error("Check-in failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog onOpenChange={open}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent
        className="w-xs xs:w-md sm:w-lg md:w-2xl lg:w-4xl xl:w-6xl 2xl:w-7xl rounded-3xl shadow-2xl bg-[#2b2243] overflow-hidden max-h-[90%] h-fit"
        showCloseButton={false}
      >
        <DialogHeader className="relative" >
           
        </DialogHeader>
        <DialogClose className="absolute top-2 right-2 size-8 rounded-full shadow-[0px_0px_8px_0px_rgba(167,110,255,1.00)] z-3 flex items-center justify-center cursor-pointer bg-[#180f2e]">
         </DialogClose>
 
      </DialogContent>
    </Dialog>
  );
}
