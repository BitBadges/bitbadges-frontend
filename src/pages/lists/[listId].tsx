import { Col, Divider, Empty, Input, Layout, Modal, Row, Spin, Tooltip, Typography } from 'antd';
import { AddressListDoc, AddressListWithMetadata, DefaultPlaceholderMetadata, Metadata, convertToCosmosAddress } from 'bitbadgesjs-utils';

import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { deleteAddressLists, getAddressLists } from '../../bitbadges-api/api';
import { NEW_COLLECTION_ID } from '../../bitbadges-api/contexts/TxTimelineContext';

import { CloseOutlined, InfoCircleOutlined, WarningOutlined } from '@ant-design/icons';
import { useChainContext } from '../../bitbadges-api/contexts/ChainContext';
import { fetchAccounts } from '../../bitbadges-api/contexts/accounts/AccountsContext';
import { AddressDisplay } from '../../components/address/AddressDisplay';
import { AddressDisplayList } from '../../components/address/AddressDisplayList';
import { AddressSelect } from '../../components/address/AddressSelect';
import { CollectionHeader } from '../../components/badges/CollectionHeader';
import { MetadataDisplay } from '../../components/badges/MetadataInfoDisplay';
import { BlockinDisplay } from '../../components/blockin/BlockinDisplay';
import { Action, ActionCard } from '../../components/collection-page/ActionsTab';
import { InformationDisplayCard } from '../../components/display/InformationDisplayCard';
import QrCodeDisplay from '../../components/display/QrCodeDisplay';
import { TableRow } from '../../components/display/TableRow';
import { TxHistory } from '../../components/display/TransactionHistory';
import { Tabs } from '../../components/navigation/Tabs';
import { ReportedWrapper } from '../../components/wrappers/ReportedWrapper';
import { GO_MAX_UINT_64 } from '../../utils/dates';

const { Content } = Layout;


