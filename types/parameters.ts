// 参数值
export interface ParameterValues {
  [parameterId: string]: any;
}

// aspect ratio 选项
export interface AspectRatioOption {
  value: string;
  label: string;
}

export interface ToggleGroupOption {
  value: string | number;
  label: string;
}

export interface BaseParameter {
  id: string;
  name: string;
  type: ParameterType;
  required?: boolean;
  defaultValue?: any;
}

export interface ImageParameter extends BaseParameter {
  type: "image";
  maxSize?: number; // MB
  acceptedTypes?: string[];
}

export interface PromptParameter extends BaseParameter {
  type: "prompt";
  maxLength?: number;
  minLength?: number;
  placeholder?: string;
}

export interface RatioParameter extends BaseParameter {
  type: "ratio";
  options: AspectRatioOption[];
}
export interface SliderParameter extends BaseParameter {
  type: "slider";
  min?: number;
  max?: number;
  step?: number;
}

export interface ToggleGroupParameter extends BaseParameter {
  type: "toggleGroup";
  options: ToggleGroupOption[];
}

export interface DoubleImageParameter extends BaseParameter {
  type: "doubleImage";
  maxSize?: number; // MB
  acceptedTypes?: string[];
}

export type Parameter =
  | ImageParameter
  | PromptParameter
  | SliderParameter
  | RatioParameter
  | ToggleGroupParameter
  | DoubleImageParameter;

// 参数类型枚举
export type ParameterType =
  | "image"
  | "prompt"
  | "ratio"
  | "slider"
  | "toggleGroup"
  | "doubleImage";
