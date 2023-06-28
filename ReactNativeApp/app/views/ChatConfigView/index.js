import React from 'react';
import PropTypes from 'prop-types';
import {　FlatList, Text, TouchableOpacity, View　} from 'react-native';
import { connect } from 'react-redux';

import I18n from '../../i18n';
import styles from './styles';
import { withTheme } from '../../theme';
import equal from 'deep-equal';
import {　themes　} from '../../constants/colors';
import Button from "../../containers/Button";
import Avatar from "../../containers/Avatar";
import {　VectorIcon　} from "../../presentation/VectorIcon";
import {Q} from "@nozbe/watermelondb";
import database from "../../lib/database";
import RocketChat from "../../lib/rocketchat";
import ActivityIndicator from "../../containers/ActivityIndicator";
import {showToast} from "../../utils/info";
import {setCards as setCardsAction} from "../../actions/cards";
import {OPTION_CHAT, OPTION_PHONE, OPTION_VIDEO} from "../../constants/messagesStatus";

class ChatConfigView extends React.Component {
    static navigationOptions = ({ navigation }) => ({
        title: I18n.t('Chat_Config')
    })

    static propTypes = {
        selectAll: PropTypes.bool,
        selected: PropTypes.object,
        setCards: PropTypes.func,
        navigation: PropTypes.object,
        theme: PropTypes.string
    };

    constructor(props) {
        super(props);
        this.mounted = false;
        this.state = {
            users: [],
            saving: false,
            loading: true,
            changed: false,
            disabledOption: {}
        }
        this.init();
    }

    shouldComponentUpdate(nextProps, nextState) {
        const { theme } = this.props;
        const { users, saving, loading, changed, disabledOption } = this.state;

        if(!equal(nextState.users, users)){
            return true;
        }
        if(!equal(nextState.disabledOption, disabledOption)){
            return true;
        }
        if(nextState.saving !== saving || nextState.loading !== loading || nextState.changed !== changed){
            return true;
        }
        return theme !== nextProps.theme;
    }

    componentDidMount() {
        this.mounted = true;
    }

    init = async () => {

        const {
            selected
        } = this.props;

        const db = database.active;

        let directRooms = [];
        if(selected) {
            directRooms = await db.collections
                .get('subscriptions')
                .query(
                    Q.where('archived', false),
                    Q.where('open', true),
                    Q.where('t', 'd'),
                    Q.where('cardId', selected._id)
                )
                .fetch();
        }

        const users = directRooms.map(r => ({
                _id: r.o._id,
                username: r.o.username
            })
        );

        if(this.mounted){
            this.setState({ users, disabledOption: selected.disabledOption??{}, loading: false });
        } else {
            this.state.users = users;
            this.state.disabledOption = selected.disabledOption??{};
            this.state.loading = false;
        }
    }

    keyExtractor = item => item._id;

    getScrollRef = ref => this.scroll = ref;

    renderSeparator = () => <View style={styles.separator} />;

    onPurchase = (profile) => {
        const { navigation } = this.props;
        navigation.navigate('PointPurchaseView', {profile});
    };

    toggleOption = (_id, type) => {
        const { selected } = this.props;
        const { disabledOption } = this.state;

        let newDisabledOption = Object.assign({}, disabledOption);
        const disabledOptions = newDisabledOption[_id]??[];
        if(disabledOptions.includes(type)){
            newDisabledOption[_id] = disabledOptions.filter(option => option !== type)
            if(!newDisabledOption[_id].length){
                delete newDisabledOption[_id];
            }
        } else {
            newDisabledOption[_id] = [ ...disabledOptions, type ];
        }

        this.setState({ disabledOption: newDisabledOption, changed: !equal(selected.disabledOption??{}, newDisabledOption) });
    }

    onSubmit = async () => {
        const { selected, setCards } = this.props;
        const { disabledOption } = this.state;
        this.setState({ saving: true });
        try{
            const params = {
                cardId: selected._id,
                disabledOption: disabledOption,
            };
            const req = await RocketChat.updateCard(params);
            if (req.success) {
                await setCards(req.cards);
            }
            showToast(I18n.t('Set_Chat_Config_Success'));
        } catch (e) {
            showToast(I18n.t('Set_Chat_Config_Failure'));
        }
        this.setState({ saving: false });
    }

