import React from 'react';
import PropTypes from 'prop-types';
import {
    Text,
    Alert,
    SafeAreaView,
    View,
    TouchableOpacity
} from 'react-native';
import { connect } from 'react-redux';
import _ from 'lodash';

import {leaveRoom as leaveRoomAction, deleteRoom as deleteRoomAction} from '../../actions/room';
import * as List from '../../containers/List';
import RocketChat from '../../lib/rocketchat';
import log, {logEvent} from '../../utils/log';
import I18n from '../../i18n';
import StatusBar from '../../containers/StatusBar';
import {themes} from '../../constants/colors';
import {getUserSelector} from '../../selectors/login';
import {withTheme} from "../../theme";
import * as events from "events";
import Modal from "react-native-modal";
import styles from "./styles";
import {CustomIcon} from "../../lib/Icons";
import Avatar from "../../containers/Avatar";

class RoomActionsView extends React.Component {
    static navigationOptions = ({}) => ({
        title: I18n.t('talk_settings')
    });

    static propTypes = {
        baseUrl: PropTypes.string,
        navigation: PropTypes.object,
        user: PropTypes.shape({
            id: PropTypes.string,
            token: PropTypes.string
        }),
        leaveRoom: PropTypes.func,
        deleteRoom: PropTypes.func,
        jitsiEnabled: PropTypes.bool,
        theme: PropTypes.string
    };

    constructor(props) {
        super(props);
        this.mounted = false;
        const room = props.route.params?.room;
        this.rid = props.route.params?.rid;
        this.cardId = props.route.params?.cardId;
        this.t = props.route.params?.t;

        this.state = {
            room: room || {rid: this.rid, cardId: this.cardId, t: this.t},
            membersCount: 0,
            member: {},
            joined: !!room,
            canViewMembers: false,
            canAddUser: false,
            canInviteUser: false,
            isVisibleCallModal: false
        };

        if (room && room.observe && room.rid) {
            this.roomObservable = room.observe();
            this.subscription = this.roomObservable
                .subscribe((changes) => {
                    if (this.mounted) {
                        this.setState({room: changes});
                    } else {
                        this.state.room = changes;
                    }
                });
        }
    }

    async componentDidMount() {
        this.mounted = true;
        const { room, member } = this.state;
        if (room.rid) {
            if (room && room.t !== 'd' && this.canViewMembers()) {
                try {
                    const counters = await RocketChat.getRoomCounters(room.rid, this.cardId, room.t);
                    if (counters.success) {
                        this.setState({ membersCount: counters.members, joined: counters.joined });
                    }
                } catch (e) {
                    log(e);
                }
            } else if (room.t === 'd' && _.isEmpty(member)) {
                this.updateRoomMember();
            }

            this.canAddUser();
            this.canInviteUser();
        }
    }

    componentWillUnmount() {
        if (this.subscription && this.subscription.unsubscribe) {
            this.subscription.unsubscribe();
        }
    }

    updateRoomMember = async() => {
        const { room } = this.state;
        const { rid, cardId } = room;
        // const { user } = this.props;

        try {
            const member = await RocketChat.getRoomMember(rid, cardId);
            this.setState({ member: member || {} });
        } catch (e) {
            log(e);
            this.setState({ member: {} });
        }
    }

    // eslint-disable-next-line react/sort-comp
    canAddUser = async() => {
        const { room, joined } = this.state;
        const { adhoc } = room;
        let canAdd = false;

        // const userInRoom = joined;
        // const permissions = await RocketChat.hasPermission(['add-user-to-joined-room', 'add-user-to-any-c-room', 'add-user-to-any-p-room'], rid);
        //
        // if (permissions) {
        //     if (userInRoom && permissions['add-user-to-joined-room']) {
        //         canAdd = true;
        //     }
        //     if (t === 'c' && permissions['add-user-to-any-c-room']) {
        //         canAdd = true;
        //     }
        //     if (t === 'p' && permissions['add-user-to-any-p-room']) {
        //         canAdd = true;
        //     }
        // }

        // 制限グループの場合はメンバー追加できない
        if (adhoc)
            canAdd = false;
        else
            canAdd = true;

        this.setState({ canAddUser: canAdd });
    }

