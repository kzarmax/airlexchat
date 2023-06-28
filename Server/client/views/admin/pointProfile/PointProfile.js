import React, { useMemo } from 'react';
import { Box, Table } from '@rocket.chat/fuselage';

import GenericTable from '../../../components/GenericTable';
import { useTranslation } from '../../../contexts/TranslationContext';
import FilterByText from '../../../components/FilterByText';

export function PointProfile({
	data,
	sort,
	onClick,
	onHeaderClick
}) {
	const t = useTranslation();

	const header = useMemo(() => [
		<GenericTable.HeaderCell key={'points'} direction={sort[1]} active={sort[0] === 'points'} onClick={onHeaderClick} sort='points' w='x200'>{t('Points')}</GenericTable.HeaderCell>,
		<GenericTable.HeaderCell key={'price'} direction={sort[1]} active={sort[0] === 'price'} onClick={onHeaderClick} sort='price' w='x200'>{t('Price')}</GenericTable.HeaderCell>,
	], [onHeaderClick, sort, t]);

	const renderRow = (pointProfile) => {
		const { _id, points, price } = pointProfile;
		return <Table.Row key={_id} onKeyDown={onClick(_id, pointProfile)} onClick={onClick(_id, pointProfile)} tabIndex={0} role='link' action qa-user-id={_id}>
			<Table.Cell fontScale='p1' color='default'><Box withTruncatedText>{points}</Box></Table.Cell>
			<Table.Cell fontScale='p1' color='default'><Box withTruncatedText>{price}</Box></Table.Cell>
		</Table.Row>;
	};

	return <GenericTable
		header={header}
		renderRow={renderRow}
		results={data?.pointProfiles??[]}
		total={data?.total??0}
		renderFilter={({ onChange, ...props }) => <FilterByText onChange={onChange} {...props}/>}
	/>;
}
