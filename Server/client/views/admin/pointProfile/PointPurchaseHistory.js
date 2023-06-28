import React, { useMemo, useCallback, useState, useEffect } from 'react';
import { Button, ButtonGroup, Box, Table, TextInput, Icon, Margins, Scrollable, Field, Modal } from '@rocket.chat/fuselage';

import GenericTable from '../../../components/GenericTable';
import { useTranslation } from '../../../contexts/TranslationContext';
import {useEndpointAction} from "/client/hooks/useEndpointAction";

const DeleteWarningModal = ({ onDelete, onCancel, ...props }) => {
	const t = useTranslation();
	return <Modal {...props}>
		<Modal.Header>
			<Icon color='danger' name='modal-warning' size={20}/>
			<Modal.Title>{t('Are_you_sure')}</Modal.Title>
			<Modal.Close onClick={onCancel}/>
		</Modal.Header>
		<Modal.Content fontScale='p1'>
			{t('Purchase_History_Rmove_All_Warning')}
		</Modal.Content>
		<Modal.Footer>
			<ButtonGroup align='end'>
				<Button ghost onClick={onCancel}>{t('Cancel')}</Button>
				<Button primary danger onClick={onDelete}>{t('Delete')}</Button>
			</ButtonGroup>
		</Modal.Footer>
	</Modal>;
};

const SuccessModal = ({ onClose, ...props }) => {
	const t = useTranslation();
	return <Modal {...props}>
		<Modal.Header>
			<Icon color='success' name='checkmark-circled' size={20}/>
			<Modal.Title>{t('Deleted')}</Modal.Title>
			<Modal.Close onClick={onClose}/>
		</Modal.Header>
		<Modal.Content fontScale='p1'>
			{t('Purchase_History_Has_Been_Removed')}
		</Modal.Content>
		<Modal.Footer>
			<ButtonGroup align='end'>
				<Button primary onClick={onClose}>{t('Ok')}</Button>
			</ButtonGroup>
		</Modal.Footer>
	</Modal>;
};

const FilterByText = ({ setFilter, ...props }) => {
	const t = useTranslation();
	const [text, setText] = useState('');
	const [modal, setModal] = useState();

	const handleChange = useCallback((event) => setText(event.currentTarget.value), []);
	const deleteAction = useEndpointAction('POST', 'point-purchase-history.remove-all', {});

	const onDeleteConfirm = useCallback(async () => {
		const result = await deleteAction();
		if (result.success) {
			setModal(() => <SuccessModal onClose={() => { setModal(undefined); close(); }}/>);
		}
	}, [close, deleteAction]);

	const handleRemoveAll = useCallback(() => setModal(() => <DeleteWarningModal onDelete={onDeleteConfirm} onCancel={() => setModal(undefined)}/>), [onDeleteConfirm, setModal]);


	useEffect(() => {
		setFilter({ text });
	}, [setFilter, text]);
	return <>
		<Box mb='x16' is='form' onSubmit={useCallback((e) => e.preventDefault(), [])} display='flex' flexDirection='row' {...props}>
			<TextInput flexShrink={0} placeholder={t('Search')} addon={<Icon name='magnifier' size='x20'/>} onChange={handleChange} value={text} />
			<Margins inline='x24'>
				<Button onClick={handleRemoveAll} danger><Icon name='trash' mie='x4'/>{t('Remove_All')}</Button>
			</Margins>
		</Box>
		{ modal }
		</>;
};

export function PointPurchaseHistory({
	data,
	sort,
	onHeaderClick,
	setParams,
	params,
}) {
	const t = useTranslation();

	const header = useMemo(() => [
		<GenericTable.HeaderCell key={'name'} direction={sort[1]} active={sort[0] === 'name'} onClick={onHeaderClick} sort='name' w='x200'>{t('Name')}</GenericTable.HeaderCell>,
		<GenericTable.HeaderCell key={'username'} direction={sort[1]} active={sort[0] === 'username'} onClick={onHeaderClick} sort='username' w='x200'>{t('Username')}</GenericTable.HeaderCell>,
		<GenericTable.HeaderCell key={'email'} direction={sort[1]} active={sort[0] === 'email'} onClick={onHeaderClick} sort='email' w='x200'>{t('Email')}</GenericTable.HeaderCell>,
		<GenericTable.HeaderCell key={'points'} direction={sort[1]} active={sort[0] === 'points'} onClick={onHeaderClick} sort='points' w='x200'>{t('Purchased_Points')}</GenericTable.HeaderCell>,
		<GenericTable.HeaderCell key={'price'} direction={sort[1]} active={sort[0] === 'price'} onClick={onHeaderClick} sort='price' w='x200'>{t('Price')}</GenericTable.HeaderCell>,
		<GenericTable.HeaderCell key={'user_points'} direction={sort[1]} active={sort[0] === 'user_points'} onClick={onHeaderClick} sort='user_points' w='x200'>{t('After_Purchased_Points')}</GenericTable.HeaderCell>,
		<GenericTable.HeaderCell key={'purchased_at'} direction={sort[1]} active={sort[0] === 'purchased_at'} onClick={onHeaderClick} sort='purchased_at' w='x200'>{t('Purchased_At')}</GenericTable.HeaderCell>,
	], [onHeaderClick, sort, t]);

	const renderRow = (purchaseHistory) => {
		const { _id, name, username, email, points, price, user_points, purchased_at } = purchaseHistory;
		return <Table.Row key={_id}>
			<Table.Cell fontScale='p1' color='default'><Box withTruncatedText>{name}</Box></Table.Cell>
			<Table.Cell fontScale='p1' color='default'><Box withTruncatedText>{username}</Box></Table.Cell>
			<Table.Cell fontScale='p1' color='default'><Box withTruncatedText>{email}</Box></Table.Cell>
			<Table.Cell fontScale='p1' color='default'><Box withTruncatedText>{points}</Box></Table.Cell>
			<Table.Cell fontScale='p1' color='default'><Box withTruncatedText>{price}</Box></Table.Cell>
			<Table.Cell fontScale='p1' color='default'><Box withTruncatedText>{user_points}</Box></Table.Cell>
			<Table.Cell fontScale='p1' color='default'><Box withTruncatedText>{purchased_at}</Box></Table.Cell>
		</Table.Row>;
	};

	return <Scrollable vertical>
		<Field.Label fontScale='h1'>{t('Point_Purchase_History')}</Field.Label>
		<GenericTable
			FilterComponent={FilterByText}
			header={header}
			renderRow={renderRow}
			results={data?.pointPurchasedHistories??[]}
			total={data?.total??0}
			setParams={setParams}
			params={params}
		/>
	</Scrollable>;
}
