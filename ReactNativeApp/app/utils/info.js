import { Alert } from 'react-native';
import { LISTENER } from '../containers/Toast';
import EventEmitter from '../utils/events';
import I18n from '../i18n';

export const showErrorAlert = (message, title, onPress = () => {}) => Alert.alert(title, message, [{ text: 'OK', onPress }], { cancelable: true });

export const showToast = (message)=>EventEmitter.emit(LISTENER, {message: message});

export const showConfirmationAlert = ({
	title, message, confirmationText = I18n.t('Yes'), dismissText = I18n.t('Cancel'), onPress, onCancel
}) => (
	Alert.alert(
		title || I18n.t('Are_you_sure_question_mark'),
		message,
		[
			{
				text: dismissText,
				onPress: onCancel,
				style: 'cancel'
			},
			{
				text: confirmationText,
				style: 'destructive',
				onPress
			}
		],
		{ cancelable: false }
	)
);
