"use client";

import { ReactNode, HTMLAttributes, ElementType } from "react";

interface GTMWrapperProps extends Omit<HTMLAttributes<HTMLElement>, 'onClick'> {
    children: ReactNode;
    as?: ElementType;
    GTMName: string;
    GTMParams?: Record<string, string>;
}

/**
 * 高阶点击事件处理组件
 * @param children - 子元素内容
 * @param as - 渲染的HTML元素类型，默认为div
 * @param GTMName - GTM 事件名称
 * @param GTMParams - GTM 事件参数
 * @param ...props - 其他HTML属性
 */
export default function GTMWrapper({
    children,
    as: Component = "div",
    GTMName,
    GTMParams,
}: GTMWrapperProps) {
    const handleClick = () => {
        if (typeof window !== 'undefined' && window.dataLayer) {
            window.dataLayer.push({
                event: GTMName,
                ...GTMParams,
            });
        }
    };

    return (
        <Component
            onClick={handleClick}
        >
            {children}
        </Component>
    );
}