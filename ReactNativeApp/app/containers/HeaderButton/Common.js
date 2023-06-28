import React from 'react';
import PropTypes from 'prop-types';

import { isIOS } from '../../utils/deviceInfo';
import I18n from '../../i18n';
import Container from './HeaderButtonContainer';
import Item from './HeaderButtonItem';

// Left
export const Drawer = React.memo(({ navigation, testID, ...props }) => (
	<Container left>
		<Item iconName='hamburguer' onPress={() => navigation.toggleDrawer()} testID={testID} {...props} />
	</Container>
));

export const CloseButtonGoTop = React.memo(({ navigation, testID }) => (
	<Container left>
		<Item title='close' iconName='close' onPress={() => navigation.pop()} testID={testID} />
	</Container>
));

export const CloseButtonGoQR = React.memo(({ navigation, testID }) => (
	<Container left>
		<Item title='close' iconName='close' onPress={() => navigation.navigate('FriendsAddView')} testID={testID} />
	</Container>
));

export const CloseGoSignIn = React.memo(({ navigation, testID }) => (
	<Container left>
		<Item title='close' iconName='close' onPress={() => navigation.replace('LoginView')} testID={testID} />
	</Container>
));

export const CloseModal = React.memo(({
	navigation, testID, onPress = () => navigation.pop(), ...props
}) => (
	<Container left>
		<Item iconName='close' onPress={onPress} testID={testID} {...props} />
	</Container>
));

export const CancelModal = React.memo(({ onPress, testID }) => (
	<Container left>
		{isIOS
			? <Item title={I18n.t('Cancel')} onPress={onPress} testID={testID} />
			: <Item iconName='close' onPress={onPress} testID={testID} />
		}
	</Container>
));

// Right
export const More = React.memo(({ onPress, testID }) => (
	<Container>
		<Item iconName='kebab' onPress={onPress} testID={testID} />
	</Container>
));

export const Download = React.memo(({ onPress, testID, ...props }) => (
	<Container>
		<Item iconName='download' onPress={onPress} testID={testID} {...props} />
	</Container>
));

export const Preferences = React.memo(({ onPress, testID, ...props }) => (
	<Container>
		<Item iconName='settings' onPress={onPress} testID={testID} {...props} />
	</Container>
));

Drawer.propTypes = {
	navigation: PropTypes.object.isRequired,
	testID: PropTypes.string.isRequired
};
CloseButtonGoTop.propTypes = {
	navigation: PropTypes.object.isRequired,
	testID: PropTypes.string.isRequired,
};
CloseButtonGoQR.propTypes = {
	navigation: PropTypes.object.isRequired,
	testID: PropTypes.string.isRequired,
};
CloseGoSignIn.propTypes = {
	navigation: PropTypes.object.isRequired,
	testID: PropTypes.string.isRequired,
};
CloseModal.propTypes = {
	navigation: PropTypes.object.isRequired,
	testID: PropTypes.string.isRequired,
	onPress: PropTypes.func
};
CancelModal.propTypes = {
	onPress: PropTypes.func.isRequired,
	testID: PropTypes.string.isRequired
};
More.propTypes = {
	onPress: PropTypes.func.isRequired,
	testID: PropTypes.string.isRequired
};
Download.propTypes = {
	onPress: PropTypes.func.isRequired,
	testID: PropTypes.string.isRequired
};
Preferences.propTypes = {
	onPress: PropTypes.func.isRequired,
	testID: PropTypes.string.isRequired
};
