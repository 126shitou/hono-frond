"use client";
import { useT } from "@/i18n/client";
import { cn } from "@/lib/utils"

export default function Prompt({
  prompt,
  onChange,
  error,
  className = "",
  textareaClassName = "",
  maxLength = 1000,
  placeholder
}: {
  prompt: string;
  onChange: (prompt: string) => void;
  error?: string;
  className?: string;
  textareaClassName?: string;
  maxLength?: number;
  placeholder?: string;
}) {
  // 状态管理
  const maxLen = maxLength || 1000;
  // 处理输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length <= maxLen) {
      onChange(value);
    }
  };

  return (
    <>
      <div className={cn(`relative bg-transparent border-2 border-dashed  border-bd-primary rounded-lg py-3 px-2`, className)}>
        {/* 文本输入区域 */}
        <textarea
          value={prompt}
          onChange={handleInputChange}
          placeholder={placeholder}
          className={cn("w-full h-22  text-txt-primary placeholder:text-sm placeholder-txt-tertiary  resize-none focus:outline-none transition-colors", textareaClassName)}
        />

        <div className="text-right  text-base font-medium h-6 text-txt-tertiary absolute bottom-1 right-2">
          {prompt.length}/{maxLen}
        </div>
        {/* 错误提示 */}
      </div>
      {error && <div className="text-red-500 text-sm mt-1">{error}</div>}
    </>
  );
}
