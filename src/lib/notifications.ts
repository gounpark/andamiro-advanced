import { supabase } from "./supabase";
import { getMyId } from "./exchangeStore";

export const NOTIF_TIME_KEY = "andamiro_notif_time";
export const NOTIF_ON_KEY = "andamiro_notif_on";
export const EXCHANGE_NOTIF_ON_KEY = "andamiro_exchange_notif_on";

export function isNotificationSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export function getNotificationPermission(): NotificationPermission | "unsupported" {
  if (!isNotificationSupported()) return "unsupported";
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!isNotificationSupported()) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const result = await Notification.requestPermission();
  return result === "granted";
}

export function areAppNotificationsOn(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(NOTIF_ON_KEY) !== "0";
}

export function areExchangeNotificationsOn(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(EXCHANGE_NOTIF_ON_KEY) !== "0";
}

export function canShowNotifications(): boolean {
  return isNotificationSupported() && Notification.permission === "granted" && areAppNotificationsOn();
}

export function showAppNotification(title: string, options?: NotificationOptions): Notification | null {
  if (!canShowNotifications()) return null;
  return new Notification(title, {
    icon: "/favicon.png",
    ...options,
  });
}

export function sendDailyDiaryNotification() {
  showAppNotification("안다미로 알림 🍀", {
    body: "오늘의 감정을 기록할 시간이에요!",
  });
}

export function sendExchangeTestNotification() {
  showAppNotification("교환일기 알림", {
    body: "새 댓글이 달리면 이렇게 알려드릴게요.",
  });
}

function getServiceWorkerUrl(): string {
  const base = (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");
  return `${base}/sw.js`;
}

function urlBase64ToUint8Array(value: string): Uint8Array {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = `${value}${padding}`.replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

export function isWebPushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    isNotificationSupported()
  );
}

export async function enableExchangePushNotifications(): Promise<boolean> {
  const publicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;
  if (!isWebPushSupported() || !publicKey) return false;

  const granted = await requestNotificationPermission();
  if (!granted) return false;

  const registration = await navigator.serviceWorker.register(getServiceWorkerUrl());
  const existing = await registration.pushManager.getSubscription();
  const subscription =
    existing ??
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    }));

  const json = subscription.toJSON();
  const endpoint = json.endpoint;
  const p256dh = json.keys?.p256dh;
  const auth = json.keys?.auth;
  if (!endpoint || !p256dh || !auth) return false;

  const { error } = await supabase.from("exchange_push_subscriptions").upsert({
    user_id: getMyId(),
    endpoint,
    p256dh,
    auth,
    updated_at: new Date().toISOString(),
  });

  if (error) return false;
  localStorage.setItem(NOTIF_ON_KEY, "1");
  localStorage.setItem(EXCHANGE_NOTIF_ON_KEY, "1");
  return true;
}

export async function disableExchangePushNotifications(): Promise<void> {
  localStorage.setItem(EXCHANGE_NOTIF_ON_KEY, "0");
  if (!isWebPushSupported()) return;

  const registration = await navigator.serviceWorker.getRegistration(getServiceWorkerUrl());
  const subscription = await registration?.pushManager.getSubscription();
  if (!subscription) return;

  await supabase.from("exchange_push_subscriptions").delete().eq("endpoint", subscription.endpoint);
  await subscription.unsubscribe();
}
