import React from 'react';
import {StatusBar, FlatList, View, TouchableOpacity} from 'react-native';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import I18n from '../../i18n';
import { withTheme } from '../../theme';
import { themes } from '../../constants/colors';
import { getUserSelector } from '../../selectors/login';
import SafeAreaView from '../../containers/SafeAreaView';
import Video from './Video';
import Image from './Image';
import styles from './styles';
import { formatAttachmentUrl } from "../../lib/utils";
import openLink from "../../utils/openLink";
import { isTypeSupported } from "../../utils/media";
import AttachmentActions from "../../containers/AttachmentActions";
import RocketChat from "../../lib/rocketchat";
import { showToast } from "../../utils/info";
import { isEqual } from 'lodash';

class AttachmentsView extends React.Component {
    static navigationOptions = ({ route }) => {
        const title = route.params?.title;
         return {
            title: title??I18n.t('Files')
        };
    };

    static propTypes = {
        navigation: PropTypes.object,
        route: PropTypes.object,
        theme: PropTypes.string,
        baseUrl: PropTypes.string,
        user: PropTypes.shape({
            id: PropTypes.string,
            token: PropTypes.string
        }),
        customEmojis: PropTypes.array,
    }

    constructor(props) {
        super(props);
        this.mounted = false;
        const message = props.route.params?.message;
        const card = props.route.params?.card;
        this.state = { message, card };
        if(message && message.observe){
            this.messageObjservable = message.observe();
            this.message = this.messageObjservable
                .subscribe((changes) => {
                    if(this.mounted){
                        this.setState({ message: changes });
                    } else {
                        this.state.message = changes;
                    }
                })
        }
    }

    componentDidMount() {
        this.mounted = true;
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        const { message } = this.state;
        const { navigation } = this.props;
        console.log('message updated');
        const attachments = message.attachments.filter(file => file.video_url || file.image_url);
        if(attachments.length < 2){
            navigation.pop();
        }
    }

    onPressItem = (file) => {
        const { navigation, user, baseUrl } = this.props;
        const uri = formatAttachmentUrl(file.video_url || file.image_url, user.id, user.token, baseUrl);
        if (file.video_url && !isTypeSupported(file.video_type)) {
            return openLink(uri, theme);
        }
        navigation.navigate('AttachmentView', { attachment: file, uri });
    }

    onLongPressItem = (file) => {
        const { message, card } = this.state;
        if(card._id === message.c._id){
            this.attachmentActions?.showAttachmentActions(file.title_link);
        }
    }

    handleDelete = async(fileLink) => {
        try{
            const { message, card } = this.state;
            const { id: messageId } = message;
            await RocketChat.deleteAttachment(messageId, card._id, fileLink);
        } catch (e) {
            showToast(I18n.t('error-delete-attachment'));
        }
    }

    renderItem = ({ item, index }) => {
        const { user, baseUrl, theme } = this.props;

        if(item.video_url){
            return (
                <TouchableOpacity onPress={() => this.onPressItem(item)} onLongPress={() => this.onLongPressItem(item)} style={styles.itemContainer}>
                    <Video
                        key={index}
                        file={item}
                        user={user}
                        baseUrl={baseUrl}
                        theme={theme}
                    />
                </TouchableOpacity>
            )
        } else if (item.image_url){
            return (
                <TouchableOpacity onPress={() => this.onPressItem(item)} onLongPress={() => this.onLongPressItem(item)}  style={styles.itemContainer}>
                    <Image
                        key={index}
                        file={item}
                        user={user}
                        baseUrl={baseUrl}
                        theme={theme}
                        />
                </TouchableOpacity>
            )
        }
        return null;
    }

    render() {
        const { message } = this.state;
        const { theme } = this.props;
        const attachments = message.attachments.filter(file => file.video_url || file.image_url);

        return (
            <SafeAreaView style={[styles.container, { backgroundColor: themes[theme].backgroundColor }]}>
                <StatusBar />
                <FlatList
                    data={attachments}
                    styl={styles.list}
                    renderItem={this.renderItem}
                />
                <AttachmentActions
                    ref={ref => this.attachmentActions = ref}
                    onDelete={this.handleDelete}
                    />
            </SafeAreaView>
        );
    }
}

const mapStateToProps = state => ({
    baseUrl: state.server.server,
    user: getUserSelector(state)
});

export default connect(mapStateToProps)(withTheme(AttachmentsView));
