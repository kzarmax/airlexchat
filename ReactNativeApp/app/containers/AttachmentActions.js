import { useImperativeHandle, forwardRef } from 'react';
import PropTypes from 'prop-types';

import { useActionSheet } from './ActionSheet';
import I18n from '../i18n';

const AttachmentActions = forwardRef(({ onDelete }, ref) => {
	const { showActionSheet } = useActionSheet();

	const handleDelete = (fileLink) => {
		onDelete(fileLink);
	};

	const showAttachmentActions = (file) => {
		showActionSheet({
			options: [
				{
					title: I18n.t('Delete'),
					icon: 'delete',
					danger: true,
					onPress: () => handleDelete(file)
				}
			],
			hasCancel: false
		});
	};

	useImperativeHandle(ref, () => ({
		showAttachmentActions
	}));
});
AttachmentActions.propTypes = {
	message: PropTypes.object,
	tmid: PropTypes.string
};

export default AttachmentActions;
