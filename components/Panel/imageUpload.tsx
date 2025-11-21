"use client";

import { ImageUp, X } from "lucide-react";
import { useState, useRef, useCallback } from "react";
import { cn } from "@/lib/utils/cn";

// 定义图片文件类型
interface ImageFile {
  id: string;
  file: File;
  preview: string;
}

// 组件属性接口
interface ImageUploadProps {
  className?: string;
  images: ImageFile[];
  onImagesChange: (images: ImageFile[]) => void;
  maxImages?: number;
  error?: string;
  supportTxt: string;
}

// TODO 布局调整
export default function ImageUpload({
  className,
  images,
  onImagesChange,
  maxImages = 4,
  error,
  supportTxt,
}: ImageUploadProps) {
  // 状态管理 - 只使用外部状态
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 最大上传数量
  const MAX_IMAGES = maxImages;

  // 支持的文件格式
  const SUPPORTED_FORMATS = ["image/png", "image/jpeg", "image/webp"];

  // 处理文件选择
  const handleFileSelect = useCallback(
    (files: FileList | null) => {
      if (!files) return;

      const fileArray = Array.from(files);
      const validFiles = fileArray.filter((file) =>
        SUPPORTED_FORMATS.includes(file.type)
      );

      // 检查数量限制
      const remainingSlots = MAX_IMAGES - images.length;
      const filesToAdd = validFiles.slice(0, remainingSlots);

      // 创建预览URL并添加到状态
      const newImages: ImageFile[] = filesToAdd.map((file) => ({
        id: Math.random().toString(36).substr(2, 9),
        file,
        preview: URL.createObjectURL(file),
      }));

      onImagesChange([...images, ...newImages]);
    },
    [images.length, onImagesChange]
  );

  // 处理文件输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files);
    // 清空input值，允许重复选择同一文件
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // 处理拖拽事件
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  // 删除图片
  const removeImage = (id: string) => {
    const imageToRemove = images.find((img) => img.id === id);
    if (imageToRemove) {
      // 释放预览URL内存
      URL.revokeObjectURL(imageToRemove.preview);
    }
    const newImages = images.filter((img) => img.id !== id);
    onImagesChange(newImages);
  };

  // 点击上传区域
  const handleUploadClick = () => {
    if (images.length < MAX_IMAGES) {
      fileInputRef.current?.click();
    }
  };

  return (
    <>

      <div className={cn("w-full flex flex-col", images.length === 0 ? "h-full" : "h-auto", className)}>
        {/* 隐藏的文件输入 */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/png,image/jpeg,image/webp"
          onChange={handleInputChange}
          className="hidden"
        />

        {/* 图片预览网格和上传区域 */}
        {images.length === 0 ? (
          /* 没有图片时显示完整上传区域 */
          <div
            className={cn(
              "w-full h-full bg-transparent border-2 border-dashed border-bd-primary rounded-xl p-4 cursor-pointer transition-colors  ",
              isDragOver && " "
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleUploadClick}
          >
            <div className="h-full text-center space-y-2 sm:space-y-4 flex flex-col justify-center items-center text-txt-secondary">
              <div className="text-xs px-2">
                {supportTxt}
              </div>
            </div>

          </div>
        ) : (
          /* 有图片时显示网格布局，包含图片和上传区域 */
          <div className={cn(
            "grid gap-2 sm:gap-4 w-full h-full items-center",
            // 移动端：根据 maxImages 决定列数，避免单图片时也显示2列
            maxImages === 1 ? "grid-cols-1" :
              maxImages === 2 ? "grid-cols-2" :
                maxImages === 3 ? "grid-cols-2 sm:grid-cols-3" :
                  "grid-cols-2 sm:grid-cols-4"
          )}>
            {/* 现有图片 */}
            {images.map((image) => (
              <div
                key={image.id}
                className={cn(
                  "relative transition-colors h-fit",
                  maxImages === 1
                    ? "w-full max-w-[200px] sm:max-w-[280px] xl:max-w-xl mx-auto"
                    : "aspect-square"
                )}
              >
                <div className={cn(
                  "rounded-lg overflow-hidden",
                  maxImages === 1
                    ? "w-full aspect-square"
                    : "size-full"
                )}>
                  {/* 预览图片 */}
                  <img
                    src={image.preview}
                    alt={image.file.name}
                    className="w-full h-full object-contain"
                  />
                </div>

                <button
                  onClick={() => removeImage(image.id)}
                  className="absolute z-10 -top-1 -right-1 bg-red-600  hover:bg-red-500 text-white rounded-full p-1 cursor-pointer"
                  title="del Image"
                >
                  <X className="size-3" />
                </button>
              </div>
            ))}

            {/* 添加更多图片的上传区域 */}
            {images.length < MAX_IMAGES && (
              <div
                className={cn(
                  "aspect-square bg-transparent border-2 border-dashed rounded-lg cursor-pointer transition-colors border-bd-primary  flex flex-col justify-center items-center p-2",
                  isDragOver && " "
                )}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={handleUploadClick}
              >
                <UploadSvgIcon width={45} height={45} className="mx-auto" />
                <div className="text-xs font-medium text-center">
                  {supportTxt}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      {error && (
        <div className="text-red-500 text-sm font-medium pt-1">
          {error}
        </div>
      )}
    </>
  );
}
