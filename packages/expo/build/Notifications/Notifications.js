import Constants from 'expo-constants';
import invariant from 'invariant';
import { AsyncStorage, Platform } from 'react-native';
import { UnavailabilityError } from '@unimodules/core';
import ExponentNotifications from './ExponentNotifications';
import { Mailbox } from './Mailbox';
const _mailbox = new Mailbox();
function _processNotification(notification) {
    notification = Object.assign({}, notification);
    if (!notification.data) {
        notification.data = {};
    }
    if (notification.hasOwnProperty('count')) {
        delete notification.count;
    }
    // Delete any Android properties on iOS and merge the iOS properties on root notification object
    if (Platform.OS === 'ios') {
        if (notification.android) {
            delete notification.android;
        }
        if (notification.ios) {
            notification = Object.assign(notification, notification.ios);
            delete notification.ios;
        }
    }
    // Delete any iOS properties on Android and merge the Android properties on root notification
    // object
    if (Platform.OS === 'android') {
        if (notification.ios) {
            delete notification.ios;
        }
        if (notification.android) {
            notification = Object.assign(notification, notification.android);
            delete notification.android;
        }
    }
    return notification;
}
function _validateNotification(notification) {
    if (Platform.OS === 'ios') {
        invariant(!!notification.title && !!notification.body, 'Local notifications on iOS require both a title and a body');
    }
    else if (Platform.OS === 'android') {
        invariant(!!notification.title, 'Local notifications on Android require a title');
    }
}
let ASYNC_STORAGE_PREFIX = '__expo_internal_channel_';
async function _legacyReadChannel(id) {
    try {
        let channelString = await AsyncStorage.getItem(`${ASYNC_STORAGE_PREFIX}${id}`);
        if (channelString) {
            return JSON.parse(channelString);
        }
    }
    catch (e) { }
    return null;
}
function _legacyDeleteChannel(id) {
    return AsyncStorage.removeItem(`${ASYNC_STORAGE_PREFIX}${id}`);
}
if (Platform.OS === 'android') {
    AsyncStorage.clear = async function (callback) {
        try {
            let keys = await AsyncStorage.getAllKeys();
            let result = null;
            if (keys && keys.length) {
                let filteredKeys = keys.filter(key => !key.startsWith(ASYNC_STORAGE_PREFIX));
                await AsyncStorage.multiRemove(filteredKeys);
            }
            callback && callback();
        }
        catch (e) {
            callback && callback(e);
            throw e;
        }
    };
}
// User passes set of actions titles.
export function createCategoryAsync(categoryId, actions) {
    return ExponentNotifications.createCategoryAsync(categoryId, actions);
}
export function deleteCategoryAsync(categoryId) {
    return ExponentNotifications.deleteCategoryAsync(categoryId);
}
/* Re-export */
export function getExpoPushTokenAsync() {
    if (!ExponentNotifications.getExponentPushTokenAsync) {
        throw new UnavailabilityError('Expo.Notifications', 'getExpoPushTokenAsync');
    }
    if (!Constants.isDevice) {
        throw new Error(`Must be on a physical device to get an Expo Push Token`);
    }
    return ExponentNotifications.getExponentPushTokenAsync();
}
export async function getDevicePushTokenAsync(config) {
    if (!ExponentNotifications.getDevicePushTokenAsync) {
        throw new UnavailabilityError('Expo.Notifications', 'getDevicePushTokenAsync');
    }
    return ExponentNotifications.getDevicePushTokenAsync(config || {});
}
export function createChannelAndroidAsync(id, channel) {
    if (Platform.OS !== 'android') {
        console.warn(`createChannelAndroidAsync(...) has no effect on ${Platform.OS}`);
        return Promise.resolve();
    }
    return ExponentNotifications.createChannel(id, channel);
}
export function deleteChannelAndroidAsync(id) {
    if (Platform.OS !== 'android') {
        console.warn(`deleteChannelAndroidAsync(...) has no effect on ${Platform.OS}`);
        return Promise.resolve();
    }
    return ExponentNotifications.deleteChannel(id);
}
/* Shows a notification instantly */
export async function presentLocalNotificationAsync(notification) {
    _validateNotification(notification);
    let nativeNotification = _processNotification(notification);
    if (Platform.OS !== 'android') {
        return await ExponentNotifications.presentLocalNotification(nativeNotification);
    }
    else {
        let _channel;
        if (nativeNotification.channelId) {
            _channel = await _legacyReadChannel(nativeNotification.channelId);
        }
        // delete the legacy channel from AsyncStorage so this codepath isn't triggered anymore
        _legacyDeleteChannel(nativeNotification.channelId);
        return ExponentNotifications.presentLocalNotificationWithChannel(nativeNotification, _channel);
    }
}
/* Schedule a notification at a later date */
export async function scheduleLocalNotificationAsync(notification, options = {}) {
    // set now at the beginning of the method, to prevent potential weird warnings when we validate
    // options.time later on
    const now = Date.now();
    // Validate and process the notification data
    _validateNotification(notification);
    let nativeNotification = _processNotification(notification);
    // Validate `options.time`
    if (options.time) {
        let timeAsDateObj = null;
        if (options.time && typeof options.time === 'number') {
            timeAsDateObj = new Date(options.time);
            if (timeAsDateObj.toString() === 'Invalid Date') {
                timeAsDateObj = null;
            }
        }
        else if (options.time && options.time instanceof Date) {
            timeAsDateObj = options.time;
        }
        // If we couldn't convert properly, throw an error
        if (!timeAsDateObj) {
            throw new Error(`Provided value for "time" is invalid. Please verify that it's either a number representing Unix Epoch time in milliseconds, or a valid date object.`);
        }
        // If someone passes in a value that is too small, say, by an order of 1000 (it's common to
        // accidently pass seconds instead of ms), display a warning.
        if (timeAsDateObj.getTime() < now) {
            console.warn(`Provided value for "time" is before the current date. Did you possibly pass number of seconds since Unix Epoch instead of number of milliseconds?`);
        }
        options = {
            ...options,
            time: timeAsDateObj.getTime(),
        };
    }
    if (options.intervalMs != null && options.repeat != null) {
        throw new Error(`Pass either the "repeat" option or "intervalMs" option, not both`);
    }
    // Validate options.repeat
    if (options.repeat != null) {
        const validOptions = new Set(['minute', 'hour', 'day', 'week', 'month', 'year']);
        if (!validOptions.has(options.repeat)) {
            throw new Error(`Pass one of ['minute', 'hour', 'day', 'week', 'month', 'year'] as the value for the "repeat" option`);
        }
    }
    if (options.intervalMs != null) {
        if (Platform.OS === 'ios') {
            throw new Error(`The "intervalMs" option is not supported on iOS`);
        }
        if (options.intervalMs <= 0 || !Number.isInteger(options.intervalMs)) {
            throw new Error(`Pass an integer greater than zero as the value for the "intervalMs" option`);
        }
    }
    if (Platform.OS !== 'android') {
        if (options.repeat) {
            console.warn('Ability to schedule an automatically repeated notification is deprecated on iOS and will be removed in the next SDK release.');
            return ExponentNotifications.legacyScheduleLocalRepeatingNotification(nativeNotification, options);
        }
        return ExponentNotifications.scheduleLocalNotification(nativeNotification, options);
    }
    else {
        let _channel;
        if (nativeNotification.channelId) {
            _channel = await _legacyReadChannel(nativeNotification.channelId);
        }
        // delete the legacy channel from AsyncStorage so this codepath isn't triggered anymore
        _legacyDeleteChannel(nativeNotification.channelId);
        return ExponentNotifications.scheduleLocalNotificationWithChannel(nativeNotification, options, _channel);
    }
}
/* Dismiss currently shown notification with ID (Android only) */
export async function dismissNotificationAsync(notificationId) {
    if (!ExponentNotifications.dismissNotification) {
        throw new UnavailabilityError('Expo.Notifications', 'dismissNotification');
    }
    return await ExponentNotifications.dismissNotification(notificationId);
}
/* Dismiss all currently shown notifications (Android only) */
export async function dismissAllNotificationsAsync() {
    if (!ExponentNotifications.dismissAllNotifications) {
        throw new UnavailabilityError('Expo.Notifications', 'dismissAllNotifications');
    }
    return await ExponentNotifications.dismissAllNotifications();
}
/* Cancel scheduled notification notification with ID */
export function cancelScheduledNotificationAsync(notificationId) {
    return ExponentNotifications.cancelScheduledNotificationAsync(notificationId);
}
/* Cancel all scheduled notifications */
export function cancelAllScheduledNotificationsAsync() {
    return ExponentNotifications.cancelAllScheduledNotificationsAsync();
}
export async function setBadgeNumberAsync(number) {
    if (!ExponentNotifications.setBadgeNumberAsync) {
        throw new UnavailabilityError('Expo.Notifications', 'setBadgeNumberAsync');
    }
    return ExponentNotifications.setBadgeNumberAsync(number);
}
export function addOnUserInteractionListener(listenerName, listener) {
    _mailbox.addOnUserInteractionListener(listenerName, listener);
}
export function addOnForegroundNotificationListener(listenerName, listener) {
    _mailbox.addOnForegroundNotificationListener(listenerName, listener);
}
export function removeOnUserInteractionListener(listenerName) {
    _mailbox.removeOnUserInteractionListener(listenerName);
}
export function removeOnForegroundNotificationListener(listenerName) {
    _mailbox.removeOnForegroundNotificationListener(listenerName);
}
//# sourceMappingURL=Notifications.js.map