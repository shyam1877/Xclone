export interface DeviceInfo {
  browser: string;
  os: string;
  deviceCategory: "desktop" | "laptop" | "mobile";
  isGoogleChrome: boolean;
  isMicrosoftBrowser: boolean;
  isMobile: boolean;
}

export function getDeviceInfo(): DeviceInfo {
  if (typeof window === "undefined" || !navigator) {
    return {
      browser: "Unknown",
      os: "Unknown",
      deviceCategory: "desktop",
      isGoogleChrome: false,
      isMicrosoftBrowser: false,
      isMobile: false,
    };
  }

  const ua = navigator.userAgent || "";
  const platform = (navigator as any).userAgentData?.platform || navigator.platform || "";

  // ── Browser Detection ──────────────────────────────────────────────────────
  let browser = "Unknown";
  const isEdge = /Edg|Edge/i.test(ua);
  const isIE = /MSIE|Trident/i.test(ua);
  const isMicrosoftBrowser = isEdge || isIE;

  const isOpera = /OPR|Opera/i.test(ua);
  const isBrave = !!(navigator as any).brave;
  const isFirefox = /Firefox|FxiOS/i.test(ua);
  const isSafari = /Safari/i.test(ua) && !/Chrome|CriOS/i.test(ua);
  const isChrome =
    (/Chrome|CriOS/i.test(ua) || (window as any).chrome) &&
    !isMicrosoftBrowser &&
    !isOpera &&
    !isBrave;

  if (isEdge) {
    browser = "Microsoft Edge";
  } else if (isIE) {
    browser = "Microsoft Internet Explorer";
  } else if (isChrome) {
    browser = "Google Chrome";
  } else if (isFirefox) {
    browser = "Mozilla Firefox";
  } else if (isSafari) {
    browser = "Safari";
  } else if (isOpera) {
    browser = "Opera";
  } else if (isBrave) {
    browser = "Brave";
  } else {
    browser = "Chrome Compatible Browser";
  }

  // ── OS Detection ───────────────────────────────────────────────────────────
  let os = "Unknown";
  if (/Win/i.test(ua) || /Win/i.test(platform)) {
    os = "Windows";
  } else if (/iPhone|iPad|iPod/i.test(ua)) {
    os = "iOS";
  } else if (/Android/i.test(ua)) {
    os = "Android";
  } else if (/Mac/i.test(ua) || /Mac/i.test(platform)) {
    os = "macOS";
  } else if (/Linux/i.test(ua) || /Linux/i.test(platform)) {
    os = "Linux";
  } else {
    os = "Desktop OS";
  }

  // ── Device Category Detection (desktop, laptop, mobile) ────────────────────
  const isMobileUa = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(ua);
  const isSmallScreen = typeof window !== "undefined" && window.innerWidth <= 768;
  const hasTouch = typeof navigator !== "undefined" && (navigator.maxTouchPoints > 1 || "ontouchstart" in window);

  const isMobile = isMobileUa || (isSmallScreen && hasTouch);

  let deviceCategory: "desktop" | "laptop" | "mobile" = "desktop";
  if (isMobile) {
    deviceCategory = "mobile";
  } else {
    // Distinguish laptop from desktop:
    // Laptops often have trackpad/touch, battery API support, or portable resolution
    const hasBatteryApi = typeof (navigator as any).getBattery === "function";
    const isCommonLaptopRes =
      typeof window !== "undefined" &&
      (window.screen.width <= 1600 || window.screen.height <= 1000);

    if (hasBatteryApi || (hasTouch && !isMobile) || isCommonLaptopRes) {
      deviceCategory = "laptop";
    } else {
      deviceCategory = "desktop";
    }
  }

  return {
    browser,
    os,
    deviceCategory,
    isGoogleChrome: isChrome,
    isMicrosoftBrowser,
    isMobile,
  };
}
