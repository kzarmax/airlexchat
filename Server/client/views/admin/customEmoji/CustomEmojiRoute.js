import React, { useMemo, useState, useCallback } from 'react';
import {Box, Button, Field, Icon, Scrollable} from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';

import Page from '../../../components/Page';
import VerticalBar from '../../../components/VerticalBar';
import NotAuthorizedPage from '../../../components/NotAuthorizedPage';
import { usePermission } from '../../../contexts/AuthorizationContext';
import { useRoute, useRouteParameter } from '../../../contexts/RouterContext';
import { useTranslation } from '../../../contexts/TranslationContext';
import { useEndpointData } from '../../../hooks/useEndpointData';
import EditCustomEmojiWithData from './EditCustomEmojiWithData';
import AddCustomEmoji from './AddCustomEmoji';
import CustomEmoji from './CustomEmoji';
import ChildCustomEmoji from './ChildCustomEmoji';

function CustomEmojiRoute() {
	const route = useRoute('emoji-custom');
	const context = useRouteParameter('context');
	const id = useRouteParameter('id');
	const canManageEmoji = usePermission('manage-emoji');

	const t = useTranslation();

	const [params, setParams] = useState(() => ({ text: ''}));
	const [sort, setSort] = useState(() => ['name', 'asc']);
	const [rootId, setRootId] = useState(() => '');
	const [childId, setChildId] = useState(() => '');

	const { text, itemsPerPage, current } = useDebouncedValue(params, 500);
	const [column, direction] = useDebouncedValue(sort, 500);
	const query = useMemo(() => ({
		query: JSON.stringify({ name: { $regex: text || '', $options: 'i' }, parent: '0' }),
		sort: JSON.stringify({ [column]: direction === 'asc' ? 1 : -1 }),
		...itemsPerPage && { count: itemsPerPage },
		...current && { offset: current },
	}), [text, column, direction, current, itemsPerPage]);

	const { value: data, reload } = useEndpointData('emoji-custom.all', query);

	const [cparams, setCParams] = useState(() => ({ text: ''}));
	const [csort, setCSort] = useState(() => ['name', 'asc']);

	const { itemsPerPage: cItemsPerPage, current: cCurrent } = useDebouncedValue(cparams, 500);
	const [ccolumn, cdirection] = useDebouncedValue(csort, 500);
	const cquery = useMemo(() => ({
		query: JSON.stringify({ parent: rootId }),
		sort: JSON.stringify({ [ccolumn]: cdirection === 'asc' ? 1 : -1 }),
		...cItemsPerPage && { count: cItemsPerPage },
		...cCurrent && { offset: cCurrent },
	}), [rootId, ccolumn, cdirection, cCurrent, cItemsPerPage]);

	const { value: cdata, reload: creload } = useEndpointData('emoji-custom.all', cquery);

	const handleItemClick = (_id, parent) => () => {
		route.push({
			context: 'edit',
			id: _id,
		});
		if(parent === '0'){
			setRootId(_id);
		} else {
			setChildId(_id);
		}
	};

	const handleHeaderClick = (id) => {
		setSort(([sortBy, sortDirection]) => {
			if (sortBy === id) {
				return [id, sortDirection === 'asc' ? 'desc' : 'asc'];
			}

			return [id, 'asc'];
		});
	};

	const handleCHeaderClick = (id) => {
		setCSort(([sortBy, sortDirection]) => {
			if (sortBy === id) {
				return [id, sortDirection === 'asc' ? 'desc' : 'asc'];
			}

			return [id, 'asc'];
		});
	};

	const handleNewButtonClick = useCallback(() => {
		route.push({ context: 'new' });
	}, [route]);

	const handleClose = () => {
		route.push({});
	};

	const handleChange = useCallback(() => {
		reload();
		creload();
	}, [reload, creload]);

	if (!canManageEmoji) {
		return <NotAuthorizedPage />;
	}

	return <Page flexDirection='row'>
		<Page name='admin-emoji-custom'>
			<Page.Header title={t('Custom_Emoji')}>
				<Button small onClick={handleNewButtonClick} aria-label={t('New')}>
					<Icon name='plus'/>
				</Button>
			</Page.Header>
			<Page.Content>
				<CustomEmoji setParams={setParams} params={params} selected={rootId} onHeaderClick={handleHeaderClick} data={data} onClick={handleItemClick} sort={sort}/>
				<ChildCustomEmoji setParams={setCParams} selected={childId} onHeaderClick={handleCHeaderClick}  params={cparams}  data={cdata} onClick={handleItemClick} sort={csort}/>
			</Page.Content>
		</Page>
		{context && <VerticalBar flexShrink={0}>
			<VerticalBar.Header>
				{context === 'edit' && t('Custom_Emoji_Info')}
				{context === 'new' && t('Custom_Emoji_Add')}
				<VerticalBar.Close onClick={handleClose}/>
			</VerticalBar.Header>
			{context === 'edit' && <EditCustomEmojiWithData _id={id} close={handleClose} categories={data?.emojis??[]}  onChange={handleChange} />}
			{context === 'new' && <AddCustomEmoji close={handleClose} categories={data?.emojis??[]}  onChange={handleChange}/>}
		</VerticalBar>}
	</Page>;
}

export default CustomEmojiRoute;
