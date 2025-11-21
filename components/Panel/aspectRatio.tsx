"use client";

import { AspectRatioOption } from "@/types/parameters";
import { cn } from "@/lib/utils";

interface AspectRadioProps {
  value?: string;
  onChange?: (aspectRatio: string) => void;
  options?: AspectRatioOption[]; // 可选的自定义选项列表
}

export default function AspectRadio({
  value = "1:1",
  onChange,
  options = [
    { value: "1:1", label: "1:1" },
    { value: "2:3", label: "2:3" },
    { value: "3:2", label: "3:2" },
    { value: "3:4", label: "3:4" },
    { value: "4:3", label: "4:3" },
    { value: "16:9", label: "16:9" },
    { value: "9:16", label: "9:16" },
  ], // 默认为空数组
}: AspectRadioProps) {
  const handleSelect = (ratioValue: string) => {
    onChange?.(ratioValue);
  };

  const getRectangleStyle = (option: string) => {
    const [width, height] = option.split(":").map(Number);
    const style = {
      aspectRatio: `${width}/${height}`,
    };

    return style;
  };

  // 如果没有选项，返回空组件
  if (!options || options.length === 0) {
    return null;
  }

  return (
    <div className="w-full gap-2 grid grid-cols-3 sm:grid-cols-5 md:grid-cols-7">
      {options.map((option) => {
        const isActive = option.value === value;
        return (
          <div
            key={option.value}
            onClick={() => handleSelect(option.value)}
            className={cn(
              "border border-[#857BA1] rounded-md flex flex-col gap-2 p-2 cursor-pointer hover:bg-white/20 group transition-colors duration-200 min-w-0",
              isActive && "bg-white/20 border-white "
            )}
          >
            <div className="font-semibold h-8 flex items-center justify-center overflow-hidden">
              <div className="rounded-sm bg-[#857BA1] h-full"
                style={getRectangleStyle(option.value)}
              ></div>
            </div>
            <div className="text-xs text-center truncate">{option.label}</div>
          </div>
        );
      })}
    </div>
  );
}
