import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {isEqual} from 'lodash';
import Header from './Header';
import {withTheme} from '../../../theme';


class RoomsListHeaderView extends Component {
    static propTypes = {
        navigation: PropTypes.object,
        baseUrl: PropTypes.string,
        user: PropTypes.shape({
            id: PropTypes.string,
            username: PropTypes.string,
            token: PropTypes.string
        }),
        selected: PropTypes.object,
        selectAll: PropTypes.bool,
        connecting: PropTypes.bool,
        connected: PropTypes.bool,
        isFetching: PropTypes.bool,
        theme: PropTypes.string
    };

    onPress = () => {
        const { navigation } = this.props;
        navigation.toggleDrawer();
    }

    render() {
        const {
            selected, selectAll, connecting, isFetching, connected, navigation, baseUrl, user, theme
        } = this.props;

        return (
            <Header
                theme={theme}
                selected={selected}
                selectAll={selectAll}
                connecting={connecting}
                isFetching={isFetching}
                connected={connected}
                onPress={this.onPress}
                baseUrl={baseUrl}
                user={user}
            />
        );
    }
}


const mapStateToProps = (state) => ({
    baseUrl: state.settings.Site_Url || state.server ? state.server.server : '',
    user: {
        id: state.login.user && state.login.user.id,
        username: state.login.user && state.login.user.username,
        token: state.login.user && state.login.user.token
    },
    connecting: state.meteor.connecting || state.server.loading,
    connected: state.meteor.connected,
    isFetching: state.rooms.isFetching,
    selected: state.cards && state.cards.selected,
    selectAll: state.cards && state.cards.selectAll
});


export default connect(mapStateToProps, null)(withTheme(RoomsListHeaderView));
