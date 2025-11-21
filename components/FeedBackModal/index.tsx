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
import { XIcon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useT } from "@/i18n/client";
import { FEED_BACK_TYPE } from "@/lib/config/constant"
// CheckInModal组件的属性接口
import ImageUpload from "@/components/Panel/imageUpload"
import { useState } from "react";
import { toast } from "@/components/ui/sonner";
import { sendGTMEvent } from "@/lib/gtm";

export default function FeedbackModal({
  children,
}: {
  children: React.ReactNode;
}) {
  const { t } = useT("modal");
  const [images, setImages] = useState<any[]>([]);
  // 处理图片变化的回调函数
  const handleImagesChange = (newImages: any[]) => {
    setImages(newImages);
  };

  const [feedbackType, setFeedbackType] = useState<string>("");
  const [feedbackDetails, setFeedbackDetails] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errors, setErrors] = useState<{
    feedbackType?: string;
    feedbackDetails?: string;
  }>({});

  const validateForm = () => {
    const newErrors: { feedbackType?: string; feedbackDetails?: string } = {};

    if (!feedbackType) {
      newErrors.feedbackType = t("feedback.error.type-required");

    }

    if (!feedbackDetails.trim()) {
      newErrors.feedbackDetails = t("feedback.error.details-required");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // 创建FormData对象
      const formData = new FormData();
      formData.append('type', feedbackType);
      formData.append('details', feedbackDetails);

      // 添加所有图片到FormData
      if (images.length > 0) {
        images.forEach((image) => {
          if (image instanceof File) {
            formData.append('images', image);
          } else if (image.file instanceof File) {
            formData.append('images', image.file);
          }
        });
      }

      // 调用API
      const response = await fetch('/api/feedback', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast.success(result.data.message || 'Feedback submitted successfully!');

        // 重置表单
        setFeedbackType('');
        setFeedbackDetails('');
        setImages([]);
        setErrors({});

        // 关闭对话框（通过触发DialogClose）
        const closeButton = document.querySelector('[data-dialog-close]') as HTMLButtonElement;
        if (closeButton) {
          closeButton.click();
        }
      } else {
        toast.error(result.message || 'Submission failed, please try again later');
      }
    } catch (error) {
      console.error('Error occurred while submitting feedback:', error);
      toast.error('Network error, please check your connection and try again');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTypeChange = (value: string) => {
    setFeedbackType(value);
    if (errors.feedbackType) {
      setErrors(prev => ({ ...prev, feedbackType: undefined }));
    }
  };

  const handleDetailsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFeedbackDetails(e.target.value);
    if (errors.feedbackDetails) {
      setErrors(prev => ({ ...prev, feedbackDetails: undefined }));
    }
  };

  const handleOpenChange = () => {
    sendGTMEvent({
      event: "FeedBack-Click",
    });
  }

  return (
    <Dialog>
      <DialogTrigger onClick={handleOpenChange} asChild>{children}</DialogTrigger>
      <DialogContent
        className="w-xs xs:w-md sm:w-lg md:w-2xl lg:w-3xl max-h-[90vh] rounded-3xl shadow-2xl bg-card-secondary-bg text-txt-primary flex flex-col border border-bd-secondary"
        showCloseButton={false}
      >
        <DialogHeader className="relative shrink-0">
          <DialogTitle className="text-txt-primary text-center  text-2xl lg:text-3xl font-semibold">
            {t("feedback.header")}
          </DialogTitle>
        </DialogHeader>

        <DialogClose className="absolute top-2 right-2 xl:top-6 xl:right-6 size-8 rounded-full z-3 flex items-center justify-center cursor-pointer text-txt-primary hover:text-primary">
          <XIcon className="size-5 " />
        </DialogClose>

        <form id="feedback-form" onSubmit={handleSubmit} className="w-full space-y-6 font-medium overflow-y-auto flex-1 px-1">
          <div>
            <div className="text-lg mb-1 ">{t("feedback.body.type")}</div>
            <Select value={feedbackType} onValueChange={handleTypeChange} name="feedbackType">
              <SelectTrigger className={`w-full py-4 h-10 sm:h-14 ${errors.feedbackType ? 'border-red-500' : ''}`}>
                <SelectValue placeholder={t("feedback.body.desc")} />
              </SelectTrigger>
              <SelectContent>
                {FEED_BACK_TYPE.map((item, index) => (
                  <SelectItem
                    key={item}
                    value={item}
                    className="h-12"
                  >
                    {t(`feedback.body.type-${index + 1}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.feedbackType && (
              <div className="text-red-400 text-sm mt-2 px-1">
                {errors.feedbackType}
              </div>
            )}
          </div>

          <div>
            <div className="text-lg mb-1">{t("feedback.body.details")}</div>
            <div className={`bg-input-bg rounded-2xl w-full h-fit px-2 pb-2 border border-bd-primary ${errors.feedbackDetails ? 'ring-1 ring-red-500' : ''}`}>
              <textarea
                name="feedbackDetails"
                id="feedbackDetails"
                value={feedbackDetails}
                onChange={handleDetailsChange}
                className="w-full h-full p-4 text-txt-primary bg-transparent text-sm outline-none resize-none"
                rows={3}
                maxLength={1500}
                placeholder="Describe your problem......"
              ></textarea>
              <div className=" w-full text-txt-tertiary text-right text-xs sm:text-sm ">{feedbackDetails.length}/1500</div>
            </div>
            {errors.feedbackDetails && (
              <div className="text-red-400 text-sm mt-2 px-1">
                {errors.feedbackDetails}
              </div>
            )}
          </div>

          <div className="text-lg mb-1">{t("feedback.body.screen")}</div>
          <div className="bg-background-secondary rounded-2xl w-full p-2">
            <ImageUpload images={images} maxImages={8}
              onImagesChange={handleImagesChange}
              supportTxt={t("feedback.upload.support")}
            />
          </div>
        </form>

        <DialogFooter className="flex items-center justify-end gap-4 mt-4 sm:mt-6 text-txt-primary shrink-0  pt-4">
          <DialogClose asChild>
            <button
              type="button"
              className="cursor-pointer rounded-xl px-6 py-2 border border-bd-primary hover:bg-btn-secondary-bg-hover"
              data-dialog-close
              disabled={isSubmitting}
            >
              {t("feedback.cancel")}
            </button>
          </DialogClose>
          <button
            type="submit"
            form="feedback-form"
            className="bg-btn-primary-bg text-txt-inverse rounded-xl px-6 py-2 cursor-pointer hover:bg-btn-primary-bg-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSubmitting}
          >
            {isSubmitting ? '提交中...' : t("feedback.submit")}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog >
  );
}