    canInviteUser = async() => {
        const { room } = this.state;
        const { rid } = room;
        const permissions = await RocketChat.hasPermission(['create-invite-links'], rid);

        const canInviteUser = permissions && permissions['create-invite-links'];
        this.setState({ canInviteUser });
    }

    canViewMembers = async() => {
        const { room } = this.state;
        const { rid, t, broadcast } = room;
        if (broadcast) {
            const viewBroadcastMemberListPermission = 'view-broadcast-member-list';
            const permissions = await RocketChat.hasPermission([viewBroadcastMemberListPermission], rid);
            if (!permissions[viewBroadcastMemberListPermission]) {
                return false;
            }
        }

        // This method is executed only in componentDidMount and returns a value
        // We save the state to read in render
        const result = (t === 'c' || t === 'p');
        this.setState({ canViewMembers: result });
        return result;
    }

    onPressTouchable = (item) => {
        const { route, event, params } = item;
        if (route) {
            logEvent(events[`RA_GO_${ route.replace('View', '').toUpperCase() }${ params.name ? params.name.toUpperCase() : '' }`]);
            const { navigation } = this.props;
            navigation.navigate(route, params);
        }
        if (event) {
            return event();
        }
    }

    toggleBlockUser = async () => {
        const {room} = this.state;
        const {rid, cardId, blocker} = room;
        const {member} = this.state;
        try {
            await RocketChat.toggleBlockUser(rid, cardId, member._id, !blocker);
        } catch (e) {
            Alert.alert(I18n.t('Oops'), I18n.t('err_toggle_block_user'));
        }
    }

    leaveChannel = () => {
        const {room} = this.state;
        const {leaveRoom} = this.props;

        Alert.alert(
            I18n.t('Are_you_sure_question_mark'),
            I18n.t('Are_you_sure_you_want_to_leave_the_room', {room: room.t === 'd' ? room.fname : room.name}),
            [
                {
                    text: I18n.t('Cancel'),
                    style: 'cancel'
                },
                {
                    text: I18n.t('Yes_action_it', {action: I18n.t('leave')}),
                    style: 'destructive',
                    onPress: () => leaveRoom(room.rid, room.t, room.cardId)
                }
            ]
        );
    }

    deleteRoom = () => {
        const {room} = this.state;
        const {deleteRoom} = this.props;

        Alert.alert(
            I18n.t('Are_you_sure_question_mark'),
            I18n.t('Are_you_sure_you_want_to_erase_the_room', {room: room.t === 'd' ? room.fname : room.name}),
            [
                {
                    text: I18n.t('Cancel'),
                    style: 'cancel'
                },
                {
                    text: I18n.t('Yes_action_it', {action: I18n.t('Delete')}),
                    style: 'destructive',
                    onPress: () => deleteRoom(room.rid, room.t, room.cardId)
                }
            ]
        );
    }

    toggleNotifications = async () => {
        const {room} = this.state;
        try {
            const notifications = {
                mobilePushNotifications: room.notifications ? 'nothing' : 'default'
            };
            await RocketChat.saveNotificationSettings(room.rid, room.cardId, notifications);
        } catch (e) {
            log(e);
        }
    }

    renderJitsi = () => {
        const { jitsiEnabled, theme } = this.props;
        if (!jitsiEnabled) {
            return null;
        }
        return (
            <List.Section>
                <List.Separator/>
                <List.Item
                    title='Call'
                    onPress={() => this.setState({ isVisibleCallModal: true })}
                    testID='room-actions-voice'
                    left={() => <List.Icon name='phone' color={themes[theme].bodyText}/>}
                    showActionIndicator
                />
                <List.Separator/>
            </List.Section>
        );
    }

