import Link from "next/link";
import Image from "next/image";
import { ChevronDown } from "lucide-react";
import RightSide from "./RightSide";
import { getT } from "@/i18n/server";
import MobileHeader from "./MobileHeader";
import getLngCode from "@/lib/utils/getLngCode";


export default async function Header() {
  const { t, i18n } = await getT("layout");
  const code = i18n.resolvedLanguage || "";




  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full  bg-background-secondary shadow-sm">
      <div className="flex items-center justify-between h-16  px-4 sm:px-8 mx-auto">
        <div className="flex items-center gap-x-8">
          <Link
            href={getLngCode(code, "")}
            title="AI Image Generator Home"
            className="flex items-center gap-3 shrink-0 group hover:scale-[1.02] transition-all duration-300"
          >
            <Image
              src="/icon.png"
              alt="AI Image Editor logo"
              width={36}
              height={36}
            />
            <span className="font-bold text-xl text-txt-secondary tracking-tight">
              AI Image Generator
            </span>
          </Link>

          <nav aria-label="Main navigation" className="hidden xl:block">
            <ul className="flex gap-x-1">

              <li className="relative group">
                <Link
                  href={getLngCode(code, "/pricing")}
                  className="relative flex items-center gap-x-1.5 text-sm font-medium text-txt-secondary hover:text-primary transition-all duration-300 group px-3 py-2 cursor-pointer"
                >
                  <span className="relative inline-block">Pricing</span>

                </Link>
              </li>
              <li className="relative group">
                <Link
                  href={getLngCode(code, "/creations")}
                  className="relative flex items-center gap-x-1.5 text-sm font-medium text-txt-secondary hover:text-primary transition-all duration-300 group px-3 py-2 cursor-pointer"
                >
                  <span className="relative inline-block">Creations</span>

                </Link>
              </li>
            </ul>
          </nav>



        </div>
        <RightSide className="hidden xl:flex" />
        <MobileHeader className=" xl:hidden" />
      </div>
    </header>
  );
}
