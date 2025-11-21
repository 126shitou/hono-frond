"use client";

import { useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  RotateCw,
  RefreshCw,
} from "lucide-react";

interface ImagePreviewDialogProps {
  /** 触发器元素 */
  children: React.ReactNode;
  /** 图片源地址 */
  src: string;
  /** 图片标题/alt文本 */
  title: string;
  /** 图片原始宽度 */
  width?: number;
  /** 图片原始高度 */
  height?: number;
}

export function ImagePreviewDialog({
  children,
  src,
  title,
  width = 1024,
  height = 1024,
}: ImagePreviewDialogProps) {
  // 缩放比例状态
  const [scale, setScale] = useState(1);
  // 图片位置状态
  const [position, setPosition] = useState({ x: 0, y: 0 });
  // 旋转角度状态
  const [rotation, setRotation] = useState(0);
  // 是否正在拖拽
  const [isDragging, setIsDragging] = useState(false);
  // 拖拽起始位置
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // 放大图片
  const zoomIn = () => {
    setScale((prev) => Math.min(prev * 1.2, 5)); // 最大放大3倍
  };

  // 缩小图片
  const zoomOut = () => {
    setScale((prev) => Math.max(prev / 1.2, 0.5)); // 最小缩小到0.5倍
  };

  // 顺时针旋转90度
  const rotateClockwise = () => {
    setRotation((prev) => prev + 90);
  };

  // 逆时针旋转90度
  const rotateCounterClockwise = () => {
    setRotation((prev) => prev - 90);
  };

  // 重置缩放、位置和旋转
  const resetZoom = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
    setRotation(0);
  };

  // 处理鼠标按下事件（开始拖拽）
  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale > 1) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      });
    }
  };

  // 处理鼠标移动事件（拖拽中）
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && scale > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  // 处理鼠标松开事件（结束拖拽）
  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // 处理触摸开始事件（移动端）
  const handleTouchStart = (e: React.TouchEvent) => {
    if (scale > 1 && e.touches.length === 1) {
      setIsDragging(true);
      const touch = e.touches[0];
      setDragStart({
        x: touch.clientX - position.x,
        y: touch.clientY - position.y,
      });
    }
  };

  // 处理触摸移动事件（移动端）
  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDragging && scale > 1 && e.touches.length === 1) {
      const touch = e.touches[0];
      setPosition({
        x: touch.clientX - dragStart.x,
        y: touch.clientY - dragStart.y,
      });
    }
  };

  // 处理触摸结束事件（移动端）
  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // 处理滚轮缩放
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      zoomIn();
    } else {
      zoomOut();
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent
        className="max-w-[95vw] max-h-[95vh] w-full h-full p-0 border-0 bg-white shadow-2xl rounded-2xl overflow-hidden"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        {/* 隐藏的DialogTitle，用于满足可访问性要求 */}
        <DialogTitle className="sr-only">{title || ""}</DialogTitle>

        <div className="relative w-full h-full bg-white overflow-hidden">
          {/* 工具栏 */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10 flex items-center gap-0.5 sm:gap-2 bg-white/90 backdrop-blur-sm rounded-lg p-1 sm:p-2 shadow-lg">
            {/* 关闭按钮 - 移动端特别重要 */}
            <DialogClose asChild>
              <button
                className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-md transition-colors cursor-pointer touch-manipulation"
                title="Close"
              >
                <X className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-700" />
              </button>
            </DialogClose>
            
            <div className="w-px h-4 sm:h-6 bg-gray-300 mx-0.5 sm:mx-1 hidden sm:block"></div>
            
            <button
              onClick={zoomOut}
              className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-md transition-colors cursor-pointer touch-manipulation"
              title="Zoom out"
            >
              <ZoomOut className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-700" />
            </button>
            <span className="text-xs sm:text-sm text-gray-600 min-w-10 sm:min-w-12 text-center">
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={zoomIn}
              className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-md transition-colors cursor-pointer touch-manipulation"
              title="Zoom in"
            >
              <ZoomIn className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-700" />
            </button>
            <div className="w-px h-4 sm:h-6 bg-gray-300 mx-0.5 sm:mx-1 hidden sm:block"></div>
            <button
              onClick={rotateCounterClockwise}
              className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-md transition-colors cursor-pointer touch-manipulation"
              title="Rotate left"
            >
              <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-700" />
            </button>
            <button
              onClick={rotateClockwise}
              className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-md transition-colors cursor-pointer touch-manipulation"
              title="Rotate right"
            >
              <RotateCw className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-700" />
            </button>
            <div className="w-px h-4 sm:h-6 bg-gray-300 mx-0.5 sm:mx-1 hidden sm:block"></div>
            <button
              onClick={resetZoom}
              className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-md transition-colors cursor-pointer touch-manipulation"
              title="Reset"
            >
              <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-700" />
            </button>
          </div>

          {/* 图片容器 */}
          <div
            className="w-full h-full flex items-center justify-center cursor-grab active:cursor-grabbing touch-none"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onWheel={handleWheel}
          >
            <div
              style={{
                transform: `translate(${position.x}px, ${position.y}px) scale(${scale}) rotate(${rotation}deg)`,
                transition: isDragging ? "none" : "transform 0.2s ease-out",
              }}
              className="select-none"
            >
              <img
                src={src}
                alt={title}
                width={width}
                height={height}
                className="max-w-[80vw] max-h-[80vh] object-contain rounded-lg shadow-lg"
                draggable={false}
                loading="lazy"
              />
            </div>
          </div>

          {/* 图片信息 */}
          {title && (
            <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
              <p className="text-sm text-gray-700 truncate" title={title}>
                {title}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
