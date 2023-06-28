import { Button, ButtonGroup, Icon } from '@rocket.chat/fuselage';
import React from 'react';

import Page from '../../../components/Page';
import VerticalBar from '../../../components/VerticalBar';
import { useTranslation } from '../../../contexts/TranslationContext';
import { useRouteParameter, useRoute } from '../../../contexts/RouterContext';
import { CardInfoWithData } from './CardInfo';
import CardsTable from './CardsTable';

function CardsPage() {
	const t = useTranslation();

	const usersRoute = useRoute('admin-cards');

	const handleVerticalBarCloseButtonClick = () => {
		usersRoute.push({});
	};

	const context = useRouteParameter('context');
	const id = useRouteParameter('id');

	return <Page flexDirection='row'>
		<Page>
			<Page.Header title={t('Cards')}/>
			<Page.Content>
				<CardsTable />
			</Page.Content>
		</Page>
		{context && <VerticalBar>
			<VerticalBar.Header>
				{context === 'info' && t('Card_Info')}
				<VerticalBar.Close onClick={handleVerticalBarCloseButtonClick} />
			</VerticalBar.Header>

			{context === 'info' && <CardInfoWithData id={id}/>}
		</VerticalBar>}
	</Page>;
}

export default CardsPage;
