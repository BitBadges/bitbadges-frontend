import { Card, Col, Divider, Empty, Layout, Row, Spin } from 'antd';
import { AddressMapping } from 'bitbadgesjs-proto';
import { Metadata, convertToCosmosAddress } from 'bitbadgesjs-utils';

import HtmlToReact from 'html-to-react';
import MarkdownIt from 'markdown-it';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { deleteAddressMappings, fetchMetadataDirectly, getAddressMappings } from '../../bitbadges-api/api';
import { AddressDisplay } from '../../components/address/AddressDisplay';
import { AddressDisplayList } from '../../components/address/AddressDisplayList';
import { AddressSelect } from '../../components/address/AddressSelect';
import { CollectionHeader } from '../../components/badges/CollectionHeader';
import { MetadataDisplay } from '../../components/badges/MetadataInfoDisplay';
import { BadgeButtonDisplay } from '../../components/button-displays/BadgePageButtonDisplay';
import { InformationDisplayCard } from '../../components/display/InformationDisplayCard';
import { TableRow } from '../../components/display/TableRow';
import { MSG_PREVIEW_ID } from '../../components/tx-timelines/TxTimeline';
import { useAccountsContext } from '../../bitbadges-api/contexts/AccountsContext';
import { Tabs } from '../../components/navigation/Tabs';
import Meta from 'antd/lib/card/Meta';

const { Content } = Layout;
const mdParser = new MarkdownIt(/* Markdown-it options */);
function CollectionPage({ }: {}) {
  const router = useRouter()
  const accounts = useAccountsContext();
  const { mappingId } = router.query;

  const [tab, setTab] = useState('overview');
  const [mapping, setMapping] = useState<AddressMapping>();
  const [metadata, setMetadata] = useState<Metadata<bigint>>();

  const HtmlToReactParser = HtmlToReact.Parser();
  const [reactElement, setReactElement] = useState(HtmlToReactParser.parse(mdParser.render(metadata?.description ? metadata?.description : '')));

  const [addressToCheck, setAddressToCheck] = useState<string>('');

  const actions: {
    title: React.ReactNode,
    description: React.ReactNode,
    showModal: () => void,
    disabled?: boolean
  }[] = [];
  const getTitleElem = (title: string) => {
    return (
      <div className='primary-text'>
        {title}
      </div>
    );
  };

  const getDescriptionElem = (description: string) => {
    return (
      <div className='secondary-text'>
        {description}
      </div>
    );
  };

  if ((mappingId as string)?.startsWith('off-chain_')) {
    actions.push({
      title: getTitleElem("Update"),
      description: getDescriptionElem(
        "Update the details of this list."
      ),
      showModal: () => {
        router.push('/update/' + mappingId);
      },
    });

    actions.push({
      title: getTitleElem("Delete"),
      description: getDescriptionElem(
        "Delete this list."
      ),
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
      // if (mapping.addresses.length > 0) {
      //   await accounts.fetchAccounts(mapping?.addresses || []);
      // }

      await accounts.fetchAccounts(mapping?.createdBy ? [mapping.createdBy] : []);
      if (mapping.uri) {
        const metadataRes = await fetchMetadataDirectly({
          uris: [mapping.uri],
        });

        setMetadata(metadataRes.metadata[0]);

        if (metadataRes.metadata[0]?.description) {
          setReactElement(HtmlToReactParser.parse(mdParser.render(metadataRes.metadata[0]?.description)));
        }
      }
    }
    fetch();

  }, [mappingId])


  console.log(reactElement);

  let addressInList = (mapping?.addresses.includes(addressToCheck) || mapping?.addresses.includes(convertToCosmosAddress(addressToCheck)));

  if (!mapping?.includeAddresses) {
    addressInList = !addressInList;
  }

  const tabInfo = []
  tabInfo.push(
    { key: 'overview', content: 'Overview' },
    { key: 'actions', content: 'Actions' },
  );
  return (
    <Layout>
      <Content
        style={{
          background: `linear-gradient(0deg, #3e83f8 0, #001529 0%)`,
          textAlign: 'center',
          minHeight: '100vh',
        }}
      >
        <div
          className='primary-blue-bg'
          style={{
            marginLeft: '7vw',
            marginRight: '7vw',
            paddingLeft: '1vw',
            paddingRight: '1vw',
            paddingTop: '20px',
          }}
        >
          <BadgeButtonDisplay website={metadata?.externalUrl} />
          <CollectionHeader collectionId={MSG_PREVIEW_ID} metadataOverride={metadata} hideCollectionLink />
          {!mapping && <Spin size='large' />}
          <Tabs
            tab={tab}
            tabInfo={tabInfo}
            setTab={setTab}
            theme="dark"
            fullWidth
          />
          {tab === 'overview' && <>
            <br />
            {metadata?.description && <>
              <InformationDisplayCard
                title="About"
              >
                <div style={{ maxHeight: 200, overflow: 'auto' }} >
                  <div className='custom-html-style primary-text' id="description">
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
                      {mapping?.mappingId && mapping.mappingId.indexOf('off-chain_') < 0 && <TableRow label={"ID"} value={mapping.mappingId} labelSpan={9} valueSpan={15} />}
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
                      <TableRow label={"Storage"} value={
                        mapping?.mappingId && mapping.mappingId.indexOf('off-chain_') < 0 ?

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
                        {addressToCheck &&
                          <AddressDisplay
                            addressOrUsername={addressToCheck}

                          />}
                        <br />
                        {addressToCheck ? addressInList ? <div className='flex-center'>
                          <div className='flex-center' style={{ alignItems: 'center' }}>
                            <div className='primary-text' style={{ fontSize: 20, fontWeight: 'bolder' }}>
                              <span className='primary-text primary-blue-bg' style={{ padding: 8, borderRadius: 4 }}>✅ Address is included in list</span>

                            </div>
                          </div>
                        </div> :
                          <div className='flex-center'>
                            <div className='flex-center' style={{ alignItems: 'center' }}>
                              <div className='primary-text' style={{ fontSize: 20, fontWeight: 'bolder' }}>
                                <span className='primary-text primary-blue-bg' style={{ padding: 8, borderRadius: 4 }}>❌ Address is NOT included in list</span>

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
                  return <Card
                    key={idx}
                    className='primary-text primary-blue-bg flex-center'
                    style={{
                      width: '300px',
                      minHeight: '150px',
                      margin: 8,
                      textAlign: 'center',
                      cursor: action.disabled ? 'not-allowed' : undefined,
                    }}
                    hoverable={!action.disabled}
                    onClick={async () => {
                      if (action.disabled) return;
                      action.showModal();
                    }}
                  >
                    <Meta
                      title={
                        <div
                          className='primary-text'
                          style={{
                            fontSize: 20,
                            fontWeight: 'bolder',
                          }}
                        >
                          {action.title}
                        </div>
                      }
                      description={
                        <div className='secondary-text flex-center full-width'>
                          {action.description}
                        </div>
                      }
                    />
                  </Card>
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

        </div>

        <Divider />
      </Content>
    </Layout>
  );
}

export default CollectionPage;
