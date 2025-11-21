import Link from "next/link";
import Image from "next/image";
import { getT } from "@/i18n/server";
import { Mail } from "lucide-react";
import getLngCode from "@/lib/utils/getLngCode";

export default async function Footer() {
  const { t, i18n } = await getT("layout");
  const code = i18n.resolvedLanguage || "";

  return (
    <>
      <div className="w-full h-0.5 relative bg-linear-to-r from-pink-600 via-violet-800 to-amber-600 mb-8" />

      <footer className="text-[#F2F2F2] max-w-[1440px] mx-auto py-8 mt-6 px-8" aria-labelledby="footer-heading">

        <h2 className="footer-heading sr-only">Footer Navigation</h2>

        <div className="flex flex-col lg:flex-row lg:justify-between mb-25">
          <div className="flex-1 flex flex-col space-y-4 mb-12">
            <Link
              href={getLngCode(code, "")}
              className="flex items-center justify-center lg:justify-start gap-2 shrink-0 group hover:scale-[1.02] transition-all duration-300 w-fit"
            >
              <Image
                src="/icon.png"
                alt="AI Image Generator logo"
                width={32}
                height={32}
              />
              <h3 className="font-extrabold tracking-tight text-lg md:text-xl text-[#F2F2F2]">
                AI Image Generator
              </h3>
            </Link>
            <span className="text-sm font-medium leading-5 lg:w-[315px] text-center lg:text-start">
              {t("footer.description")}
            </span>
            <address className="mt-4 text-sm flex items-center gap-2 not-italic justify-center lg:justify-start">
              <Mail className="size-5" />
              <Link href="mailto:hi@aiimagegenerator.us">hi@aiimagegenerator.us</Link>
            </address>

          </div>

          <div className="flex-1 flex gap-8 justify-around flex-col sm:flex-row">
            <div className="space-y-6 text-[#F2F2F2] font-medium flex flex-col text-sm" aria-labelledby="ai-tools-title">
              <h3 id="ai-tools-title" className="text-2xl">{t("footer.aiTools.title")}</h3>
              <Link href={getLngCode(code, "/face-swap")}>{t("footer.aiTools.faceSwap")}</Link>
              <Link href={getLngCode(code, "/image-upscaler")}>{t("footer.aiTools.imageUpscaler")}</Link>
              <Link href={getLngCode(code, "/background-remover")}>{t("footer.aiTools.backgroundRemover")}</Link>
            </div>

            <div className="space-y-6 text-[#F2F2F2] font-medium flex flex-col text-sm" aria-labelledby="company-title">
              <h3 id="company-title" className="text-2xl">{t("footer.company.title")}</h3>
              <Link href={getLngCode(code, "privacy-policy")}>{t("footer.company.privacy")}</Link>
              <Link href={getLngCode(code, "terms-of-service")}>{t("footer.company.terms")}</Link>
              <Link href={getLngCode(code, "refund-policy")}>{t("footer.company.refund")}</Link>
            </div>
          </div>
        </div>
        <div className="border-t border-[#857BA1] py-4 text-[#F2F2F2] text-sm mt-32">
          {t("footer.copyright")}
        </div>
      </footer>
    </>
  );
}
