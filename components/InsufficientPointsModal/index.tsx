"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
  DialogFooter,
} from "@/components/ui/dialog";
import { CircleAlert, XIcon, Check } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils";
import Checkbox from "../ui/checkbox";
import { useT } from "@/i18n/client";
import Tabs, { TabItem } from "@/components/ui/tabs";
import getLngCode from "@/lib/utils/getLngCode";
import { SubscriptionPlan, CreditPlan } from "@/lib/config/product";
import { createCheckoutSession } from "@/lib/utils/checkout";
import { toast } from "@/components/ui/sonner";
interface InsufficientPointsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function InsufficientPointsModal({
  open,
  onOpenChange,
}: InsufficientPointsModalProps) {
  const [activeTab, setActiveTab] = useState("subscription");
  const [loading, setLoading] = useState(false);

  // 使用单一状态管理选中的产品 ID
  const [selectedProductId, setSelectedProductId] = useState<string>(
    SubscriptionPlan.find(p => p.billingPeriod === "month" && p.type === "basic")?.productId || ""
  );

  const { t, i18n } = useT("modal");
  const code = i18n.resolvedLanguage || "en";

  // 定义选项卡数据
  const tabItems: TabItem[] = [
    { key: "subscription", label: t("insufficient.tab-1.name") },
    { key: "credits", label: t("insufficient.tab-2.name") },
  ];

  // 切换 tab 时重置为第一个选项
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab === "subscription") {
      const firstSubPlan = SubscriptionPlan.find(p => p.billingPeriod === "month" && p.type === "basic");
      setSelectedProductId(firstSubPlan?.productId || "");
    } else {
      setSelectedProductId(CreditPlan[0].productId);
    }
  };

  // 处理支付跳转
  const handleCheckout = async () => {
    if (loading || !selectedProductId) return;

    setLoading(true);

    try {
      await createCheckoutSession({
        productId: selectedProductId,
        onLoading: () => {
          toast.loading(t("insufficient.checkout.loading") || "Creating payment session...");
        },
        onSuccess: () => {
          toast.dismiss();
          toast.success(t("insufficient.checkout.success") || "Redirecting to payment page...");
        },
        onError: (error) => {
          toast.dismiss();
          toast.error(error.message || t("insufficient.checkout.error") || "Payment failed, please try again");
          console.error("支付错误:", error);
          setLoading(false);
        },
      });
    } catch (err: any) {
      // Error already handled in onError callback
    }
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:w-lg md:w-2xl lg:w-3xl xl:w-5xl rounded-3xl shadow-2xl bg-[#413856] overflow-hidden text-[#F2F2F2] flex-row  h-[640px]"
        showCloseButton={false}
      >
        <div
          className={cn(
            "bg-cover bg-center absolute inset-0 -z-1 hidden lg:block",
            activeTab === "subscription" && "w-1/2"
          )}
          style={{
            backgroundImage: `url(${process.env.NEXT_PUBLIC_CLOUDFLARE_CDN_URL}/static/pointsbg.webp)`,
          }}
        >
          <div className="absolute inset-0 bg-black/40 "></div>
          {activeTab === "credits" && (
            <div className="absolute inset-0 bg-gradient-to-b from-transparent from-10% to-[#413856] to-20% rounded-xl p-6"></div>
          )}
        </div>

        {activeTab === "subscription" && (
          <div className="flex-1 space-y-6 hidden lg:block ">
            <div className="flex items-center gap-2">
              <CircleAlert className="size-4" color="#F2F2F2" />
              <span>{t("insufficient.left.tip")}</span>
            </div>
            <p className="text-2xl font-semibold text-white">
              {t("insufficient.left.title")}
            </p>
            <ul className="space-y-6">
              <li className="flex items-center gap-2">
                <Check className="size-4" color="#F2F2F2" />
                <span>{t("insufficient.left.feature-1")}</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="size-4" color="#F2F2F2" />
                <span>{t("insufficient.left.feature-2", { count: SubscriptionPlan.find(i => i.productId === selectedProductId)?.points })}</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="size-4" color="#F2F2F2" />
                <span>{t("insufficient.left.feature-3")}</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="size-4" color="#F2F2F2" />
                <span>{t("insufficient.left.feature-4")}</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="size-4" color="#F2F2F2" />
                <span>{t("insufficient.left.feature-5")}</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="size-4" color="#F2F2F2" />
                <span>{t("insufficient.left.feature-6")}</span>
              </li>
            </ul>
          </div>
        )}

        <div className="flex-1 ">
          <DialogHeader className="relative ">
            <DialogTitle className="text-white text-center text-2xl lg:text-3xl font-semibold mb-7">
              {activeTab === "subscription"
                ? t("insufficient.tab-1.header")
                : t("insufficient.tab-2.header")}
            </DialogTitle>
            <Tabs
              tabWidth="w-28  lg:w-32 xl:w-40"
              items={tabItems}
              activeKey={activeTab}
              onChange={handleTabChange}
              className="mb-5"
              containerClassName="bg-[#2E2547]"
              backgroundClassName="bg-gradient-to-r from-[#FACF72] to-[#BA52F7]"
              tabClassName="text-white font-semibold text-sm px-2"
            />
          </DialogHeader>

          <DialogClose className="absolute top-2 right-2 xl:top-6 xl:right-6 size-8 rounded-full z-3 flex items-center justify-center cursor-pointer bg-[#180f2e]">
            <XIcon className="size-5 text-white" />
          </DialogClose>

          {activeTab === "subscription" ? (
            <SubscriptionCard
              selectedProductId={selectedProductId}
              setSelectedProductId={setSelectedProductId}
              onOpenChange={onOpenChange}
              code={code!}
              t={t}
            />
          ) : (
            <CreditCard
              selectedProductId={selectedProductId}
              setSelectedProductId={setSelectedProductId}
            />
          )}

          <DialogFooter className="mt-6">
            <div className="w-fit mx-auto">
              <button
                onClick={handleCheckout}
                disabled={loading}
                className="w-full bg-gradient-to-r from-[#FACF72] to-[#9747FF] py-4 px-14 rounded-full cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-lg hover:scale-105 active:scale-95"
              >
                {loading ? "Processing..." : t("insufficient.btn")}
              </button>
            </div>

          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SubscriptionCard({
  selectedProductId,
  setSelectedProductId,
  onOpenChange,
  code,
  t,
}: {
  selectedProductId: string;
  setSelectedProductId: (productId: string) => void;
  onOpenChange: (open: boolean) => void;
  code: string;
  t: (key: string) => string;
}) {
  // 获取基础和高级订阅套餐
  const basicPlan = SubscriptionPlan.find(p => p.billingPeriod === "month" && p.type === "basic");
  const ultimatePlan = SubscriptionPlan.find(p => p.billingPeriod === "month" && p.type === "ultimate");

  // 处理复选框状态变化的函数
  const handlePlanChange = (productId: string) => {
    setSelectedProductId(productId);
  };

  return (
    <div className="w-full px-5 space-y-5 ">
      {basicPlan && (
        <CorlorBorder isActive={selectedProductId === basicPlan.productId}>
          <div
            className="px-6 py-2 bg-[#857BA1] rounded-xl space-y-2"
            onClick={() => handlePlanChange(basicPlan.productId)}
          >
            <div className="text-sm">{t("insufficient.tab-1.pro.title")}</div>
            <div className="flex justify-between items-center pb-2">
              <div className="space-x-2">
                <span className="text-3xl font-semibold">
                  $ {basicPlan.price}
                </span>
                <span>/{t("insufficient.tab-1.pro.per")}</span>
              </div>
              <Checkbox
                inputClassName="size-6"
                id={basicPlan.productId}
                readOnly
                checked={selectedProductId === basicPlan.productId}
              />
            </div>
          </div>
        </CorlorBorder>
      )}

      {ultimatePlan && (
        <CorlorBorder isActive={selectedProductId === ultimatePlan.productId}>
          <div
            className="px-6 py-2 bg-[#857BA1] rounded-xl relative overflow-hidden space-y-2"
            onClick={() => handlePlanChange(ultimatePlan.productId)}
          >
            <div className="text-sm">
              {t("insufficient.tab-1.ultimate.title")}
            </div>
            <div className="flex justify-between items-center pb-2">
              <div className="space-x-2">
                <span className="text-3xl font-semibold">
                  $ {ultimatePlan.price}
                </span>
                <span>/{t("insufficient.tab-1.ultimate.per")}</span>
                {ultimatePlan.before && (
                  <span className="line-through text-sm text-[#CFCFCF]/70">
                    $ {ultimatePlan.before}
                  </span>
                )}
              </div>
              <Checkbox
                inputClassName="size-6"
                id={ultimatePlan.productId}
                checked={selectedProductId === ultimatePlan.productId}
                readOnly
              />
            </div>
          </div>
        </CorlorBorder>
      )}

      <Link
        href={getLngCode(code!, "/pricing")}
        className="mx-auto flex items-center justify-center gap-2 text-sm group cursor-pointer"
        onClick={() => onOpenChange(false)}
      >
        {t("insufficient.tab-1.tip")}
        <span className="group-hover:ml-2 transform transition-all duration-300 text-lg">
          {">"}
        </span>
      </Link>
    </div>
  );
}

function CreditCard({
  selectedProductId,
  setSelectedProductId,
}: {
  selectedProductId: string;
  setSelectedProductId: (productId: string) => void;
}) {
  // 处理复选框状态变化的函数
  const handleCreditPlanChange = (productId: string) => {
    setSelectedProductId(productId);
  };

  return (
    <div className="flex flex-col gap-2 pb-2">
      {CreditPlan.map((plan) => (
        <CorlorBorder isActive={selectedProductId === plan.productId} key={plan.productId}>
          <div
            className="px-2 py-2 md:px-7 md:py-4 bg-[#857BA1] rounded-xl grid grid-cols-4 justify-items-center items-center"
            onClick={() => handleCreditPlanChange(plan.productId)}
          >
            <span className="flex items-center gap-2">
              <span className="text-xl lg:text-2xl font-semibold">{plan.points}</span>
            </span>
            <span className="text-base font-medium">$ {plan.price}</span>
            <span className="text-base font-medium">$ {(plan.price / plan.points)} / Credit</span>
            <Checkbox
              inputClassName="size-6"
              id={plan.productId}
              checked={selectedProductId === plan.productId}
              readOnly
            />
          </div>
        </CorlorBorder>
      ))}
    </div>
  );
}

function CorlorBorder({
  isActive,
  children,
}: {
  isActive?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "block mx-auto w-full py-px rounded-xl font-medium relative p-0.5 cursor-pointer",
        isActive && "bg-gradient-to-r from-[#FACF72] to-[#9747FF] "
      )}
    >
      {children}
    </div>
  );
}
