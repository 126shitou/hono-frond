"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { XIcon, Copy } from "lucide-react";
 import Checkbox from "../ui/checkbox";
import { User } from "@/lib/db/schema";
import { copyToClipboard } from "@/lib/utils/common";
import { useT } from "@/i18n/client";

export default function AccountModal({
  children,
  user,
}: {
  children: React.ReactNode;
  user: User;
}) {
  const { t } = useT("modal");

  const copy = async (txt: string) => {
    await copyToClipboard(txt);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent
        className="w-[90vw] max-w-xs xs:max-w-md sm:max-w-lg md:max-w-2xl lg:max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl bg-[#413856] text-[#F2F2F2] p-4 sm:p-6 h-fit"
        showCloseButton={false}
      >
        <DialogHeader className="relative">
          <DialogTitle className="text-white text-center text-xl sm:text-2xl lg:text-3xl font-semibold pr-8">
            {t("account.header")}
          </DialogTitle>
        </DialogHeader>

        <DialogClose className="absolute top-2 right-2 xl:top-6 xl:right-6 size-8 rounded-full z-3 flex items-center justify-center cursor-pointer bg-[#180f2e]">
          <XIcon className="size-5 text-white" />
        </DialogClose>
 

        <DialogFooter className="flex flex-col mt-4 sm:mt-8 pb-2">
          
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
