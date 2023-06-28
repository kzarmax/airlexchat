import React from 'react';
import { I18nManager, Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from '@react-navigation/stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
import FontAwesomeIcon from "react-native-vector-icons/FontAwesome";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import AntDesignIcon from "react-native-vector-icons/AntDesign";
import Ionicons from "react-native-vector-icons/Ionicons";

import I18n from './../i18n';
import { ThemeContext } from '../theme';
import {
	defaultHeader, themedHeader, ModalAnimation, StackAnimation
} from '../utils/navigation';
import Sidebar from '../views/SidebarView';

// FriendsListView
import FriendsListView from '../views/FriendsListView';

// RoomsListStack
import RoomsListView from '../views/RoomsListView';

// FriendsAddStack
import FriendsAddView from '../views/FriendsAddView';
import FriendsAddQRView from '../views/FriendsAddQRView';
import QRCardSelectView from '../views/QRCardSelectView';
import QRAfterReadView from '../views/QRAfterReadView';
import QRAfterAddView from '../views/QRAfterAddView';

// FavoritesListStack
import FavoritesListView from '../views/FavoritesListView';

// SettingsStack
import SettingsMenuView from '../views/SettingsMenuView';
import NewCardView from '../views/NewCardView';
import NewCardProfileView from '../views/NewCardProfileView';
import StampManagementView from '../views/StampManagementView';
import StampCategoriesView from '../views/StampCategoriesView';
import StampEditView from '../views/StampEditView';
import StampGiftView from '../views/StampGiftView';
import ProfileSceneAddView from '../views/ProfileSceneAddView';
import ProfileSceneAddDetailView from '../views/ProfileSceneAddDetailView';
import ResetCardPasswordView from '../views/ResetCardPasswordView';
import TextSizeView from '../views/TextSizeView';
import PointStoreView from '../views/PointStoreView';
import PointPurchaseView from '../views/PointPurchaseView';
import FaqView from '../views/FaqView';
import TermsServiceView from '../views/TermsServiceView';
import AccountView from '../views/AccountView';
import DeleteAccountView from '../views/DeleteAccountView';
import GroupCardSelectView from '../views/GroupCardSelectView';
import CreateGroupView from '../views/CreateGroupView';
import GroupAddQRView from '../views/GroupAddQRView';

// Chats Stack
import RoomView from '../views/RoomView';
import ThreadMessagesView from '../views/ThreadMessagesView';
import RoomActionsView from '../views/RoomActionsView';
import RoomInfoView from '../views/RoomInfoView';
import RoomInfoEditView from '../views/RoomInfoEditView';
import OthersProfileView from '../views/OthersProfileView';
import OthersProfileBlockView from '../views/OthersProfileBlockView';
import OthersProfileDeleteView from '../views/OthersProfileDeleteView';
import OpenSecretCardView from '../views/OpenSecretCardView';
import AccountVerifyView from '../views/AccountVerifyView';

// Profile Stack
import ProfileView from '../views/ProfileView';

// InsideStackNavigator
import AttachmentView from '../views/AttachmentView';
import JitsiMeetView from '../views/JitsiMeetView';
import {themes} from "../constants/colors";
import SetBackgroundView from '../views/SetBackgroundView';
import AuthenticationWebView from "../views/AuthenticationWebView";
import ChatConfigView from "../views/ChatConfigView";
import AttachmentsView from "../views/AttachmentsView";
import E2EEnterYourPasswordView from "../views/E2EEnterYourPasswordView";
import E2ESaveYourPasswordView from "../views/E2ESaveYourPasswordView";
import E2EHowItWorksView from "../views/E2EHowItWorksView";
import E2EEncryptionSecurityView from "../views/E2EEncryptionSecurityView";

const style = StyleSheet.create({
	tabStyleLabel: {
		fontSize: 10,
		paddingBottom: 4
	}
})

// ???
const FriendsList = createStackNavigator();
const FriendsListStack = () => {
	const {theme} = React.useContext(ThemeContext);
	return (
		<FriendsList.Navigator screenOptions={{ ...defaultHeader, ...themedHeader(theme) }}>
			<FriendsList.Screen
				name='FriendsListView'
				component={FriendsListView}
				options={FriendsListView.navigationOptions}
			/>
		</FriendsList.Navigator>
	);
};


// ???
const RoomsList = createStackNavigator();
const RoomsListStack = () => {
	const {theme} = React.useContext(ThemeContext);
	return (
		<RoomsList.Navigator screenOptions={{...defaultHeader, ...themedHeader(theme)}}>
			<RoomsList.Screen
				name='RoomsListView'
				component={RoomsListView}
			/>
		</RoomsList.Navigator>
	);
};

// ?????
const FriendsAdd = createStackNavigator();
const FriendsAddStack = () => {
	const {theme} = React.useContext(ThemeContext);
	return (
		<FriendsAdd.Navigator screenOptions={{...defaultHeader, ...themedHeader(theme)}}>
			<FriendsAdd.Screen
				name='FriendsAddView'
				component={FriendsAddView}
				options={{headerShown: false}}
			/>
		</FriendsAdd.Navigator>
	);
};

// ?????
const FavoritesList = createStackNavigator();
const FavoritesListStack = () => {
	const {theme} = React.useContext(ThemeContext);
	return (
		<FavoritesList.Navigator screenOptions={{...defaultHeader, ...themedHeader(theme)}}>
			<FavoritesList.Screen
				name='FavoritesListView'
				component={FavoritesListView}
				options={FavoritesListView.navigationOptions}
			/>
		</FavoritesList.Navigator>
	);
};

// ??
const Settings = createStackNavigator();
const SettingsStack = () => {
	const { theme } = React.useContext(ThemeContext);
	return (
		<Settings.Navigator screenOptions={ { ...defaultHeader, ...themedHeader(theme) } }>
			<Settings.Screen
				name='SettingsMenuView'
				component={ SettingsMenuView }
				options={ SettingsMenuView.navigationOptions }
			/>
		</Settings.Navigator>
	);
};

// Tab
const Tab = createBottomTabNavigator();
const TabNavigator = () => {
	const { theme } = React.useContext(ThemeContext);
	return (
		<Tab.Navigator
			initialRouteName="RoomsListStack"
			resetOnBlur={true}
			tabBarOptions={{
				activeTintColor: themes[theme].activeTintColor,
				inactiveTintColor: themes[theme].inactiveTintColor,
			}}
		>
			<Tab.Screen
				name="FriendsListStack"
				component={FriendsListStack}
				options={{
					tabBarLabel: ({color, focused}) => <Text style={{ ...style.tabStyleLabel, color }}>{I18n.t('footer_friend')}</Text>,
					tabBarIcon: ({color, size, focused}) => <FontAwesomeIcon style={{ color }} size={24} name={focused?'user':'user-o'}/>
				}}
			/>
			<Tab.Screen
				name="RoomsListStack"
				component={RoomsListStack}
				options={{
					tabBarLabel: ({color, focused}) => <Text style={{ ...style.tabStyleLabel, color }}>{I18n.t('footer_talk')}</Text>,
					tabBarIcon: ({color, size, focused}) => <MaterialCommunityIcons style={{ color }} size={24} name={focused?'message-text':'message-text-outline'} />
				}}
			/>
			<Tab.Screen
				name="FavoritesListStack"
				component={FavoritesListStack}
				options={{
					tabBarLabel: ({color, focused}) => <Text style={{ ...style.tabStyleLabel, color }}>{I18n.t('footer_favorite')}</Text>,
					tabBarIcon: ({color, size, focused}) => <AntDesignIcon style={{ color }} size={24} name={focused?'star':'staro'} />
				}}
			/>
			<Tab.Screen
				name="FriendsAddStack"
				component={FriendsAddStack}
				options={{
					tabBarLabel: ({color, focused}) => <Text style={{ ...style.tabStyleLabel, color }}>{I18n.t('footer_friend_add')}</Text>,
					tabBarIcon: ({color, size, focused}) => <Ionicons style={{ color }} size={24} name={focused?'person-add':'person-add-outline'} />,
				}}
			/>
			<Tab.Screen
				name="SettingsStack"
				component={SettingsStack}
				options={{
					tabBarLabel: ({color, focused}) => <Text style={{ ...style.tabStyleLabel, color }}>{I18n.t('footer_config')}</Text>,
					tabBarIcon: ({color, size, focused}) => <Ionicons style={{ color }} size={24} name={focused?'settings':'settings-outline'}/>,
				}}
			/>
		</Tab.Navigator>
	);
}

// ChatsStackNavigator
const Chats = createStackNavigator();
const ChatsStack = () => {
	const { theme } = React.useContext(ThemeContext);
	return (
		<Chats.Navigator screenOptions={{ ...defaultHeader, ...themedHeader(theme), ...StackAnimation }}>
			<Chats.Screen
				name='TabHome'
				component={TabNavigator}
				options={{ headerShown: false }}
			/>
			<Chats.Screen
				name='RoomView'
				component={RoomView}
				options={{ headerShown: false }}
			/>
			<Chats.Screen
				name='RoomActionsView'
				component={RoomActionsView}
				options={RoomActionsView.navigationOptions}
			/>
			<Chats.Screen
				name='AttachmentsView'
				component={AttachmentsView}
				options={AttachmentsView.navigationOptions}
			/>
			<Chats.Screen
				name='ThreadMessagesView'
				component={ThreadMessagesView}
				options={ThreadMessagesView.navigationOptions}
			/>
			<Chats.Screen
				name='RoomInfoView'
				component={RoomInfoView}
				options={RoomInfoView.navigationOptions}
			/>
			<Chats.Screen
				name='RoomInfoEditView'
				component={RoomInfoEditView}
			/>
			<Chats.Screen
				name='OthersProfileView'
				component={OthersProfileView}
				options={OthersProfileView.navigationOptions}
			/>
			<Chats.Screen
				name='OthersProfileBlockView'
				component={OthersProfileBlockView}
				options={OthersProfileBlockView.navigationOptions}
			/>
			<Chats.Screen
				name='OthersProfileDeleteView'
				component={OthersProfileDeleteView}
				options={OthersProfileDeleteView.navigationOptions}
			/>
			<Chats.Screen
				name='OpenSecretCardView'
				component={OpenSecretCardView}
				options={OpenSecretCardView.navigationOptions}
			/>
			<Chats.Screen
				name='AccountVerifyView'
				component={AccountVerifyView}
				options={AccountVerifyView.navigationOptions}
			/>
			<Chats.Screen
				name='ResetCardPasswordView'
				component={ResetCardPasswordView}
				options={ResetCardPasswordView.navigationOptions}
			/>
			<Chats.Screen
				name='GroupAddQRView'
				component={GroupAddQRView}
				options={GroupAddQRView.navigationOptions}
			/>
			<Chats.Screen
				name='NewCardView'
				component={NewCardView}
				options={NewCardView.navigationOptions}
			/>
			<Chats.Screen
				name='NewCardProfileView'
				component={NewCardProfileView}
			/>
			<Chats.Screen
				name='AuthenticationWebView'
				component={AuthenticationWebView}
				options={AuthenticationWebView.navigationOptions}
			/>
			<Chats.Screen
				name='ProfileView'
				component={ProfileView}
			/>
			<Chats.Screen
				name='SetBackgroundView'
				component={SetBackgroundView}
				options={SetBackgroundView.navigationOptions}
			/>
			<Chats.Screen
				name='StampManagementView'
				component={StampManagementView}
				options={StampManagementView.navigationOptions}
			/>
			<Chats.Screen
				name='StampCategoriesView'
				component={StampCategoriesView}
				options={SettingsMenuView.navigationOptions}
			/>
			<Chats.Screen
				name='StampEditView'
				component={StampEditView}
				options={StampEditView.navigationOptions}
			/>
			<Chats.Screen
				name='StampGiftView'
				component={StampGiftView}
				options={StampGiftView.navigationOptions}
			/>
			<Chats.Screen
				name='ProfileSceneAddView'
				component={ProfileSceneAddView}
				options={ProfileSceneAddView.navigationOptions}
			/>
			<Chats.Screen
				name='ProfileSceneAddDetailView'
				component={ProfileSceneAddDetailView}
				options={ProfileSceneAddDetailView.navigationOptions}
			/>
			<Chats.Screen
				name='TextSizeView'
				component={TextSizeView}
				options={TextSizeView.navigationOptions}
			/>
			<Chats.Screen
				name='PointStoreView'
				component={PointStoreView}
				options={PointStoreView.navigationOptions}
			/>
			<Chats.Screen
				name='PointPurchaseView'
				component={PointPurchaseView}
				options={SettingsMenuView.navigationOptions}
			/>
			<Chats.Screen
				name='ChatConfigView'
				component={ChatConfigView}
				options={ChatConfigView.navigationOptions}
			/>
			<Chats.Screen
				name='FaqView'
				component={FaqView}
				options={FaqView.navigationOptions}
			/>
			<Chats.Screen
				name='TermsServiceView'
				component={TermsServiceView}
				options={TermsServiceView.navigationOptions}
			/>
			<Chats.Screen
				name='AccountView'
				component={AccountView}
				options={AccountView.navigationOptions}
			/>
			<Chats.Screen
				name='DeleteAccountView'
				component={DeleteAccountView}
				options={DeleteAccountView.navigationOptions}
			/>
			<Chats.Screen
				name='GroupCardSelectView'
				component={GroupCardSelectView}
				options={GroupCardSelectView.navigationOptions}
			/>
			<Chats.Screen
				name='CreateGroupView'
				component={CreateGroupView}
			/>
			<Chats.Screen
				name='FriendsAddQRView'
				component={FriendsAddQRView}
				options={FriendsAddQRView.navigationOptions}
			/>
			<Chats.Screen
				name='QRCardSelectView'
				component={QRCardSelectView}
				options={QRCardSelectView.navigationOptions}
			/>
			<Chats.Screen
				name='QRAfterReadView'
				component={QRAfterReadView}
				options={QRAfterReadView.navigationOptions}
			/>
			<Chats.Screen
				name='QRAfterAddView'
				component={QRAfterAddView}
				options={QRAfterAddView.navigationOptions}
			/>
			{/*<Chats.Screen*/}
			{/*	name='E2EEncryptionSecurityView'*/}
			{/*	component={E2EEncryptionSecurityView}*/}
			{/*	options={E2EEncryptionSecurityView.navigationOptions}*/}
			{/*/>*/}
		</Chats.Navigator>
	);
};

// // E2ESaveYourPasswordStackNavigator
// const E2ESaveYourPasswordStack = createStackNavigator();
// const E2ESaveYourPasswordStackNavigator = () => {
// 	const { theme } = React.useContext(ThemeContext);
//
// 	return (
// 		<E2ESaveYourPasswordStack.Navigator screenOptions={{ ...defaultHeader, ...themedHeader(theme), ...StackAnimation }}>
// 			<E2ESaveYourPasswordStack.Screen
// 				name='E2ESaveYourPasswordView'
// 				component={E2ESaveYourPasswordView}
// 				options={E2ESaveYourPasswordView.navigationOptions}
// 			/>
// 			<E2ESaveYourPasswordStack.Screen
// 				name='E2EHowItWorksView'
// 				component={E2EHowItWorksView}
// 				options={E2EHowItWorksView.navigationOptions}
// 			/>
// 		</E2ESaveYourPasswordStack.Navigator>
// 	);
// };
//
// // E2EEnterYourPasswordStackNavigator
// const E2EEnterYourPasswordStack = createStackNavigator();
// const E2EEnterYourPasswordStackNavigator = () => {
// 	const { theme } = React.useContext(ThemeContext);
//
// 	return (
// 		<E2EEnterYourPasswordStack.Navigator screenOptions={{ ...defaultHeader, ...themedHeader(theme), ...StackAnimation }}>
// 			<E2EEnterYourPasswordStack.Screen
// 				name='E2EEnterYourPasswordView'
// 				component={E2EEnterYourPasswordView}
// 				options={E2EEnterYourPasswordView.navigationOptions}
// 			/>
// 		</E2EEnterYourPasswordStack.Navigator>
// 	);
// };

// DrawerNavigator
const Drawer = createDrawerNavigator();
const DrawerNavigator = () => (
	<Drawer.Navigator
		drawerContent={({ navigation, state }) => <Sidebar navigation={navigation} state={state} />}
		drawerPosition={I18nManager.isRTL ? 'right' : 'left'}
		screenOptions={{ swipeEnabled: false }}
		drawerType='back'
	>
		<Drawer.Screen name='ChatsStack' component={ChatsStack} />
	</Drawer.Navigator>
);

// InsideStackNavigator
const InsideStack = createStackNavigator();
const InsideStackNavigator = () => {
	const { theme } = React.useContext(ThemeContext);

	return (
		<InsideStack.Navigator mode='modal' screenOptions={{ ...defaultHeader, ...themedHeader(theme), ...ModalAnimation }}>
			<InsideStack.Screen
				name='DrawerNavigator'
				component={DrawerNavigator}
				options={{ headerShown: false }}
			/>
			{/*<InsideStack.Screen*/}
			{/*	name='E2ESaveYourPasswordStackNavigator'*/}
			{/*	component={E2ESaveYourPasswordStackNavigator}*/}
			{/*	options={{ headerShown: false }}*/}
			{/*/>*/}
			{/*<InsideStack.Screen*/}
			{/*	name='E2EEnterYourPasswordStackNavigator'*/}
			{/*	component={E2EEnterYourPasswordStackNavigator}*/}
			{/*	options={{ headerShown: false }}*/}
			{/*/>*/}
			<InsideStack.Screen
				name='AttachmentView'
				component={AttachmentView}
				options={{ headerShown: false }}
			/>
			<InsideStack.Screen
				name='JitsiMeetView'
				component={JitsiMeetView}
				options={{ headerShown: false }}
			/>
		</InsideStack.Navigator>
	);
};

export default InsideStackNavigator;
