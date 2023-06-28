import React from 'react';

import { usePermission } from '../../../contexts/AuthorizationContext';
import NotAuthorizedPage from '../../../components/NotAuthorizedPage';
import CardsPage from './CardsPage';

function CardsRoute() {
	const canViewUserAdministration = usePermission('view-user-administration');

	if (!canViewUserAdministration) {
		return <NotAuthorizedPage />;
	}

	return <CardsPage />;
}

export default CardsRoute;
