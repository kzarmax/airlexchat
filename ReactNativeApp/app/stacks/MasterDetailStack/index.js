import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { useIsFocused } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createDrawerNavigator } from '@react-navigation/drawer';

import { ThemeContext } from '../../theme';
import {
	defaultHeader, themedHeader, StackAnimation, FadeFromCenterModal
} from '../../utils/navigation';
import { ModalContainer } from './ModalContainer';

// Chats Stack
import RoomView from '../../views/RoomView';
import RoomsListView from '../../views/RoomsListView';
import RoomActionsView from '../../views/RoomActionsView';
import RoomInfoView from '../../views/RoomInfoView';
import RoomInfoEditView from '../../views/RoomInfoEditView';
import ProfileView from '../../views/ProfileView';

// InsideStackNavigator
import AttachmentView from '../../views/AttachmentView';
import JitsiMeetView from '../../views/JitsiMeetView';

import { setKeyCommands, deleteKeyCommands } from '../../commands';
import OthersProfileView from "../../views/OthersProfileView";
import OthersProfileBlockView from "../../views/OthersProfileBlockView";
import OthersProfileDeleteView from "../../views/OthersProfileDeleteView";
import OpenSecretCardView from "../../views/OpenSecretCardView";
import AccountVerifyView from "../../views/AccountVerifyView";
import ResetCardPasswordView from "../../views/ResetCardPasswordView";
import GroupAddQRView from "../../views/GroupAddQRView";
import NewCardView from "../../views/NewCardView";
import NewCardProfileView from "../../views/NewCardProfileView";
import AuthenticationWebView from "../../views/AuthenticationWebView";
import SetBackgroundView from "../../views/SetBackgroundView";
import StampManagementView from "../../views/StampManagementView";
import StampCategoriesView from "../../views/StampCategoriesView";
import SettingsMenuView from "../../views/SettingsMenuView";
import StampEditView from "../../views/StampEditView";
import StampGiftView from "../../views/StampGiftView";
import ProfileSceneAddView from "../../views/ProfileSceneAddView";
import ProfileSceneAddDetailView from "../../views/ProfileSceneAddDetailView";
import TextSizeView from "../../views/TextSizeView";
import PointStoreView from "../../views/PointStoreView";
import PointPurchaseView from "../../views/PointPurchaseView";
import FaqView from "../../views/FaqView";
import TermsServiceView from "../../views/TermsServiceView";
import AccountView from "../../views/AccountView";
import DeleteAccountView from "../../views/DeleteAccountView";
import GroupCardSelectView from "../../views/GroupCardSelectView";
import CreateGroupView from "../../views/CreateGroupView";
import FriendsAddQRView from "../../views/FriendsAddQRView";
import QRCardSelectView from "../../views/QRCardSelectView";
import QRAfterReadView from "../../views/QRAfterReadView";
import QRAfterAddView from "../../views/QRAfterAddView";

// ChatsStackNavigator
const ChatsStack = createStackNavigator();
const ChatsStackNavigator = React.memo(() => {
	const { theme } = React.useContext(ThemeContext);

	const isFocused = useIsFocused();
	useEffect(() => {
		if (isFocused) {
			setKeyCommands();
		} else {
			deleteKeyCommands();
		}
		return () => {
			deleteKeyCommands();
		};
	}, [isFocused]);

	return (
		<ChatsStack.Navigator screenOptions={{ ...defaultHeader, ...themedHeader(theme), ...StackAnimation }}>
			<ChatsStack.Screen
				name='RoomView'
				component={RoomView}
				options={{ headerShown: false }}
			/>
		</ChatsStack.Navigator>
	);
});

// DrawerNavigator
const Drawer = createDrawerNavigator();
const DrawerNavigator = React.memo(() => (
	<Drawer.Navigator
		drawerContent={({ navigation, state }) => <RoomsListView navigation={navigation} state={state} />}
		drawerType='permanent'
	>
		<Drawer.Screen name='ChatsStackNavigator' component={ChatsStackNavigator} />
	</Drawer.Navigator>
));

