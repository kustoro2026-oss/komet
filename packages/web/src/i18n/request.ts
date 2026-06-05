import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  // requestLocale comes from middleware, but on Vercel with localePrefix:"never"
  // it may not be passed correctly. Read the cookie directly as fallback.
  let requested = await requestLocale;

  if (!requested) {
    const cookieStore = await cookies();
    const localeCookie = cookieStore.get("NEXT_LOCALE");
    if (localeCookie?.value) {
      const potentialLocale = localeCookie.value;
      if (routing.locales.includes(potentialLocale as "en" | "id")) {
        requested = potentialLocale;
      }
    }
  }

  const locale = routing.locales.includes(requested as "en" | "id")
    ? requested
    : routing.defaultLocale;

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
