import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { getLngCode } from "@/lib/utils";
interface navItem {
    label: string;
    code: string;
    path: string;
    isActive?: boolean;
}

export default function BreadCrumbs({ items }: { items: navItem[] }) {
    return <nav className="h-6 text-left" aria-label="Breadcrumb">
        <ol className="flex items-center space-x-2 text-sm text-[#CFCFCF]">
            {items.map((item, index) => (
                <li key={index} className="flex items-center">
                    <Link href={getLngCode(item.code, item.path)} className={`hover:text-[#F2F2F2] ${item.isActive && "text-[#F2F2F2]"}`}>{item.label}</Link>
                    {!item.isActive && <ChevronRight size={12} className="mx-2" />}
                </li>
            ))}
        </ol>
    </nav>
}