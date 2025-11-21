"use client";
import { useState } from "react";
import Autoplay from "embla-carousel-autoplay";

import ImageUpload from "@/components/Panel/imageUpload";
import Prompt from "@/components/Panel/prompt";


import { sendGTMEvent } from "@/lib/gtm";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselIndicators,
} from "@/components/ui/carousel";
import { toast } from "@/components/ui/sonner";

import { useUserInfo } from "@/lib/contexts/user-context";
import { useLogin } from "@/lib/contexts/login-dialog-context";
import { useGenerate } from "@/hooks/useGenerate";
import { cn } from "@/lib/utils";
import { TaskStep } from "@/types/generation";
import { ImagePreviewDialog } from "../ui/image-preview-dialog";
import { Download, Eye } from "lucide-react";
import { useT } from "@/i18n/client";
import { downloadImage } from "@/lib/utils/common";
import { GenerationStatus } from "@/lib/config/enum";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";


export default function Generate() {
  const { t } = useT("home");

  const modelList = [
    {
      label: "Nano Banana",
      value: "nano",
      desc: "Fast and precise image editing",
      count: ["1", "2", "3"],
      aspectRatio: ["1:1", "2:3", "3:2", "3:4", "4:3", "9:16", "16:9"]
    },
    {
      label: "Anthropic Claude",
      value: "claude",
      desc: "Fast and precise image editing",
      count: ["1"],
      aspectRatio: ["1:1", "2:3", "3:2"]
    },
  ]

  const [generatedImage, setGeneratedImage] = useState<string | null>("");
  const [prompt, setPrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState(modelList[0].aspectRatio[0]);
  const [images, setImages] = useState<any[]>([]);
  const [model, setModel] = useState(modelList[0].value);
  const [count, setCount] = useState("1");

  const [error, setError] = useState<{ prompt?: string; images?: string }>({});

  const { taskStep, handleGenerate, pollTaskStatus } = useGenerate();
  const { showLogin } = useLogin();
  const { isLogin, user, showInsufficientPointsModal } = useUserInfo();
  const [hover, setHover] = useState(false);



  // 处理图片变化的回调函数
  const handleImagesChange = (newImages: any[]) => {
    setImages(newImages);
  };

  const valid = () => {
    if (!prompt) {
      setError({ prompt: "Prompt is required" });
      return false;
    }

    return true;
  };

  const onGenerate = async () => {
    if (taskStep !== "none") return;
    sendGTMEvent({
      event: "Generate-Intention",
    });

    // 判断是否登录
    if (!isLogin) {
      showLogin();
      return;
    }
    // 进行校验
    setError({});

    if (!valid()) return;

    if (user && user?.totalPoints < 2) {
      // 打开充值弹窗
      showInsufficientPointsModal();
      return;
    }

    // 进行生成
    try {
      // 重置之前的结果
      setGeneratedImage(null);

      // 调用生成API
      const recordId = await handleGenerate("ai-image-generator", {
        prompt: prompt.trim(),
        images: images,
        aspectRatio: aspectRatio,
      });

      if (recordId) {
        // 开始轮询任务状态
        const result = await pollTaskStatus(recordId);
        console.log("result", result);

        if (result && result.status === GenerationStatus.SUCCEED && result.urls.length > 0) {
          setGeneratedImage(result.urls[0]);
          toast.success("Image generation successful!");
        } else {
          throw new Error("Generation failed");
        }
      }
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Generation failed. Please try again."
      );
    }
  };

  const download = async () => {
    if (!generatedImage) return;
    // 生成合适的文件名
    let filename = "generated_image"; // 默认使用ID

    if (prompt) {
      // 截取prompt前30个字符，移除特殊字符，确保文件名合法
      const cleanPrompt = prompt
        .slice(0, 30) // 截取前30个字符
        .replace(/[<>:"/\\|?*]/g, '') // 移除Windows文件名不允许的字符
        .replace(/\s+/g, '_') // 将空格替换为下划线
        .trim();

      filename = cleanPrompt ?? filename; // 如果清理后为空，使用默认文件名
    }
    // 添加时间戳避免重名
    const timestamp = new Date().getTime();
    const finalFilename = `${filename}_${timestamp}`;

    await downloadImage(generatedImage, { filename: finalFilename });
  };

  const updateModel = (v: string) => {
    const amodel = modelList.find(i => i.value == v) || modelList[0]
    setAspectRatio(amodel.aspectRatio[0])
    setCount(amodel.count[0])
    setModel(v);

  }

  // 根据taskStep状态渲染右侧内容
  const renderRightContent = (taskStep: TaskStep) => {
    switch (taskStep) {
      case "createTask":
      case "pollTaskStatus":
        return (
          <div className="flex items-center justify-center size-full rounded-2xl p-5 bg-primary aspect-square">
            <div className="bg-tertiary size-full flex items-center justify-center flex-col gap-2 rounded-xl">
              <p className="text-white text-lg">
                {taskStep === "createTask" ? t("generate.t-create") : t("generate.t-poll")}
              </p>
            </div>
          </div>
        );

      case "none":
      default:
        // 如果有生成的图片，显示生成的图片
        if (generatedImage) {

          return (
            <div className="flex items-center justify-center size-full rounded-2xl p-5 bg-[#413856]">
              <div className="bg-[#857BA1] rounded-2xl overflow-hidden w-full h-full max-w-full max-h-full aspect-square flex items-center justify-center relative group">
                <img
                  src={generatedImage}
                  alt="Generated Image"
                  className="max-w-full max-h-full w-full h-full object-contain"
                  width={400}
                  height={400}
                />
                <div className={`absolute inset-0  flex items-end justify-center opacity-0 bg-gradient-to-b from-transparent from-80% to-black/50 gap-4 ${hover && "opacity-100"}`} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
                  <ImagePreviewDialog
                    src={generatedImage}
                    title="Generated Image"
                  >
                    <button className="w-7 h-7 sm:w-8 sm:h-8   flex items-center justify-center cursor-pointer" >
                      <Eye className="size-3 sm:size-4" color="#fff" />
                    </button>
                  </ImagePreviewDialog>
                  <button className="w-7 h-7 sm:w-8 sm:h-8   flex items-center justify-center cursor-pointer" onClick={download}>
                    <Download className="size-3 sm:size-4" color="#fff" />
                  </button>
                </div>
              </div>
            </div>
          );
        }

        // 默认显示示例轮播图
        return (
          <div className="w-full">
            <Carousel
              className="w-full rounded-[20px] overflow-hidden"
              plugins={[
                Autoplay({
                  delay: 3000, // 3秒自动切换
                  stopOnInteraction: true, // 用户交互时停止自动播放
                })
              ]}
            >
              <CarouselContent>
                <CarouselItem>
                  <div className="aspect-square w-full bg-gray-200 rounded-xl overflow-hidden  ">
                    <img
                      src={`${process.env.NEXT_PUBLIC_CLOUDFLARE_CDN_URL}/static/example/image-tools/ai-image-generator.webp`}
                      alt="ai image generator  AI tool"
                      className="w-full h-full object-cover"
                      width={100}
                      height={100}
                    />
                  </div>
                </CarouselItem>
                <CarouselItem>
                  <div className="aspect-square w-full bg-gray-200 rounded-lg overflow-hidden">
                    <img
                      src={`${process.env.NEXT_PUBLIC_CLOUDFLARE_CDN_URL}/static/example/image-tools/ai-photo-generator.webp`}
                      alt="AI Photo Generator  AI tool"
                      className="w-full h-full object-cover"
                      width={100}
                      height={100}
                    />
                  </div>
                </CarouselItem>
                <CarouselItem>
                  <div className="aspect-square w-full bg-gray-200 rounded-lg overflow-hidden">
                    <img
                      src={`${process.env.NEXT_PUBLIC_CLOUDFLARE_CDN_URL}/static/example/image-tools/ai-picture-generator.webp`}
                      alt="AI picture generator AI tool"
                      className="w-full h-full object-cover"
                      width={100}
                      height={100}
                    />
                  </div>
                </CarouselItem>
              </CarouselContent>
              <CarouselIndicators count={3} />
            </Carousel>
          </div>
        );
    }
  };

  return (
    <div className="space-y-8  gap-x-5 max-w-[1440px] mx-auto grid grid-cols-1 lg:grid-cols-2 md:px-10 lg:px-0">
      <form aria-labelledby="form-title" className="h-full ">
        <h2 id="form-title" className="sr-only">AI Image Editor Form</h2>
        <div className="h-full flex flex-col space-y-6 order-2 lg:order-1">
          <div className="  flex flex-col min-h-0">
            <span className="text-xl lg:text-2xl font-medium inline-block h-8 shrink-0 text-txt-primary mb-6">
              Image Upload
            </span>
            <ImageUpload
              className="w-full h-52"
              images={images}
              onImagesChange={handleImagesChange}
              supportTxt={t("generate.upload.support")}
            />
            <div className="my-2 text-primary text-xs text-center">
              No image? Try one of these
            </div>
            <div className="flex gap-6 justify-center items-center">
              {[1, 2, 3, 4].map((item, index) => <div key={index} className="size-16 rounded-md overflow-hidden">
                <img src="https://picsum.photos/64/64" alt="" />
              </div>)}
            </div>
          </div>


          <div className="space-y-6">
            <label className="text-xl lg:text-2xl font-medium inline-block h-8 text-txt-primary">
              Prompt
            </label>
            <Prompt prompt={prompt} onChange={setPrompt} error={error.prompt} placeholder={t("generate.prompt.placeholder")} className="h-32" />
          </div>
          <div className="space-y-5">
            <div className="flex items-center gap-6">
              <Select value={model} onValueChange={updateModel} name="model">
                <SelectTrigger className="flex-2 py-2 h-12">
                  <SelectValue placeholder={t("feedback.body.desc")} >
                    <div className="flex items-center gap-2 p-2">
                      <div className="text-left">
                        <span className="text-txt-secondary">{modelList.find(i => i.value == model)?.label}</span>
                        <p className="text-txt-tertiary">{modelList.find(i => i.value == model)?.value}</p>
                      </div>
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {modelList.map((item, index) => (
                    <SelectItem
                      key={item.value}
                      value={item.value}
                      className="h-12 flex items-center gap-2 p-2"
                    >

                      <div className="text-left">
                        <span className="text-txt-secondary">{item.label}</span>
                        <p className="text-txt-tertiary">{item.desc}</p>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={aspectRatio} onValueChange={setAspectRatio} name="aspectRatio">
                <SelectTrigger className="flex-1 py-2 h-12">
                  <SelectValue placeholder={t("feedback.body.desc")} >
                    <div className="flex items-center gap-2">
                      <div className="font-semibold w-8 h-8 flex items-center justify-center overflow-hidden">
                        <div className="rounded-sm bg-tertiary"
                          style={getRectangleStyle(aspectRatio)}
                        ></div>
                      </div>
                      <div className="text-xs truncate">{aspectRatio}</div>
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {modelList.find(i => i.value == model)?.aspectRatio.map((item, index) => (
                    <SelectItem
                      key={item}
                      value={item}
                      className="h-12 flex items-center gap-2 p-2"
                    >
                      <div className="font-semibold w-8 h-8 flex items-center justify-center overflow-hidden">
                        <div className="rounded-sm bg-tertiary"
                          style={getRectangleStyle(item)}
                        ></div>
                      </div>
                      <div className="text-xs truncate">{item}</div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>


              <Select value={count} onValueChange={setCount} name="count">
                <SelectTrigger className="flex-1 py-2 h-12">
                  <SelectValue placeholder={t("feedback.body.desc")} >
                    <div className="flex items-center gap-2 text-xs">
                      {count}
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {modelList.find(i => i.value == model)?.count.map((item) => (
                    <SelectItem
                      key={item}
                      value={item}
                      className="h-12 flex items-center gap-2 p-2 text-xs"
                    >
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

            </div>

          </div>

          <div className="w-full px-2">
            <div className="relative inline-block mt-2 w-full">
              <div
                className={cn(
                  "relative px-4 py-3 rounded-full  group bg-btn-primary-bg-active cursor-not-allowed",
                  taskStep === "none" &&
                  "bg-btn-primary-bg  hover:bg-btn-primary-bg-hover cursor-pointer",

                )}
                onClick={taskStep === "none" ? onGenerate : void 0}
              >
                <div
                  className="text-xl text-txt-inverse font-bold text-center whitespace-nowrap transition-colors duration-300 tracking-wider flex items-center justify-center gap-2"
                >

                  {taskStep === "none" && <>
                    {t("generate.btn-gen")}
                    2

                  </>}
                  {taskStep === "createTask" && t("generate.btn-gening")}
                  {taskStep === "pollTaskStatus" && t("generate.btn-poll")}
                  {taskStep === "createTask" && (
                    <div></div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </form >
      <div className="flex flex-col items-center justify-center lg:justify-start lg:min-h-[600px] p-5 sm:p-10  lg:p-0 order-1 lg:order-2 lg:mt-11">
        {renderRightContent(taskStep)}
      </div>
    </div >
  );
}


const getRectangleStyle = (option: string) => {
  const [width, height] = option.split(":").map(Number);
  const maxDimension = Math.max(width, height);
  const normalizedWidth = (width / maxDimension) * 24; // 固定最大边为24px
  const normalizedHeight = (height / maxDimension) * 24;

  const style = {
    width: `${normalizedWidth}px`,
    height: `${normalizedHeight}px`,
  };

  return style;
};
