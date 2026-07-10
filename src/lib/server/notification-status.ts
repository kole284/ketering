export const notificationStatuses = ["not_requested", "pending", "sent", "failed", "skipped"] as const;

export type NotificationStatus = (typeof notificationStatuses)[number];

export function isNotificationStatus(value: string): value is NotificationStatus {
  return notificationStatuses.includes(value as NotificationStatus);
}
