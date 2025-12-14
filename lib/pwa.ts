"use client";

export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  
  const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
  // @ts-ignore - navigator.standalone is iOS specific
  const isIOSStandalone = window.navigator.standalone === true;
  
  return isStandalone || isIOSStandalone;
}

export function hasOnboarded(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("saeshify_onboarded") === "1";
}

export function setOnboarded() {
  localStorage.setItem("saeshify_onboarded", "1");
}

export function hasDismissedInstallTip(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("saeshify_install_tip_dismissed") === "1";
}

export function setDismissedInstallTip() {
  localStorage.setItem("saeshify_install_tip_dismissed", "1");
}
