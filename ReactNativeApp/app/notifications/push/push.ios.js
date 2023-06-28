import NotificationsIOS, { NotificationCategory } from 'react-native-notifications';

import reduxStore from '../../lib/createStore';

class PushNotification {
	constructor() {
		this.onRegister = null;
		this.onNotification = null;
		this.deviceToken = null;

		NotificationsIOS.addEventListener('remoteNotificationsRegistered', (deviceToken) => {
			this.deviceToken = deviceToken;
		});

		NotificationsIOS.addEventListener('notificationOpened', (notification, completion) => {
			const { background } = reduxStore.getState().app;
			if (background) {
				this.onNotification(notification);
			}
			// todo check app crash Error 'Call must be made on main thread'
			//completion();
		});

		const actions = [];
		actions.push(new NotificationCategory({
			identifier: 'MESSAGE',
			actions: []
		}));
		NotificationsIOS.requestPermissions(actions);
	}

	getDeviceToken() {
		return this.deviceToken;
	}

	setBadgeCount = (count = 0) => {
		NotificationsIOS.setBadgesCount(count);
	}

	async configure(params) {
		this.onRegister = params.onRegister;
		this.onNotification = params.onNotification;

		const initial = await NotificationsIOS.getInitialNotification();
		// NotificationsIOS.consumeBackgroundQueue();
		return Promise.resolve(initial);
	}
}
export default new PushNotification();