const ModalStack = createStackNavigator();
const ModalStackNavigator = React.memo(({ navigation }) => {
	const { theme } = React.useContext(ThemeContext);
	return (
		<ModalContainer navigation={navigation} theme={theme}>
			<ModalStack.Navigator screenOptions={{ ...defaultHeader, ...themedHeader(theme), ...StackAnimation }}>
				<ModalStack.Screen
					name='RoomActionsView'
					component={RoomActionsView}
					options={RoomActionsView.navigationOptions}
				/>
				<ModalStack.Screen
					name='RoomInfoView'
					component={RoomInfoView}
					options={RoomInfoView.navigationOptions}
				/>
				<ModalStack.Screen
					name='RoomInfoEditView'
					component={RoomInfoEditView}
				/>
				<ModalStack.Screen
					name='OthersProfileView'
					component={OthersProfileView}
					options={OthersProfileView.navigationOptions}
				/>
				<ModalStack.Screen
					name='OthersProfileBlockView'
					component={OthersProfileBlockView}
					options={OthersProfileBlockView.navigationOptions}
				/>
				<ModalStack.Screen
					name='OthersProfileDeleteView'
					component={OthersProfileDeleteView}
					options={OthersProfileDeleteView.navigationOptions}
				/>
				<ModalStack.Screen
					name='OpenSecretCardView'
					component={OpenSecretCardView}
					options={OpenSecretCardView.navigationOptions}
				/>
				<ModalStack.Screen
					name='AccountVerifyView'
					component={AccountVerifyView}
					options={AccountVerifyView.navigationOptions}
				/>
				<ModalStack.Screen
					name='ResetCardPasswordView'
					component={ResetCardPasswordView}
					options={ResetCardPasswordView.navigationOptions}
				/>
				<ModalStack.Screen
					name='GroupAddQRView'
					component={GroupAddQRView}
					options={GroupAddQRView.navigationOptions}
				/>
				<ModalStack.Screen
					name='NewCardView'
					component={NewCardView}
					options={NewCardView.navigationOptions}
				/>
				<ModalStack.Screen
					name='NewCardProfileView'
					component={NewCardProfileView}
				/>
				<ModalStack.Screen
					name='AuthenticationWebView'
					component={AuthenticationWebView}
					options={AuthenticationWebView.navigationOptions}
				/>
				<ModalStack.Screen
					name='ProfileView'
					component={ProfileView}
				/>
				<ModalStack.Screen
					name='SetBackgroundView'
					component={SetBackgroundView}
					options={SetBackgroundView.navigationOptions}
				/>
				<ModalStack.Screen
					name='StampManagementView'
					component={StampManagementView}
					options={StampManagementView.navigationOptions}
				/>
				<ModalStack.Screen
					name='StampCategoriesView'
					component={StampCategoriesView}
					options={SettingsMenuView.navigationOptions}
				/>
				<ModalStack.Screen
					name='StampEditView'
					component={StampEditView}
					options={StampEditView.navigationOptions}
				/>
				<ModalStack.Screen
					name='StampGiftView'
					component={StampGiftView}
					options={StampGiftView.navigationOptions}
				/>
				<ModalStack.Screen
					name='ProfileSceneAddView'
					component={ProfileSceneAddView}
					options={ProfileSceneAddView.navigationOptions}
				/>
				<ModalStack.Screen
					name='ProfileSceneAddDetailView'
					component={ProfileSceneAddDetailView}
					options={ProfileSceneAddDetailView.navigationOptions}
				/>
				<ModalStack.Screen
					name='TextSizeView'
					component={TextSizeView}
					options={TextSizeView.navigationOptions}
				/>
				<ModalStack.Screen
					name='PointStoreView'
					component={PointStoreView}
					options={PointStoreView.navigationOptions}
				/>
				<ModalStack.Screen
					name='PointPurchaseView'
					component={PointPurchaseView}
					options={SettingsMenuView.navigationOptions}
				/>
				<ModalStack.Screen
					name='FaqView'
					component={FaqView}
					options={FaqView.navigationOptions}
				/>
				<ModalStack.Screen
					name='TermsServiceView'
					component={TermsServiceView}
					options={TermsServiceView.navigationOptions}
				/>
				<ModalStack.Screen
					name='AccountView'
					component={AccountView}
					options={AccountView.navigationOptions}
				/>
				<ModalStack.Screen
					name='DeleteAccountView'
					component={DeleteAccountView}
					options={DeleteAccountView.navigationOptions}
				/>
				<ModalStack.Screen
					name='GroupCardSelectView'
					component={GroupCardSelectView}
					options={GroupCardSelectView.navigationOptions}
				/>
				<ModalStack.Screen
					name='CreateGroupView'
					component={CreateGroupView}
				/>
				<ModalStack.Screen
					name='FriendsAddQRView'
					component={FriendsAddQRView}
					options={FriendsAddQRView.navigationOptions}
				/>
				<ModalStack.Screen
					name='QRCardSelectView'
					component={QRCardSelectView}
					options={QRCardSelectView.navigationOptions}
				/>
				<ModalStack.Screen
					name='QRAfterReadView'
					component={QRAfterReadView}
					options={QRAfterReadView.navigationOptions}
				/>
				<ModalStack.Screen
					name='QRAfterAddView'
					component={QRAfterAddView}
					options={QRAfterAddView.navigationOptions}
				/>
			</ModalStack.Navigator>
		</ModalContainer>
	);
});

ModalStackNavigator.propTypes = {
	navigation: PropTypes.object
};

// InsideStackNavigator
const InsideStack = createStackNavigator();
const InsideStackNavigator = React.memo(() => {
	const { theme } = React.useContext(ThemeContext);
	return (
		<InsideStack.Navigator mode='modal' screenOptions={{ ...defaultHeader, ...themedHeader(theme), ...FadeFromCenterModal }}>
			<InsideStack.Screen
				name='DrawerNavigator'
				component={DrawerNavigator}
				options={{ headerShown: false }}
			/>
			<InsideStack.Screen
				name='ModalStackNavigator'
				component={ModalStackNavigator}
				options={{ headerShown: false }}
			/>
			<InsideStack.Screen
				name='AttachmentView'
				component={AttachmentView}
			/>
			<InsideStack.Screen
				name='JitsiMeetView'
				component={JitsiMeetView}
				options={{ headerShown: false }}
			/>
		</InsideStack.Navigator>
	);
});

export default InsideStackNavigator;
