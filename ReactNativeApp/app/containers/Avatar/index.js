import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import {isEqual} from 'lodash';

import database from '../../lib/database';
import { getUserSelector } from '../../selectors/login';
import Avatar from './Avatar';

class AvatarContainer extends React.Component {
	static propTypes = {
		rid: PropTypes.string,
		text: PropTypes.string,
		type: PropTypes.string,
		blockUnauthenticatedAccess: PropTypes.bool,
	};

	static defaultProps = {
		text: '',
		type: 'd'
	};

	constructor(props) {
		super(props);
		this.mounted = false;
		this.state = { avatarETag: '' };
		this.init();
	}

	componentDidMount() {
		this.mounted = true;
	}

	componentDidUpdate(prevProps) {
		if (!isEqual(prevProps, this.props)) {
			this.init();
		}
	}

	componentWillUnmount() {
		if (this.subscription?.unsubscribe) {
			this.subscription.unsubscribe();
		}
	}

	get isCard() {
		const { type } = this.props;
		return type === 'ci' || type === 'ca';
	}

	get isGroup() {
		const { type } = this.props;
		return type === 'p';
	}

	init = async() => {
		if (this.subscription?.unsubscribe) {
			this.subscription.unsubscribe();
		}

		const db = database.active;

		let record;
		try {
			if (this.isCard) {
				const { text } = this.props;
				const cardsCollection = db.collections.get('cards');
				record= await cardsCollection.find(text);
			} else if(this.isGroup) {
				const { rid } = this.props;
				const subsCollection = db.collections.get('subscriptions');
				record = await subsCollection.find(rid);
			}
		} catch {
			// Record not found
		}

		if (record) {
			const observable = record.observe();
			this.subscription = observable.subscribe((r) => {
				const { avatarETag } = r;
				if (this.mounted) {
					this.setState({ avatarETag });
				} else {
					this.state.avatarETag = avatarETag;
				}
			});
		}
	}

	render() {
		const { avatarETag } = this.state;
		return (
			<Avatar
				avatarETag={avatarETag}
				{...this.props}
			/>
		);
	}
}

const mapStateToProps = state => ({
	user: getUserSelector(state),
	server: state.share.server.server || state.server.server,
	blockUnauthenticatedAccess:
		state.share.settings?.Accounts_AvatarBlockUnauthenticatedAccess
		?? state.settings.Accounts_AvatarBlockUnauthenticatedAccess
		?? true
});
export default connect(mapStateToProps)(AvatarContainer);
