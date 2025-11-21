import { GenerationStatus } from "@/lib/config/enum";

export type BuildTaskRequestOptions = {
  method: string;
  headers: Record<string, string>;
  body?: any;
};

export type RecordProcessingType = {
  urls: string[];
  type: string; // image/video
  status: GenerationStatus;
  error?: string;
} | null;

export type TaskStep = "none" | "createTask" | "pollTaskStatus";
