import React from 'react';
import { Text } from 'react-native';
import PropTypes from 'prop-types';

import styles from './styles';
import { themes } from '../../constants/colors';
import { capitalize } from '../../utils/room';

const UpdatedAt = React.memo(({
	date, theme, hideUnreadStatus, alert, testID
}) => {
	if (!date || testID.indexOf('friends-list-view') === 0) {
		return null;
	}
	return (
		<Text
			style={[
				styles.date,
				{
					color:
						themes[theme]
							.auxiliaryText
				},
				alert && !hideUnreadStatus && [
					styles.updateAlert,
					{
						color:
							themes[theme]
								.bodyText
					}
				]
			]}
			ellipsizeMode='tail'
			numberOfLines={1}
		>
			{capitalize(date)}
		</Text>
	);
});

UpdatedAt.propTypes = {
	date: PropTypes.string,
	theme: PropTypes.string,
	hideUnreadStatus: PropTypes.bool,
	alert: PropTypes.bool,
	testID: PropTypes.string
};

export default UpdatedAt;