    // 1項目の表示内容設定
    renderItem = ({ item, index }) => {
        const { theme } = this.props;
        const { disabledOption } = this.state;
        const disabledOptions = disabledOption[item._id]??[];

        return (
            <View style={styles.itemContainer}>
                <View style={styles.userContainer}>
                    <Avatar
                        style={styles.avatar}
                        text={item._id}
                        size={48}
                        borderRadius={24}
                        type='ca'
                    />
                    <Text style={[styles.userName, { color: themes[theme].titleText }]} ellipsizeMode={'tail'} numberOfLines={1}>{ item.username }</Text>
                </View>
                <View style={styles.options}>
                    <TouchableOpacity
                        style={ styles.optionBtn }
                        onPress={() => this.toggleOption(item._id, OPTION_CHAT)}
                        testID='onPurchase'
                    >
                        {
                            !disabledOptions.includes(OPTION_CHAT)?
                                <VectorIcon type={'MaterialCommunityIcons'} name={'message-bulleted'} size={26} color={ themes[theme].titleText } />
                                :
                                <VectorIcon type={'MaterialCommunityIcons'} name={'message-bulleted-off'} size={26} color={ themes[theme].infoText } />
                        }
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={ styles.optionBtn }
                        onPress={() => this.toggleOption(item._id, OPTION_PHONE)}
                        testID='onPurchase'
                    >
                        {
                            !disabledOptions.includes(OPTION_PHONE)?
                                <VectorIcon type={'FontAwesome5'} name={'phone'} size={22} color={themes[theme].titleText} />
                                :
                                <VectorIcon type={'FontAwesome5'} name={'phone-slash'} size={22} color={themes[theme].infoText} />
                        }
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={ styles.optionBtn }
                        onPress={() => this.toggleOption(item._id, OPTION_VIDEO)}
                        testID='onPurchase'
                    >
                        {
                            !disabledOptions.includes(OPTION_VIDEO)?
                                <VectorIcon type={'FontAwesome5'} name={'video'} size={22} color={themes[theme].titleText} />
                                :
                                <VectorIcon type={'FontAwesome5'} name={'video-slash'} size={22} color={themes[theme].infoText} />
                        }
                    </TouchableOpacity>
                </View>
            </View>
        );
    }


    render(){
        const { theme } = this.props;
        const { users, changed, loading, saving } = this.state;

        return (
            <View style={{ ...styles.container, backgroundColor: themes[theme].backgroundColor }} testID='chat-config-container'>
                <View style={styles.headerContainer}>
                    <Text style={{ ...styles.headerTitle, color: themes[theme].bodyText }}>{I18n.t('Chat_Config_Description')}</Text>
                </View>
                {
                    users.length?
                        <FlatList
                            ref={this.getScrollRef}
                            data={users}
                            extraData={this.state}
                            keyExtractor={this.keyExtractor}
                            style={styles.list}
                            renderItem={this.renderItem}
                            ItemSeparatorComponent={this.renderSeparator}
                            enableEmptySections
                            removeClippedSubviews
                        />
                        :
                        <Text style={ styles.emptyText }>{I18n.t('No_friends')}</Text>
                }
                <View style={styles.buttons}>
                    <Button
                        disabled={!changed}
                        loading={saving}
                        onPress={this.onSubmit}
                        testID='sidebar-toggle-status'
                        type='done'
                        text={I18n.t('Done')}
                        size='w'
                        theme={theme}
                    />
                </View>
                { loading && <ActivityIndicator theme={theme} /> }
            </View>
        );
    }
}


const mapStateToProps = state => ({
    selected: state.cards && state.cards.selected,
    selectAll: state.cards && state.cards.selectAll
});
const mapDispatchToProps = dispatch => ({
    setCards: cards => dispatch(setCardsAction(cards)),
});

export default connect(mapStateToProps, mapDispatchToProps)(withTheme(ChatConfigView));
