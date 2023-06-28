import React, { useMemo, useState, useCallback } from 'react';
import { Button, Icon, Box, Scrollable } from '@rocket.chat/fuselage';
import { useDebouncedValue, useMediaQuery } from '@rocket.chat/fuselage-hooks';

import { usePermission } from '../../../contexts/AuthorizationContext';
import { useTranslation } from '../../../contexts/TranslationContext';
import Page from '../../../components/Page';
import VerticalBar from '../../../components/VerticalBar';
import NotAuthorizedPage from '../../../components/NotAuthorizedPage';
import { PointProfile } from './PointProfile';
import { PointPurchaseHistory } from './PointPurchaseHistory';
import { EditPointProfileWithData } from './EditPointProfile';
import { AddPointProfile } from './AddPointProfile';
import { useRoute, useRouteParameter } from '../../../contexts/RouterContext';
import { useEndpointData } from '../../../hooks/useEndpointData';

export default function PointProfileRoute({ props }) {
	const t = useTranslation();
	const canManagePointProfile = usePermission('manage-point-profile');

	const routeName = 'point-profile';

	const [sort, setSort] = useState(['points', 'desc']);

	const [column, direction] = useDebouncedValue(sort, 500);
	const query = useMemo(() => ({
		query: JSON.stringify({}),
		sort: JSON.stringify({ [column]: direction === 'asc' ? 1 : -1 }),
	}), [column, direction]);

	const { value:data, reload } = useEndpointData('point-profile.all', query);

	const [hparams, setHparams] = useState({ text: '', current: 0, itemsPerPage: 25 });
	const [hsort, setHSort] = useState(['purchased_at', 'desc']);

	const { text } = useDebouncedValue(hparams, 500);
	const [ hcolumn, hdirection] = useDebouncedValue(hsort, 500);

	const hquery = useMemo(() => ({
		query: JSON.stringify({ $or: [{ email: { $regex: text || '', $options: 'i' }}, { username: { $regex: text || '', $options: 'i' }}] }),
		sort: JSON.stringify({ [hcolumn]: hdirection === 'asc' ? 1 : -1 }),
	}), [text, hcolumn, hdirection]);
	const { value: historyData, reload: reloadHistory } = useEndpointData('point-purchase-history.all', hquery);

	const router = useRoute(routeName);

	const context = useRouteParameter('context');
	const id = useRouteParameter('id');

	const onClick = (_id) => () => {
		router.push({
			context: 'edit',
			id: _id,
		});
	};

	const onHeaderClick = (id) => {
		setSort(([sortBy, sortDirection]) => {
			if (sortBy === id) {
				return [id, sortDirection === 'asc' ? 'desc' : 'asc'];
			}

			return [id, 'asc'];
		});
	};

	const onHHeaderClick = (id) => {
		const [sortBy, sortDirection] = hsort;

		if (sortBy === id) {
			setHSort([id, sortDirection === 'asc' ? 'desc' : 'asc']);
			return;
		}
		setHSort([id, 'asc']);
	};

	const handleHeaderButtonClick = useCallback((context) => () => {
		router.push({ context });
	}, [router]);

	const close = () => {
		router.push({});
	};

	const handleChange = useCallback(() => {
		reload();
	}, [reload]);

	if (!canManagePointProfile) {
		return <NotAuthorizedPage />;
	}

	return <Page {...props} flexDirection='row'>
		<Page name='admin-point-profile'>
			<Page.Header title={t('Point_Profiles')}>
				<Button small onClick={handleHeaderButtonClick('new')} aria-label={t('New')}>
					<Icon name='plus'/>
				</Button>
			</Page.Header>
			<Page.Content>
				<Scrollable vertical>
					<PointProfile onHeaderClick={onHeaderClick}data={data} onClick={onClick} sort={sort}/>
				</Scrollable>
				<Box height='60%'>
					<PointPurchaseHistory setParams={setHparams} onHeaderClick={onHHeaderClick}  params={hparams}  data={historyData} sort={hsort}/>
				</Box>
			</Page.Content>
		</Page>
		{ context
			&& <VerticalBar flexShrink={0}>
				<VerticalBar.Header>
					{ context === 'edit' && t('Point_Profile_Info') }
					{ context === 'new' && t('Point_Profile_Add') }
					<VerticalBar.Close onClick={close}/></VerticalBar.Header>
				<VerticalBar.Content>
					{context === 'edit' && <EditPointProfileWithData _id={id} close={close} onChange={handleChange}/>}
					{context === 'new' && <AddPointProfile close={close} onChange={handleChange}/>}
				</VerticalBar.Content>
			</VerticalBar>}
	</Page>;
}
