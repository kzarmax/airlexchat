import { registerAdminSidebarItem } from '../../../../client/views/admin';
import { hasPermission } from '../../../authorization';

registerAdminSidebarItem({
	href: 'point-profile',
	i18nLabel: 'Point_Profiles',
	icon: 'card',
	permissionGranted() {
		return hasPermission('manage-point-profile');
	},
});
