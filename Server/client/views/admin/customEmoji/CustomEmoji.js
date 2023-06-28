import React, { useMemo } from 'react';
import { Box, Table, Field } from '@rocket.chat/fuselage';

import FilterByText from '../../../components/FilterByText';
import GenericTable from '../../../components/GenericTable';
import { useTranslation } from '../../../contexts/TranslationContext';

function CustomEmoji({
	data,
	sort,
	onClick,
	onHeaderClick,
	setParams,
	params,
	selected
}) {
	const t = useTranslation();

	const header = useMemo(() => [
		<GenericTable.HeaderCell key='name' direction={sort[1]} active={sort[0] === 'name'} onClick={onHeaderClick} sort='name' w='x200'>{t('Name')}</GenericTable.HeaderCell>,
		<GenericTable.HeaderCell key='aliases' w='x200'>{t('Aliases')}</GenericTable.HeaderCell>,
		<GenericTable.HeaderCell key='points' w='x200'>{t('Points')}</GenericTable.HeaderCell>
	], [onHeaderClick, sort, t]);

	const renderRow = (emojis) => {
		const { _id, name, parent, points, aliases } = emojis;
		return <Table.Row key={_id} backgroundColor={selected === _id?'hint':''} onKeyDown={onClick(_id, parent)} onClick={onClick(_id, parent)} tabIndex={0} role='link' action qa-user-id={_id}>
			<Table.Cell fontScale='p1' color='default'><Box withTruncatedText>{name}</Box></Table.Cell>
			<Table.Cell fontScale='p1' color='default'><Box withTruncatedText>{aliases}</Box></Table.Cell>
			<Table.Cell fontScale='p1' color='default'><Box withTruncatedText>{points??0}</Box></Table.Cell>
		</Table.Row>;
	};

	return <GenericTable
		header={header}
		renderRow={renderRow}
		results={data?.emojis ?? []}
		total={data?.total ?? 0}
		setParams={setParams}
		params={params}
		renderFilter={({ onChange, ...props }) => [<FilterByText key='search' onChange={onChange} {...props} />,
			<Box is='h1' fontScale='h1' key='title' >{t('Root')}</Box>]}
	/>;
}

export default CustomEmoji;
