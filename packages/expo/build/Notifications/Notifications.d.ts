import { LocalNotification, Channel, ActionType, LocalNotificationId, OnUserInteractionListener, OnForegroundNotificationListener } from './Notifications.types';
export declare function createCategoryAsync(categoryId: string, actions: ActionType[]): Promise<void>;
export declare function deleteCategoryAsync(categoryId: string): Promise<void>;
export declare function getExpoPushTokenAsync(): Promise<string>;
export declare function getDevicePushTokenAsync(config: {
    gcmSenderId?: string;
}): Promise<{
    type: string;
    data: string;
}>;
export declare function createChannelAndroidAsync(id: string, channel: Channel): Promise<void>;
export declare function deleteChannelAndroidAsync(id: string): Promise<void>;
export declare function presentLocalNotificationAsync(notification: LocalNotification): Promise<LocalNotificationId>;
export declare function scheduleLocalNotificationAsync(notification: LocalNotification, options?: {
    time?: Date | number;
    repeat?: 'minute' | 'hour' | 'day' | 'week' | 'month' | 'year';
    intervalMs?: number;
}): Promise<LocalNotificationId>;
export declare function dismissNotificationAsync(notificationId: LocalNotificationId): Promise<void>;
export declare function dismissAllNotificationsAsync(): Promise<void>;
export declare function cancelScheduledNotificationAsync(notificationId: LocalNotificationId): Promise<void>;
export declare function cancelAllScheduledNotificationsAsync(): Promise<void>;
export declare function setBadgeNumberAsync(number: number): Promise<void>;
export declare function addOnUserInteractionListener(listenerName: string, listener: OnUserInteractionListener): void;
export declare function addOnForegroundNotificationListener(listenerName: string, listener: OnForegroundNotificationListener): void;
export declare function removeOnUserInteractionListener(listenerName: string): void;
export declare function removeOnForegroundNotificationListener(listenerName: string): void;
