import { OnUserInteractionListener, OnForegroundNotificationListener } from './Notifications.types';
export declare class Mailbox {
    private onUserInteractionListeners;
    private onForegroundNotificationListeners;
    constructor();
    addOnUserInteractionListener(listenerName: string, listener: OnUserInteractionListener): void;
    addOnForegroundNotificationListener(listenerName: string, listener: OnForegroundNotificationListener): void;
    removeOnUserInteractionListener(listenerName: string): void;
    removeOnForegroundNotificationListener(listenerName: string): void;
    _onForegroundNotification(notification: any): void;
    _onUserInteraction(userInteraction: any): void;
}
