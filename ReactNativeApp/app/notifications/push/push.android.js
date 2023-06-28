import { NotificationsAndroid, PendingNotifications } from 'react-native-notifications';

class PushNotification {
	constructor() {
		this.onRegister = null;
		this.onNotification = null;
		this.deviceToken = null;

		NotificationsAndroid.setRegistrationTokenUpdateListener((deviceToken) => {
			this.deviceToken = deviceToken;
		});

		NotificationsAndroid.setNotificationOpenedListener((notification) => {
			this.onNotification(notification);
		});
	}

	getDeviceToken() {
		return this.deviceToken;
	}

	setBadgeCount = (count = 0) => {
		let BadgeAndroid = require('react-native-android-badge');
		BadgeAndroid.setBadge(count);
	}

	configure(params) {
		this.onRegister = params.onRegister;
		this.onNotification = params.onNotification;
		NotificationsAndroid.refreshToken();
		return PendingNotifications.getInitialNotification();
	}
}

export default new PushNotification();
