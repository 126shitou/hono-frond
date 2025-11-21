import { NextResponse } from "next/server";
import acceptLanguage from "accept-language";
import { defaultLng, languages, cookieName, headerName } from "./i18n/setting";
import { auth } from "./auth";

const publicFile = /\.(.*)$/
const excludeFile = ['favicon.ico', 'icon.png']

// 设置 accept-language 库支持的语言列表
acceptLanguage.languages(languages);

export const middleware = auth((req) => {

  const pathname = req.nextUrl.pathname;

  if (publicFile.test(pathname) && excludeFile.indexOf(pathname.slice(1)) !== -1) {
    return;
  }

  if (req.method !== "GET") {
    if (req.nextUrl.pathname === "/") {
      return NextResponse.rewrite(new URL(`/${defaultLng}${pathname}`, req.url));
    }
    return NextResponse.next();
  }




  // locale 返回路径第一个/=>"" /en/creation=>en /creation=>creation
  const locale = pathname.split("/")[1];

  if (locale === defaultLng) {
    const newPathname =
      "/" + req.nextUrl.pathname.split("/").slice(2).join("/");

    // 重定向到不带语言前缀的默认语言路径
    return NextResponse.redirect(
      new URL(`${newPathname}${req.nextUrl.search}`, req.url)
    );
  }

  let lng;
  // 优先从cookie获取用户的语言
  if (req.cookies.has(cookieName))
    lng = acceptLanguage.get(req.cookies.get(cookieName)?.value);
  // 如果cookie中没有用户语言 则从浏览器的 Accept-Language 头中获取
  if (!lng) lng = acceptLanguage.get(req.headers.get("Accept-Language"));
  // 如果浏览器头中也没有语言信息 则默认使用默认语言
  if (!lng) lng = defaultLng;

  const pathnameIsMissingLocale = languages.every((loc) => locale !== loc);
  // 创建新的请求头，设置检测到的语言信息
  const headers = new Headers(req.headers);

  // 如果缺少语言前缀，内部重写到默认语言路径
  if (pathnameIsMissingLocale) {
    headers.set(headerName, defaultLng);
    return NextResponse.rewrite(new URL(`/${defaultLng}${pathname}${req.nextUrl.search}`, req.url), {
      headers,
    });
  }

  // 如果路径中包含语言前缀 则设置请求头为该语言
  headers.set(headerName, locale || lng);

  return NextResponse.next({ headers });
})

export const config = {
  // 中间件匹配规则：只处理页面路由，排除静态资源和API
  matcher: ['/((?!api|_next/static|_next/image|assets|favicon.ico|sw.js|site.webmanifest).*)']
}

