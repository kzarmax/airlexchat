import { Box, Table } from '@rocket.chat/fuselage';
import { useDebouncedValue, useMediaQuery } from '@rocket.chat/fuselage-hooks';
import React, { useMemo, useCallback, useState } from 'react';

import CardAvatar from '../../../components/avatar/CardAvatar';
import GenericTable from '../../../components/GenericTable';
import { useTranslation } from '../../../contexts/TranslationContext';
import { useRoute } from '../../../contexts/RouterContext';
import { useEndpointData } from '../../../hooks/useEndpointData';
import FilterByText from '../../../components/FilterByText';

const style = {
	whiteSpace: 'nowrap',
	textOverflow: 'ellipsis',
	overflow: 'hidden',
};

const sortDir = (sortDir) => (sortDir === 'asc' ? 1 : -1);

const CardRow = ({ _id, username, name, cId, comment, avatarETag, onClick, mediaQuery, createdAt }) => {
	const t = useTranslation();

	return <Table.Row onKeyDown={onClick(_id)} onClick={onClick(_id)} tabIndex={0} role='link' action qa-user-id={_id}>
		<Table.Cell>
			<Box display='flex' alignItems='center'>
				<CardAvatar size={mediaQuery ? 'x28' : 'x40'} type='ca' title={username} id={_id} etag={avatarETag}/>
				<Box display='flex' style={style} mi='x8'>
					<Box display='flex' flexDirection='column' alignSelf='center' style={style}>
						<Box fontScale='p2' style={style} color='default'>{username}</Box>
					</Box>
				</Box>
			</Box>
		</Table.Cell>
		<Table.Cell style={style}>
			<Box display='flex' alignItems='center'>
				<CardAvatar size={mediaQuery ? 'x28' : 'x40'} type='ci' title={name} id={_id} etag={avatarETag}/>
				<Box display='flex' style={style} mi='x8'>
					<Box display='flex' flexDirection='column' alignSelf='center' style={style}>
						<Box fontScale='p2' style={style} color='default'>{name}</Box>
					</Box>
				</Box>
			</Box>
		</Table.Cell>
		<Table.Cell style={style}>{cId}</Table.Cell>
		{mediaQuery && <Table.Cell style={style}>{comment}</Table.Cell>}
		{mediaQuery && <Table.Cell fontScale='p1' color='hint' style={style}>{createdAt}</Table.Cell>}
	</Table.Row>;
};


const useQuery = ({ text, itemsPerPage, current }, sortFields) => useMemo(() => ({
	fields: JSON.stringify({ name: 1, username: 1, cId: 1, comment: 1, createdAt: 1, avatarETag: 1, active: 1 }),
	query: JSON.stringify({
		$or: [
			{ username: { $regex: text || '', $options: 'i' } },
			{ name: { $regex: text || '', $options: 'i' } },
			{ userId: text}
		],
	}),
	sort: JSON.stringify(sortFields.reduce((agg, [column, direction]) => {
		agg[column] = sortDir(direction);
		return agg;
	}, {})),
	...itemsPerPage && { count: itemsPerPage },
	...current && { offset: current },
}), [text, itemsPerPage, current, sortFields]);

export function CardsTable() {
	const t = useTranslation();

	const [params, setParams] = useState({ text: '', current: 0, itemsPerPage: 25 });
	const [sort, setSort] = useState([['name', 'asc'], ['usernames', 'asc']]);

	const debouncedParams = useDebouncedValue(params, 500);
	const debouncedSort = useDebouncedValue(sort, 500);
	const query = useQuery(debouncedParams, debouncedSort);

	const { value: data = {} } = useEndpointData('cards.list', query);

	const usersRoute = useRoute('admin-cards');

	const onClick = useCallback((id) => () => usersRoute.push({
		context: 'info',
		id,
	}), [usersRoute]);

	const onHeaderClick = useCallback((id) => {
		const preparedSort = [];

		const [[sortBy, sortDirection]] = sort;

		if (sortBy === id) {
			preparedSort.push([id, sortDirection === 'asc' ? 'desc' : 'asc']);
		} else {
			preparedSort.push([id, 'asc']);
		}

		setSort(preparedSort);
	}, [sort]);

	const mediaQuery = useMediaQuery('(min-width: 1024px)');

	return <GenericTable
		header={<>
			<GenericTable.HeaderCell key={'username'} direction={sort[0][1]} active={sort[0][0] === 'username'} onClick={onHeaderClick} sort='username' w='x140'>
				{t('Username')}
			</GenericTable.HeaderCell>
			<GenericTable.HeaderCell key={'name'} direction={sort[0][1]} active={sort[0][0] === 'name'} onClick={onHeaderClick} sort='name' w='x200'>
				{t('Name')}
			</GenericTable.HeaderCell>
			<GenericTable.HeaderCell key={'cId'} direction={sort[0][1]} active={sort[0][0] === 'cId'} onClick={onHeaderClick} sort='cId' w='x120'>
				{t('Card_ID')}
			</GenericTable.HeaderCell>
			{mediaQuery && <GenericTable.HeaderCell key={'comment'} direction={sort[0][1]} active={sort[0][0] === 'comment'} onClick={onHeaderClick} sort='comment' w='x120'>
				{t('Comment')}
			</GenericTable.HeaderCell>}
			{mediaQuery && <GenericTable.HeaderCell key={'cratedAt'} direction={sort[0][1]} active={sort[0][0] === 'createdAt'} onClick={onHeaderClick} sort='createdAt' w='x100'>
				{t('Created_at')}
			</GenericTable.HeaderCell>}
		</>}
		results={data.cards}
		total={data.total}
		setParams={setParams}
		params={params}
		renderFilter={({ onChange, ...props }) => <FilterByText placeholder={t('Search_Cards')} onChange={onChange} {...props} />}
	>
		{(props) => <CardRow key={props._id} onClick={onClick} mediaQuery={mediaQuery} {...props}/>}
	</GenericTable>;
}

export default CardsTable;