function AddressListPage() {
  const router = useRouter()
  const chain = useChainContext();

  const { listId } = router.query;

  const [tab, setTab] = useState('overview');
  const [list, setList] = useState<AddressListDoc<bigint>>();
  const [metadata, setMetadata] = useState<Metadata<bigint>>();
  const [fetchError, setFetchError] = useState<string>();

  const [addressToCheck, setAddressToCheck] = useState<string>('');

  const [modalIsVisible, setModalIsVisible] = useState<boolean>(false);
  const [surveyDescription, setSurveyDescription] = useState<string>('');

  const actions: Action[] = [];

  const isPrivate = list?.private;
  const isOnChain = list?.listId && list.listId.indexOf('_') < 0;
  if (!isOnChain && chain.cosmosAddress == list?.createdBy && list?.createdBy) {
    actions.push({
      title: "Update List",
      description: "Update the details of this list (i.e. what addresses are included?, the metadata, etc.)",
      showModal: () => {
        router.push('/update/' + listId);
      },
    });

    actions.push({
      title: "Delete List",
      description: "Permanently delete this list.",
      showModal: async () => {
        confirm("This list will be permanently deleted. Please confirm this action.");
        await deleteAddressLists({ listIds: [listId as string] });
        router.push('/');
      },
    });

    if (list?.editKeys && list.editKeys.length > 0) {
      actions.push({
        title: "Generate Edit URLs",
        description: "Generate a URL / QR code for users to submit an address to this list.",
        showModal: async () => {
          setModalIsVisible(true);
        },
      });
    }
  }

  useEffect(() => {
    async function fetch() {
      try {
        if (!listId) return;

        let list: AddressListWithMetadata<bigint>;
        const lists = await getAddressLists({
          listIds: [listId as string],
        })

        list = lists.addressLists[0];
        if (list.reported) {
          list.metadata = DefaultPlaceholderMetadata;
        }

        setList(list);
        const toFetch = [];
        if (list.createdBy) toFetch.push(list.createdBy);
        if (list.aliasAddress) toFetch.push(list.aliasAddress);
        if (toFetch.length > 0) await fetchAccounts(toFetch);



        if (list.metadata) {
          setMetadata(list.metadata);
        }
      } catch (e: any) {
        console.error(e);
        setFetchError(e.message);
      }
    }
    fetch();
  }, [listId])

  let isAddressInList = (list?.addresses.includes(addressToCheck) || list?.addresses.includes(convertToCosmosAddress(addressToCheck)));

  if (!list?.allowlist) {
    isAddressInList = !isAddressInList;
  }


  const tabInfo = []
  tabInfo.push(
    { key: 'overview', content: 'Overview' },
  );
  tabInfo.push(
    { key: 'history', content: 'Update History' },
  )

  tabInfo.push({ key: 'actions', content: 'Actions' });

  const editKey = list?.editKeys && list.editKeys.length > 0 ? list.editKeys[0] : undefined;
  const surveyUrl = listId ? "https://bitbadges.io/addresscollector?listId=" + (listId as string) + "&description=" + surveyDescription + "&editKey=" + editKey?.key : '';


  return (
    <ReportedWrapper
      reported={!!list?.reported ?? false}
      node={<>
        <Content
          style={{
            textAlign: 'center',
            minHeight: '100vh',
          }}
        >
          <div
            style={{
              marginLeft: '3vw',
              marginRight: '3vw',
              paddingLeft: '1vw',
              paddingRight: '1vw',
              paddingTop: '20px',
            }}
          >
            {!fetchError && <CollectionHeader listId={listId as string} collectionId={NEW_COLLECTION_ID} metadataOverride={metadata} hideCollectionLink />}
            {!list && !fetchError && <Spin size='large' />}
            {fetchError && <>
              <div style={{ color: 'red' }}>
                Oops! Something went wrong while fetching this list.
                <br />
                {fetchError}
                <Divider />
                {fetchError.includes('permission')
                  || fetchError.includes('Unauthorized')
                  && <BlockinDisplay />}
              </div>

            </>}
            {!fetchError && list && <>
              <Tabs
                tab={tab}
                tabInfo={tabInfo}
                setTab={setTab}
                theme="dark"
                fullWidth
              />
              {tab === 'history' && <>
                <div className='primary-text'>
                  <br />
                  {!isOnChain &&
                    <div className='secondary-text'>
                      <InfoCircleOutlined /> This address list is stored off-chain via the BitBadges servers. The creator can update or delete this list at any time.
                    </div>}
                  {isOnChain &&
                    <div className='secondary-text'>
                      <InfoCircleOutlined /> This address list is stored on-chain. The list is permanently frozen and non-deletable.
                    </div>}
                  <br />
                  {list?.updateHistory.sort((a, b) => a.blockTimestamp > b.blockTimestamp ? -1 : 1).map((update, i) => {
                    return <TxHistory tx={update} key={i} creationTx={i == list?.updateHistory.length - 1} />
                  })}
                </div>
              </>}
              {tab === 'overview' && <>
                <br />
                {
                  <div className='flex-center'>
                    <Row className='flex-between full-width' style={{ alignItems: 'normal' }}>
                      <Col md={12} xs={24} sm={24} style={{ minHeight: 100, paddingLeft: 4, paddingRight: 4, }}>

                        <InformationDisplayCard
                          title="Info"
                        >
                          {isOnChain && <TableRow label={"ID"} value={list.listId} labelSpan={9} valueSpan={15} />}
                          {!isOnChain && list && <TableRow label={"ID"} value={list.listId.split('_')[1]} labelSpan={9} valueSpan={15} />}
                          {list.editKeys && list.editKeys.length > 0 ?
                            <TableRow label={"Editable?"} value={"By Creator and Approved Users"} labelSpan={9} valueSpan={15} /> :
                            <TableRow label={"Editable?"} value={"By Creator Only"} labelSpan={9} valueSpan={15} />
                          }
                          {!isOnChain && <TableRow label={"Access"} value={isPrivate ? "Private" : "Public"} labelSpan={9} valueSpan={15} />}
                          {list?.customData && <TableRow label={"ID"} value={list.customData} labelSpan={9} valueSpan={15} />}

                          {list?.createdBy && <TableRow label={"Created By"} value={
                            <div className='flex-between' style={{ textAlign: 'right' }}>
                              <div></div>
                              <div className='flex-between flex-column' style={{ textAlign: 'right', padding: 0 }}>
                                <AddressDisplay
                                  fontSize={13}
                                  addressOrUsername={list.createdBy}
                                />
                              </div>
                            </div>
                          } labelSpan={9} valueSpan={15} />}
                          {list?.aliasAddress && <TableRow label={
                            <>{"Alias"}<Tooltip color='black' title={"This is a fake address that is reserved to represent this list. It is not a real account and cannot initiate transactions. However, it has a portfolio and can receive badges."}>
                              <InfoCircleOutlined style={{ marginLeft: 8 }} />
                            </Tooltip>
                            </>} value={
                              <div className='flex-between' style={{ textAlign: 'right' }}>
                                <div></div>
                                <div className='flex-between flex-column' style={{ textAlign: 'right', padding: 0 }}>
                                  <AddressDisplay
                                    fontSize={16}
                                    addressOrUsername={list.aliasAddress}
                                  />
                                </div>

                              </div>} labelSpan={7} valueSpan={17} />}
                          <TableRow label={"Storage"} value={isOnChain ?
                            "On-Chain" : "Off-Chain"} labelSpan={9} valueSpan={15} />
                        </InformationDisplayCard>
                        <br />

                        <MetadataDisplay
                          collectionId={0n}
                          metadataOverride={metadata}
                          span={24}
                          isAddressListDisplay
                          metadataUrl={list?.uri}
                        />
                      </Col>
                      <Col md={0} sm={24} xs={24} style={{ height: 20 }} />
                      <Col md={12} xs={24} sm={24} style={{ minHeight: 100, paddingLeft: 4, paddingRight: 4, flexDirection: 'column' }}>
                        {list && <>
                          <InformationDisplayCard
                            title="Addresses"
                          >

                            <AddressDisplayList
                              // title='Addresses'
                              users={list?.addresses || []}
                              allExcept={!list?.allowlist}
                            />

                            <Divider />
                            <b>Address Checker</b>
                            <AddressSelect
                              defaultValue={addressToCheck}
                              onUserSelect={setAddressToCheck}
                            />
                            <br />
                            {addressToCheck ? isAddressInList ? <div className='flex-center'>
                              <div className='flex-center' style={{ alignItems: 'center' }}>
                                <div className='primary-text' style={{ fontSize: 20, fontWeight: 'bolder' }}>
                                  <span className='primary-text inherit-bg' style={{ padding: 8, borderRadius: 4 }}>✅ Address is included in list</span>

                                </div>
                              </div>
                            </div> :
                              <div className='flex-center'>
                                <div className='flex-center' style={{ alignItems: 'center' }}>
                                  <div className='primary-text' style={{ fontSize: 20, fontWeight: 'bolder' }}>
                                    <span className='primary-text inherit-bg' style={{ padding: 8, borderRadius: 4 }}>❌ Address is NOT included in list</span>

                                  </div>
                                </div>
                              </div>
                              : <></>
                            }
                          </InformationDisplayCard>
                        </>
                        }
                      </Col>
                    </Row>

                  </div>
                }
              </>}

              {tab === 'actions' && <>
                <div className='full-width' style={{ fontSize: 20 }}>
                  <div className='primary-text flex-center flex-wrap'
                    style={{
                      padding: '0',
                      textAlign: 'center',
                      marginTop: 20,
                    }}
                  >
                    {actions.map((action, idx) => {
                      return <ActionCard
                        key={idx}
                        action={action}
                      />
                    })}
                  </div>
                  {actions.length == 0 && (
                    <>
                      <Empty
                        className='primary-text'
                        description="No actions can be taken."
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                      />
                    </>
                  )}
                </div>
              </>}
            </>}
          </div>

          <Divider />

          <Modal
            title={<div className='primary-text inherit-bg'><b>{'Generate URL / QR Code'}</b></div>}
            open={modalIsVisible}

            footer={null}
            closeIcon={<div className='primary-text inherit-bg'>{<CloseOutlined />}</div>}
            bodyStyle={{
              paddingTop: 8,
            }}
            onCancel={() => setModalIsVisible(false)}
            destroyOnClose={true}
          >
            <div className='flex-center flex-column'>
              <Input.TextArea
                autoSize
                value={surveyDescription}
                onChange={(e) => setSurveyDescription(e.target.value)}
                placeholder='Description'
                style={{ width: '90%' }}
              />
              <div className='secondary-text' style={{ marginTop: 8, textAlign: 'left', width: '90%' }}>
                <InfoCircleOutlined /> Provide additional details (next steps, what this survey is for, etc.) which will be displayed to the user.
              </div>

              <Divider />

              <div className='secondary-text' style={{ textAlign: 'center', width: '90%', marginTop: 8 }}>
                <b>URL:</b> {surveyUrl}
              </div>
              <div className='flex-center'>
                <a href={surveyUrl} target="_blank" rel="noopener noreferrer">

                  Open URL
                </a>

                <Typography.Text className='primary-text' copyable={{ text: surveyUrl }} style={{ marginLeft: 8 }}>
                  Copy URL
                </Typography.Text>
              </div>
              <Divider />
              <QrCodeDisplay value={surveyUrl} size={256} />
              <Divider />
              <div className='secondary-text' style={{ textAlign: 'center' }}>
                <WarningOutlined style={{ color: 'orange' }} /> <b>Warning:</b> With the current settings, anyone with this URL can add an address {editKey?.expirationDate && editKey.expirationDate < GO_MAX_UINT_64 ? <>
                  {' '}until {new Date(Number(editKey.expirationDate)).toLocaleDateString()}.
                </> : <>with no expiration date.</>}
              </div>
              <br />
              <div className='secondary-text' style={{ textAlign: 'center' }}>
                {editKey?.mustSignIn ? <>
                  <InfoCircleOutlined /> Users must sign in and can only add their own address under the current settings.
                </> : <>
                  <InfoCircleOutlined /> Users can add any address without signing in under the current settings.
                </>}
              </div>

            </div>
          </Modal>
        </Content>
      </>
      }
    />
  );
}

export default AddressListPage;
