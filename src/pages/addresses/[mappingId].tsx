import { Col, Divider, Empty, Input, Layout, Modal, Row, Spin, Typography } from 'antd';
import { AddressMappingDoc, AddressMappingWithMetadata, Metadata, convertToCosmosAddress } from 'bitbadgesjs-utils';

import HtmlToReact from 'html-to-react';
import MarkdownIt from 'markdown-it';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { deleteAddressMappings, getAddressMappings } from '../../bitbadges-api/api';
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
import { BadgeButtonDisplay } from '../../components/button-displays/BadgePageButtonDisplay';
import { Action, ActionCard } from '../../components/collection-page/ActionsTab';
import { InformationDisplayCard } from '../../components/display/InformationDisplayCard';
import QrCodeDisplay from '../../components/display/QrCodeDisplay';
import { TableRow } from '../../components/display/TableRow';
import { TxHistory } from '../../components/display/TransactionHistory';
import { Tabs } from '../../components/navigation/Tabs';
import { GO_MAX_UINT_64 } from '../../utils/dates';
import { ReportedWrapper } from '../../components/wrappers/ReportedWrapper';

const { Content } = Layout;
const mdParser = new MarkdownIt(/* Markdown-it options */);


function AddressMappingPage() {
  const router = useRouter()
  const chain = useChainContext();

  const { mappingId } = router.query;

  const [tab, setTab] = useState('overview');
  const [mapping, setMapping] = useState<AddressMappingDoc<bigint>>();
  const [metadata, setMetadata] = useState<Metadata<bigint>>();
  const [fetchError, setFetchError] = useState<string>();

  const [reactElement, setReactElement] = useState(HtmlToReact.Parser().parse(mdParser.render(metadata?.description ? metadata?.description : '')));

  const [addressToCheck, setAddressToCheck] = useState<string>('');

  const [modalIsVisible, setModalIsVisible] = useState<boolean>(false);
  const [surveyDescription, setSurveyDescription] = useState<string>('');

  const actions: Action[] = [];

  const isPrivate = mapping?.private;
  const isOnChain = mapping?.mappingId && mapping.mappingId.indexOf('_') < 0;
  if (!isOnChain && chain.cosmosAddress == mapping?.createdBy && mapping?.createdBy) {
    actions.push({
      title: "Update List",
      description: "Update the details of this list (i.e. what addresses are included?, the metadata, etc.)",
      showModal: () => {
        router.push('/update/' + mappingId);
      },
    });

    actions.push({
      title: "Delete List",
      description: "Permanently delete this list.",
      showModal: async () => {
        confirm("This list will be permanently deleted. Please confirm this action.");
        await deleteAddressMappings({ mappingIds: [mappingId as string] });
        router.push('/');
      },
    });

    if (mapping?.editKeys && mapping.editKeys.length > 0) {
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
        if (!mappingId) return;

        let mapping: AddressMappingWithMetadata<bigint>;
        const mappings = await getAddressMappings({
          mappingIds: [mappingId as string],
        })

        mapping = mappings.addressMappings[0];

        setMapping(mapping);

        await fetchAccounts(mapping?.createdBy ? [mapping.createdBy] : []);
        if (mapping.metadata) {
          setMetadata(mapping.metadata);
          if (mapping.metadata?.description) {
            setReactElement(HtmlToReact.Parser().parse(mdParser.render(mapping.metadata?.description)));
          }
        }
      } catch (e: any) {
        console.error(e);
        setFetchError(e.message);
      }
    }
    fetch();
  }, [mappingId])

  let isAddressInList = (mapping?.addresses.includes(addressToCheck) || mapping?.addresses.includes(convertToCosmosAddress(addressToCheck)));

  if (!mapping?.includeAddresses) {
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

  const editKey = mapping?.editKeys && mapping.editKeys.length > 0 ? mapping.editKeys[0] : undefined;
  const surveyUrl = mappingId ? "https://bitbadges.io/addresscollector?mappingId=" + (mappingId as string) + "&description=" + surveyDescription + "&editKey=" + editKey?.key : '';


  return (
    <ReportedWrapper
      reported={!!mapping?.reported ?? false}
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
            {!fetchError && <BadgeButtonDisplay socials={metadata?.socials} website={metadata?.externalUrl} mappingId={mappingId as string} />}
            {!fetchError && <CollectionHeader collectionId={NEW_COLLECTION_ID} metadataOverride={metadata} hideCollectionLink />}
            {!mapping && !fetchError && <Spin size='large' />}
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
            {!fetchError && mapping && <>
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
                  {mapping?.updateHistory.sort((a, b) => a.block > b.block ? -1 : 1).map((update, i) => {
                    return <TxHistory tx={update} key={i} creationTx={i == 0} />
                  })}
                </div>
              </>}
              {tab === 'overview' && <>
                <br />
                {metadata?.description && <>
                  <InformationDisplayCard
                    title="About"
                  >
                      <div className='custom-html-style primary-text' id="description" style={{ overflow: 'auto', maxHeight: 200 }} >
                        {reactElement}
                      </div>
                  </InformationDisplayCard>
                  <br />
                </>}

                {
                  <div className='flex-center'>
                    <Row className='flex-between full-width' style={{ alignItems: 'normal' }}>
                      <Col md={12} xs={24} sm={24} style={{ minHeight: 100, paddingLeft: 4, paddingRight: 4, }}>

                        <InformationDisplayCard
                          title="Info"
                        >
                          {isOnChain && <TableRow label={"ID"} value={mapping.mappingId} labelSpan={9} valueSpan={15} />}
                          {!isOnChain && mapping && <TableRow label={"ID"} value={mapping.mappingId.split('_')[1]} labelSpan={9} valueSpan={15} />}
                          {mapping.editKeys && mapping.editKeys.length > 0 ?
                            <TableRow label={"Editable?"} value={"By Creator and Approved Users"} labelSpan={9} valueSpan={15} /> :
                            <TableRow label={"Editable?"} value={"By Creator Only"} labelSpan={9} valueSpan={15} />
                          }
                          {!isOnChain && <TableRow label={"Access"} value={isPrivate ? "Private" : "Public"} labelSpan={9} valueSpan={15} />}
                          {mapping?.customData && <TableRow label={"ID"} value={mapping.customData} labelSpan={9} valueSpan={15} />}

                          {mapping?.createdBy && <TableRow label={"Created By"} value={
                            <div className='flex-between' style={{ textAlign: 'right' }}>
                              <div></div>
                              <div className='flex-between flex-column' style={{ textAlign: 'right', padding: 0 }}>
                                <AddressDisplay
                                  fontSize={13}
                                  addressOrUsername={mapping.createdBy}
                                />
                              </div>
                            </div>
                          } labelSpan={9} valueSpan={15} />}
                          <TableRow label={"Storage"} value={isOnChain ?
                            "On-Chain" : "Off-Chain"} labelSpan={9} valueSpan={15} />
                        </InformationDisplayCard>
                        <br />

                        <MetadataDisplay
                          collectionId={0n}
                          metadataOverride={metadata}
                          span={24}
                          isAddressListDisplay
                          metadataUrl={mapping?.uri}
                        />
                      </Col>
                      <Col md={0} sm={24} xs={24} style={{ height: 20 }} />
                      <Col md={12} xs={24} sm={24} style={{ minHeight: 100, paddingLeft: 4, paddingRight: 4, flexDirection: 'column' }}>
                        {mapping && <>
                          <InformationDisplayCard
                            title="Addresses"
                          >

                            <AddressDisplayList
                              // title='Addresses'
                              users={mapping?.addresses || []}
                              allExcept={!mapping?.includeAddresses}
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
            style={{}}
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

export default AddressMappingPage;
