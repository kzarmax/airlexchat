import React from 'react';
import PropTypes from 'prop-types';

import DropdownItem from './DropdownItem';
import { FILTER } from '../filters';
import I18n from '../../../i18n';
import {isIOS} from "../../../utils/deviceInfo";
import {themes} from "../../../constants/colors";
import {withTheme} from "../../../theme";

const DropdownItemHeader = ({ currentFilter, theme, onPress }) => {
	let text;
	switch (currentFilter) {
		case FILTER.FOLLOWING:
			text = I18n.t('Threads_displaying_following');
			break;
		case FILTER.UNREAD:
			text = I18n.t('Threads_displaying_unread');
			break;
		default:
			text = I18n.t('Threads_displaying_all');
			break;
	}
	return <DropdownItem text={text} iconName='filter' onPress={onPress} contentStyle={{ backgroundColor: isIOS ? '#fff' : '#54585E' }} textStyle={{ color: themes[theme].auxiliaryText }}/>;
};

DropdownItemHeader.propTypes = {
	currentFilter: PropTypes.string,
	theme: PropTypes.string,
	onPress: PropTypes.func
};

export default withTheme(DropdownItemHeader);
