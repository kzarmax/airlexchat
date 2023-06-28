import React, { useMemo } from 'react';
import {Box, Table} from '@rocket.chat/fuselage';

import GenericTable from '../../../components/GenericTable';
import { useTranslation } from '../../../contexts/TranslationContext';

function ChildCustomEmoji({
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
		<GenericTable.HeaderCell key='aliases' w='x200'>{t('Aliases')}</GenericTable.HeaderCell>
	], [onHeaderClick, sort, t]);

	const renderRow = (emojis) => {
		const { _id, name, parent, aliases } = emojis;
		return <Table.Row key={_id} onKeyDown={onClick(_id, parent)} backgroundColor={selected === _id?'hint':''} onClick={onClick(_id, parent)} tabIndex={0} role='link' action qa-user-id={_id}>
			<Table.Cell fontScale='p1' color='default'><Box withTruncatedText><span>&emsp;</span>{'— ' + name}</Box></Table.Cell>
			<Table.Cell fontScale='p1' color='default'><Box withTruncatedText>{aliases}</Box></Table.Cell>
		</Table.Row>;
	};

	return <GenericTable
			header={header}
			renderRow={renderRow}
			results={data?.emojis ?? []}
			total={data?.total ?? 0}
			setParams={setParams}
			params={params}
			renderFilter={({ onChange, ...props }) => <Box is='h1' fontScale='h1'>{t('Child')}</Box>}
		/>;
}

export default ChildCustomEmoji;
