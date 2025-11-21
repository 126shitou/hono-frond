"use client";

import React from "react";
import { cn } from "@/lib/utils/cn";

/**
 * Checkbox组件的属性接口
 */
interface CheckboxProps {
  /** 复选框的唯一标识符 */
  id?: string;
  /** 复选框的名称属性 */
  name?: string;
  /** 复选框的标签文本 */
  label?: string;
  /** 复选框是否被选中 */
  checked?: boolean;
  /** 复选框是否为默认选中状态 */
  defaultChecked?: boolean;
  /** 复选框是否禁用 */
  disabled?: boolean;
  /** 复选框是否为必填项 */
  required?: boolean;
  /** 复选框的值 */
  value?: string;
  /** 复选框状态改变时的回调函数 */
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  /** 复选框点击时的回调函数 */
  onClick?: (event: React.MouseEvent<HTMLInputElement>) => void;
  /** 复选框获得焦点时的回调函数 */
  onFocus?: (event: React.FocusEvent<HTMLInputElement>) => void;
  /** 复选框失去焦点时的回调函数 */
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
  /** 容器的自定义样式类名 */
  className?: string;
  /** 复选框输入框的自定义样式类名 */
  inputClassName?: string;
  /** 标签的自定义样式类名 */
  labelClassName?: string;
  /** 其他HTML属性 */
  [key: string]: any;
}

/**
 * 可复用的Checkbox组件
 *
 * @param props - Checkbox组件的属性
 * @returns React组件
 */
const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      id,
      name,
      label,
      checked,
      defaultChecked,
      disabled = false,
      required = false,
      value,
      onChange,
      onClick,
      onFocus,
      onBlur,
      className,
      inputClassName,
      labelClassName,
      ...props
    },
    ref
  ) => {
    // 生成唯一ID（如果未提供）
    const checkboxId =
      id || `checkbox-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <div className={cn("flex items-center", className)}>
        <input
          ref={ref}
          type="checkbox"
          id={checkboxId}
          name={name}
          value={value}
          checked={checked}
          defaultChecked={defaultChecked}
          disabled={disabled}
          required={required}
          onChange={onChange}
          onClick={onClick}
          onFocus={onFocus}
          onBlur={onBlur}
          className={cn(
            // 基础样式 - 添加相对定位和勾选图标
            "appearance-none size-4 rounded border-2 bg-transparent border-[#CFCFCF] transition-colors checked:bg-[#9747FF] checked:border-[#9747FF] relative checked:border-none cursor-pointer",
            // 勾选图标样式
            "checked:after:content-['✓'] checked:after:absolute checked:after:top-0 checked:after:left-0 checked:after:w-full checked:after:h-full checked:after:flex checked:after:items-center checked:after:justify-center checked:after:text-white checked:after:text-sm checked:after:font-bold ",
            // 禁用状态样式
            disabled && "opacity-50 cursor-not-allowed",
            // 自定义样式
            inputClassName
          )}
          aria-describedby={label ? `${checkboxId}-label` : ""}
          {...props}
        />
        {label && (
          <label
            htmlFor={checkboxId}
            id={`${checkboxId}-label`}
            className={cn(
              // 基础样式
              "ml-2 cursor-pointer select-none",
              // 禁用状态样式
              disabled && "opacity-50 cursor-not-allowed",
              // 自定义样式
              labelClassName
            )}
          >
            {label}
          </label>
        )}
      </div>
    );
  }
);

// 设置组件显示名称，便于调试
Checkbox.displayName = "Checkbox";

export default Checkbox;
