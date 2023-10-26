import { Col, Divider, Empty, Layout, Row, Spin } from 'antd';
import { AddressMappingInfo, Metadata, convertToCosmosAddress } from 'bitbadgesjs-utils';

import HtmlToReact from 'html-to-react';
import MarkdownIt from 'markdown-it';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { deleteAddressMappings, getAddressMappings } from '../../bitbadges-api/api';
import { NEW_COLLECTION_ID } from '../../bitbadges-api/contexts/TxTimelineContext';
import { useAccountsContext } from '../../bitbadges-api/contexts/accounts/AccountsContext';
import { AddressDisplay } from '../../components/address/AddressDisplay';
import { AddressDisplayList } from '../../components/address/AddressDisplayList';
import { AddressSelect } from '../../components/address/AddressSelect';
import { CollectionHeader } from '../../components/badges/CollectionHeader';
import { MetadataDisplay } from '../../components/badges/MetadataInfoDisplay';
import { BadgeButtonDisplay } from '../../components/button-displays/BadgePageButtonDisplay';
import { Action, ActionCard } from '../../components/collection-page/ActionsTab';
import { InformationDisplayCard } from '../../components/display/InformationDisplayCard';
import { TableRow } from '../../components/display/TableRow';
import { TxHistory } from '../../components/display/TransactionHistory';
import { Tabs } from '../../components/navigation/Tabs';

const { Content } = Layout;
const mdParser = new MarkdownIt(/* Markdown-it options */);


function AddressMappingPage() {
  const router = useRouter()
  const accounts = useAccountsContext();
  const { mappingId } = router.query;

  const [tab, setTab] = useState('overview');
  const [mapping, setMapping] = useState<AddressMappingInfo<bigint>>();
  const [metadata, setMetadata] = useState<Metadata<bigint>>();

  const HtmlToReactParser = HtmlToReact.Parser();
  const [reactElement, setReactElement] = useState(HtmlToReactParser.parse(mdParser.render(metadata?.description ? metadata?.description : '')));

  const [addressToCheck, setAddressToCheck] = useState<string>('');

  const actions: Action[] = [];

  if ((mappingId as string)?.indexOf('_') >= 0) {
    actions.push({
      title: "Update",
      description: "Update the details of this list.",
      showModal: () => {
        router.push('/update/' + mappingId);
      },
    });

    actions.push({
      title: "Delete",
      description: "Delete this list.",
      showModal: async () => {
        confirm("This list will be permanently deleted. Please confirm this action.");
        await deleteAddressMappings({ mappingIds: [mappingId as string] });
        router.push('/');
      },
    });
  }



  useEffect(() => {
    async function fetch() {
      if (!mappingId) return;

      const mappings = await getAddressMappings({
        mappingIds: [mappingId as string],
      })

      const mapping = mappings.addressMappings[0];

      setMapping(mapping);

      await accounts.fetchAccounts(mapping?.createdBy ? [mapping.createdBy] : []);
      if (mapping.metadata) {
        setMetadata(mapping.metadata);
        if (mapping.metadata?.description) {
          setReactElement(HtmlToReactParser.parse(mdParser.render(mapping.metadata?.description)));
        }
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
    { key: 'history', content: 'Update History' },
    { key: 'actions', content: 'Actions' },
  );

  return (
    <Content
      style={{
        textAlign: 'center',
        minHeight: '100vh',
      }}
    >
      <div
        style={{
          marginLeft: '7vw',
          marginRight: '7vw',
          paddingLeft: '1vw',
          paddingRight: '1vw',
          paddingTop: '20px',
        }}
      >
        <BadgeButtonDisplay website={metadata?.externalUrl} />
        <CollectionHeader collectionId={NEW_COLLECTION_ID} metadataOverride={metadata} hideCollectionLink />
        {!mapping && <Spin size='large' />}
        <Tabs
          tab={tab}
          tabInfo={tabInfo}
          setTab={setTab}
          theme="dark"
          fullWidth
        />
        {tab === 'history' && <>
          <div className='dark:text-white'>
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
              <div style={{ maxHeight: 200, overflow: 'auto' }} >
                <div className='custom-html-style dark:text-white' id="description">
                  {reactElement}
                </div>
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
                    {mapping?.mappingId && mapping.mappingId.indexOf('_') < 0 && <TableRow label={"ID"} value={mapping.mappingId} labelSpan={9} valueSpan={15} />}
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
                    <TableRow label={"Storage"} value={mapping?.mappingId && mapping.mappingId.indexOf('_') < 0 ?
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
                          <div className='dark:text-white' style={{ fontSize: 20, fontWeight: 'bolder' }}>
                            <span className='dark:text-white inherit-bg' style={{ padding: 8, borderRadius: 4 }}>✅ Address is included in list</span>

                          </div>
                        </div>
                      </div> :
                        <div className='flex-center'>
                          <div className='flex-center' style={{ alignItems: 'center' }}>
                            <div className='dark:text-white' style={{ fontSize: 20, fontWeight: 'bolder' }}>
                              <span className='dark:text-white inherit-bg' style={{ padding: 8, borderRadius: 4 }}>❌ Address is NOT included in list</span>

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
            <div className='dark:text-white flex-center flex-wrap'
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
                  className='dark:text-white'
                  description="No actions can be taken."
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              </>
            )}
          </div>
        </>}

      </div>

      <Divider />
    </Content>
  );
}

export default AddressMappingPage;