    onJitsiCall = async (isOnlyVoice = false) => {
        const {room} = this.state;
        this.setState({ isVisibleCallModal: false });
        await RocketChat.callJitsi(room?.rid, this.cardId, isOnlyVoice);
    }

    renderCallModal = () => {
        const { isVisibleCallModal, room } = this.state;
        const { theme } = this.props;
        return (
            <Modal
                isVisible={isVisibleCallModal}
                style={styles.modal}
                animationIn='fadeIn'
                animationOut='fadeOut'
                onBackdropPress={() => this.setState({ isVisibleCallModal: false })}
                onBackButtonPress={() => this.setState({ isVisibleCallModal: false })}
                useNativeDriver
                hideModalContentWhileAnimating
                avoidKeyboard
            >
                <View style={{ ...styles.container, backgroundColor: themes[theme].modalBackground }}>
                    <View style={styles.avatarContainer}>
                        <Avatar
                            text={room.name}
                            size={72}
                            borderRadius={36}
                            style={styles.avatar}
                            type={room.t}
                            rid={room.rid}
                        />
                        <Text style={{ ...styles.roomName, color: themes[theme].bodyText }} key='calling-room-name'  numberOfLines={2} ellipsizeMode={'tail'}>{room.name}</Text>
                    </View>
                    <View style={styles.buttonsContainer}>
                        <TouchableOpacity
                            onPress={() => this.onJitsiCall(true)}
                            style={{ width: '50%' }}
                            theme={theme}
                        >
                            <View style={styles.buttonContainer}>
                                <CustomIcon name={'phone'} size={40} color={themes[theme].bodyText}/>
                                <Text style={[styles.buttonText, { color: themes[theme].bodyText }]}>{I18n.t(`Voice_calling`)}</Text>
                            </View>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => this.onJitsiCall(false)}
                            style={{ width: '50%' }}
                            theme={theme}
                        >
                            <View style={styles.buttonContainer}>
                                <CustomIcon name={'camera'} size={40} color={themes[theme].bodyText}/>
                                <Text style={[styles.buttonText, { color: themes[theme].bodyText }]}>{I18n.t(`Video_calling`)}</Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        );
    }

    renderRoomInfo = () => {
        const { room, joined, membersCount, canAddUser } = this.state;
        const { theme } = this.props;
        const { rid, t, cardId, isOwner } = room;

        if (!joined || t === 'l') {
            return null;
        }

        if (t === 'd') {
            return (
                <List.Section>
                    <List.Separator/>
                    <List.Item
                        title={'Profile'}
                        onPress={() => this.onPressTouchable({
                            route: 'OthersProfileView',
                            params: {rid, cardId, room}
                        })}
                        testID='others-profile-files'
                        left={() => <List.Icon name='team' color={themes[theme].bodyText}/>}
                        showActionIndicator
                    />
                    <List.Separator/>
                </List.Section>
            );
        }

        if (t === 'p' || t === 'c') {
            return (
                <List.Section>
                    <List.Separator/>
                    <List.Item
                        title={'Group_profile'}
                        onPress={() => this.onPressTouchable({
                            route: 'RoomInfoView',
                            params: {rid, cardId, isOwner, room}
                        })}
                        testID='room-actions-members'
                        left={() => <List.Icon name='team' color={themes[theme].bodyText}/>}
                        right={() => <Text style={{ color: themes[theme].auxiliaryText}}>{membersCount>0?`${I18n.t('N_users', { n: membersCount })}`:null}</Text>}
                        showActionIndicator
                    />
                    {
                        canAddUser ?
                            [
                                <List.Separator/>,
                                <List.Item
                                    title='Add_User_In_Group'
                                    onPress={() =>
                                        this.onPressTouchable(
                                            {
                                                route: 'GroupAddQRView',
                                                params: {
                                                    rid, nextActionID: 'ADD_USER', title: I18n.t('Add_User_In_Group')
                                                }
                                            })
                                    }
                                    testID='room-actions-add-user'
                                    left={() => <List.Icon name='user-add' color={themes[theme].bodyText}/>}
                                    showActionIndicator
                                />
                            ] : null
                    }
                    <List.Separator/>
                </List.Section>
            );
        }
    }

    renderRoomSection = () => {
        const {room} = this.state;
        const {theme} = this.props;
        const {
            notifications
        } = room;
        return (
            <List.Section>
                <List.Separator/>
                <List.Item
                    title={`${notifications ? 'Disable' : 'Enable'}_notifications`}
                    onPress={() => this.onPressTouchable({
                        event: this.toggleNotifications
                    })}
                    testID='room-actions-notifications'
                    left={() => <List.Icon name={notifications ? 'notification' : 'notification-disabled'} color={themes[theme].bodyText}/>}
                />
                <List.Separator/>
            </List.Section>
        );
    }

    renderLastSection = () => {
        const {room, joined} = this.state;
        const {theme} = this.props;
        const {t, blocker, isOwner} = room;

        if (!joined || t === 'l') {
            return null;
        }

        if (t === 'd') {
            return (
                <List.Section>
                    <List.Separator/>
                    <List.Item
                        title={`${blocker ? 'Unblock' : 'Block'}_user`}
                        onPress={() => this.onPressTouchable({
                            event: this.toggleBlockUser
                        })}
                        testID='room-actions-block-user'
                        left={() => <List.Icon name='ignore' color={themes[theme].dangerColor}/>}
                        color={themes[theme].dangerColor}
                    />
                    <List.Separator/>
                    <List.Item
                        title={`Delete_Room`}
                        onPress={() => this.onPressTouchable({
                            event: this.deleteRoom
                        })}
                        testID='room-actions-erase-user'
                        left={() => <List.Icon name='delete' color={themes[theme].dangerColor}/>}
                        color={themes[theme].dangerColor}
                    />
                    <List.Separator/>
                </List.Section>
            );
        }

        if (t === 'p' || t === 'c') {
            return (
                <List.Section>
                    <List.Separator/>
                    {
                        isOwner ?
                            <List.Item
                                title='Delete_Room'
                                onPress={() => this.onPressTouchable({
                                    event: this.deleteRoom
                                })}
                                testID='room-actions-delete-room'
                                left={() => <List.Icon name='delete' color={themes[theme].dangerColor}/>}
                                color={themes[theme].dangerColor}
                            />
                            :
                            <List.Item
                                title='Leave_channel'
                                onPress={() => this.onPressTouchable({
                                    event: this.leaveChannel
                                })}
                                testID='room-actions-leave-channel'
                                left={() => <List.Icon name='logout' color={themes[theme].dangerColor}/>}
                                color={themes[theme].dangerColor}
                            />
                    }
                    <List.Separator/>
                </List.Section>
            );
        }
    }

    render() {
        const {theme} = this.props;
        return (
            <SafeAreaView testID='room-actions-view' style={{ flex: 1, backgroundColor: themes[theme].auxiliaryBackground }}>
                <StatusBar/>
                <List.Container>
                    {this.renderRoomInfo()}
                    {this.renderJitsi()}
                    {this.renderRoomSection()}
                    {this.renderLastSection()}
                </List.Container>
                {this.renderCallModal()}
            </SafeAreaView>
        );
    }
}

const mapStateToProps = state => ({
    user: getUserSelector(state),
    baseUrl: state.server.server,
    jitsiEnabled: state.settings.Jitsi_Enabled || true
});

const mapDispatchToProps = dispatch => ({
    leaveRoom: (rid, t, cardId) => dispatch(leaveRoomAction(rid, t, cardId)),
    deleteRoom: (rid, t, cardId) => dispatch(deleteRoomAction(rid, t, cardId))
});

export default connect(mapStateToProps, mapDispatchToProps)(withTheme(RoomActionsView));
