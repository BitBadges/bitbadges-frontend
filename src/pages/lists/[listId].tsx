import { Col, Divider, Empty, Input, Layout, Row, Spin, Tooltip, Typography, notification } from 'antd';
import { BitBadgesAddressList, Metadata, convertToCosmosAddress } from 'bitbadgesjs-sdk';

import { useRouter } from 'next/router';
import { ReactNode, useCallback, useEffect, useState } from 'react';
import { BitBadgesApi, deleteAddressLists, getAddressLists } from '../../bitbadges-api/api';
import { NEW_COLLECTION_ID } from '../../bitbadges-api/contexts/TxTimelineContext';

import { DatabaseOutlined, InfoCircleOutlined, LinkOutlined } from '@ant-design/icons';
import { useChainContext } from '../../bitbadges-api/contexts/ChainContext';
import { fetchAccounts } from '../../bitbadges-api/contexts/accounts/AccountsContext';
import { AddressDisplay } from '../../components/address/AddressDisplay';
import { AddressDisplayList } from '../../components/address/AddressDisplayList';
import { AddressSelect } from '../../components/address/AddressSelect';
import { CollectionHeader } from '../../components/badges/CollectionHeader';
import { MetadataDisplay } from '../../components/badges/MetadataInfoDisplay';
import { BlockinDisplay } from '../../components/blockin/BlockinDisplay';
import { Action, ActionCard } from '../../components/collection-page/ActionsTab';
import { ListActivityTab } from '../../components/collection-page/ListActivityDisplay';
import {
  ClaimCriteriaDisplay,
  ClaimInputs,
  generateCodesFromSeed
} from '../../components/collection-page/transferability/OffChainTransferabilityTab';
import { GenericModal } from '../../components/display/GenericModal';
import IconButton from '../../components/display/IconButton';
import { InformationDisplayCard } from '../../components/display/InformationDisplayCard';
import QrCodeDisplay from '../../components/display/QrCodeDisplay';
import { TableRow } from '../../components/display/TableRow';
import { TxHistory } from '../../components/display/TransactionHistory';
import { Tabs } from '../../components/navigation/Tabs';
import { OffChainClaim } from '../../components/tx-timelines/step-items/OffChainBalancesStepItem';
import { ReportedWrapper } from '../../components/wrappers/ReportedWrapper';
import { getMaxUses, getPluginDetails } from '../../integrations/integrations';
import { PluginCodesModal } from '../../integrations/codes';

const { Content } = Layout;

export const AddressListClaimModal = ({
  claim,
  visible,
  setVisible,
  onSuccess
}: {
  claim: OffChainClaim<bigint>;
  visible: boolean;
  setVisible: (visible: boolean) => void;
  onSuccess: () => Promise<void>;
}) => {
  return (
    <GenericModal visible={visible} setVisible={setVisible} title="Claim">
      <div className="flex-center">
        <InformationDisplayCard md={24} xs={24} sm={24} title="" style={{ textAlign: 'left' }} noBorder inheritBg>
          <div className="flex-center flex-column">
            {claim && (
              <ClaimInputs
                claimId={claim?.claimId}
                plugins={claim?.plugins}
                docId={claim?.claimId}
                onSuccess={async () => {
                  setVisible(false);
                  await onSuccess();

                  notification.success({
                    message: 'Success',
                    description: `You have successfully been added to the list.`
                  });
                }}
              />
            )}
          </div>
        </InformationDisplayCard>
      </div>
    </GenericModal>
  );
};

export const hasAlreadyClaimed = (claim: OffChainClaim<bigint>, chain: ReturnType<typeof useChainContext>) => {
  if (!claim.plugins.find((plugin) => plugin.id === 'requiresProofOfAddress')) {
    // If the claim does not require proof of address, then we don't know until the user selects an address and that is too late to display on criteria.
    return false;
  }

  return getPluginDetails('numUses', claim?.plugins ?? [])?.publicState.claimedUsers[chain.cosmosAddress] !== undefined;
};

export const BitBadgesClaimLogo = () => {
  return (
    <div className="flex-center" style={{ fontSize: 24, fontWeight: 'bolder', alignContent: 'center', alignItems: 'center' }}>
      <img src="/images/bitbadgeslogotext.png" style={{ height: 28, paddingRight: 4 }} />
      Claim
    </div>
  );
};

export const AddressListClaimCardWithModal = ({
  claim,
  onSuccess,
  buttonNode,
  description,
  unknownPublicState
}: {
  claim: OffChainClaim<bigint>;
  onSuccess: () => Promise<void>;
  buttonNode?: ReactNode;
  description?: string;
  unknownPublicState?: boolean;
}) => {
  const chain = useChainContext();
  const [visible, setVisible] = useState(false);

  const alreadyClaimed = hasAlreadyClaimed(claim, chain);
  const maxUses = getMaxUses(claim?.plugins ?? []);
  const numUsesPlugin = getPluginDetails('numUses', claim?.plugins ?? []);
  const exceedsMaxUses = numUsesPlugin && numUsesPlugin.publicState.numUses >= maxUses;

  return (
    <>
      <InformationDisplayCard title={<BitBadgesClaimLogo />} subtitle={description ?? "Claim a spot on this list if you're eligible."}>
        <br />
        {claim && <ClaimCriteriaDisplay plugins={claim?.plugins} unknownPublicState={unknownPublicState} />}
        {!alreadyClaimed && !exceedsMaxUses && claim && (
          <div className="flex-center">
            <button
              className="landing-button"
              disabled={alreadyClaimed}
              onClick={() => {
                setVisible(!visible);
              }}>
              <Tooltip title={exceedsMaxUses ? 'All spots on the list have been taken.' : 'Claim a spot on this list.'}>Claim</Tooltip>
            </button>
          </div>
        )}
        {buttonNode}
        <AddressListClaimModal claim={claim} visible={visible} setVisible={setVisible} onSuccess={onSuccess} />
      </InformationDisplayCard>
    </>
  );
};

function AddressListPage() {
  const router = useRouter();
  const chain = useChainContext();

  const { listId } = router.query;

  const [tab, setTab] = useState('overview');
  const [list, setList] = useState<BitBadgesAddressList<bigint>>();
  const [fetchError, setFetchError] = useState<string>();

  const [addressToCheck, setAddressToCheck] = useState<string>('');
  const [modalIsVisible, setModalIsVisible] = useState<boolean>(false);
  const [codesModalVisible, setCodesModalVisible] = useState<boolean>(false);

  const actions: Action[] = [];

  const isPrivate = list?.private;
  const isOnChain = list?.listId && !list.listId.includes('_');
  if (!isOnChain && chain.cosmosAddress == list?.createdBy && list?.createdBy) {
    actions.push({
      title: 'Update List',
      description: 'Update the details of this list (i.e. what addresses are included?, the metadata, etc.)',
      showModal: () => {
        router.push('/update/' + listId);
      }
    });

    actions.push({
      title: 'Delete List',
      description: 'Permanently delete this list.',
      showModal: async () => {
        confirm('This list will be permanently deleted. Please confirm this action.');
        await deleteAddressLists({ listIds: [listId as string] });
        router.push('/');
      }
    });
  }

  useEffect(() => {
    if (codesModalVisible) {
      async function fetchPrivateParams() {
        if (!list) return;

        const res = await BitBadgesApi.getAddressLists({
          listsToFetch: [{ listId: list.listId, fetchPrivateParams: true }]
        });

        const newList = res.addressLists[0];
        setList(
          new BitBadgesAddressList<bigint>({
            ...list,
            editClaims: newList.editClaims
          })
        );
      }

      fetchPrivateParams();
    }
  }, [codesModalVisible]);

  const fetchMore = useCallback(
    async function fetch(currList?: BitBadgesAddressList<bigint>) {
      if (!listId) return;
      try {
        if (currList && !currList?.views?.listActivity?.pagination.hasMore) return;

        const list = currList;
        let newList: BitBadgesAddressList<bigint>;
        const lists = await getAddressLists({
          listsToFetch: [
            {
              listId: listId as string,
              viewsToFetch: [
                {
                  viewId: 'default',
                  viewType: 'listActivity',
                  bookmark: list?.views?.listActivity?.pagination.bookmark ?? ''
                }
              ]
            }
          ]
        });

        newList = lists.addressLists[0];
        if (newList.reported) {
          newList.metadata = Metadata.DefaultPlaceholderMetadata();
        }

        setList(
          new BitBadgesAddressList({
            ...newList,
            listsActivity: [...(list?.listsActivity ?? []), ...(newList.listsActivity ?? [])],
            views: {
              listActivity: {
                ...newList.views.listActivity,
                ids: [...(list?.views?.listActivity?.ids ?? []), ...(newList.views.listActivity?.ids ?? [])],
                pagination: newList.views.listActivity?.pagination ?? list?.views?.listActivity?.pagination ?? { hasMore: false, bookmark: '' },
                type: newList.views.listActivity?.type ?? list?.views?.listActivity?.type ?? 'listActivity'
              }
            }
          })
        );
        const toFetch = [];
        if (newList.createdBy) toFetch.push(newList.createdBy);
        if (newList.aliasAddress) toFetch.push(newList.aliasAddress);
        if (toFetch.length > 0) await fetchAccounts(toFetch);
      } catch (e: any) {
        console.error(e);
        setFetchError(e.message);
      }
    },
    [listId]
  );

  useEffect(() => {
    fetchMore(list);
  }, [fetchMore]);

  let isAddressInList = list?.addresses.includes(addressToCheck) || list?.addresses.includes(convertToCosmosAddress(addressToCheck));

  if (!list?.whitelist) {
    isAddressInList = !isAddressInList;
  }

  const tabInfo = [];
  tabInfo.push({ key: 'overview', content: 'Overview' }, { key: 'activity', content: 'Activity' });
  tabInfo.push({ key: 'history', content: 'Update History' });
  tabInfo.push({ key: 'actions', content: 'Actions' });

  const claimId = list?.editClaims && list.editClaims.length > 0 ? list.editClaims[0].claimId : undefined;
  const claim = list?.editClaims && list.editClaims.length > 0 ? list.editClaims[0] : undefined;

  const numUsesPlugin = getPluginDetails('numUses', claim?.plugins ?? []);
  const maxUses = getMaxUses(claim?.plugins ?? []);
  const exceedsMaxUses = numUsesPlugin && numUsesPlugin.publicState.numUses >= maxUses;
  const fetchedPlugins = claim?.plugins ?? [];
  const numCodes = getPluginDetails('codes', fetchedPlugins)?.publicParams.numCodes ?? 0;
  const seedCode = getPluginDetails('codes', fetchedPlugins)?.privateParams.seedCode;
  const codes = seedCode
    ? generateCodesFromSeed(seedCode, numCodes)
    : getPluginDetails('codes', fetchedPlugins)?.privateParams.codes?.map((x) => x) ?? [];

  return (
    <ReportedWrapper
      reported={!!list?.reported ?? false}
      node={
        <Content
          style={{
            textAlign: 'center',
            minHeight: '100vh'
          }}>
          <div
            style={{
              marginLeft: '3vw',
              marginRight: '3vw',
              paddingLeft: '1vw',
              paddingRight: '1vw',
              paddingTop: '20px'
            }}>
            {!fetchError && (
              <CollectionHeader listId={listId as string} collectionId={NEW_COLLECTION_ID} metadataOverride={list?.metadata} hideCollectionLink />
            )}
            {!list && !fetchError && <Spin size="large" />}
            {fetchError && (
              <>
                <div style={{ color: 'red' }}>
                  Oops! Something went wrong while fetching this list.
                  <br />
                  {fetchError}
                  <Divider />
                  {fetchError.includes('permission') || (fetchError.includes('Unauthorized') && <BlockinDisplay />)}
                </div>
              </>
            )}
            {!fetchError && list && (
              <>
                <Tabs tab={tab} tabInfo={tabInfo} setTab={setTab} theme="dark" fullWidth />
                {tab === 'activity' && (
                  <>
                    <br />
                    <ListActivityTab
                      activity={list?.listsActivity}
                      fetchMore={async () => {
                        await fetchMore(list);
                      }}
                      hasMore={list.views?.listActivity?.pagination.hasMore ?? true}
                    />
                  </>
                )}

                {tab === 'history' && (
                  <>
                    <div className="primary-text">
                      <br />
                      {!isOnChain && (
                        <div className="secondary-text">
                          <InfoCircleOutlined /> This address list is stored off-chain via the BitBadges servers. The creator can update or delete
                          this list at any time.
                        </div>
                      )}
                      {isOnChain && (
                        <div className="secondary-text">
                          <InfoCircleOutlined /> This address list is stored on-chain. The list is permanently frozen and non-deletable.
                        </div>
                      )}
                      <br />
                      {list?.updateHistory
                        .sort((a, b) => (a.blockTimestamp > b.blockTimestamp ? -1 : 1))
                        .map((update, i) => {
                          return <TxHistory tx={update} key={i} creationTx={i == list?.updateHistory.length - 1} />;
                        })}
                    </div>
                  </>
                )}

                {tab === 'overview' && (
                  <>
                    <br />
                    {
                      <div className="flex-center">
                        <Row className="flex-between full-width" style={{ alignItems: 'normal' }}>
                          <Col md={12} xs={24} sm={24} style={{ minHeight: 100, paddingLeft: 4, paddingRight: 4 }}>
                            <InformationDisplayCard title="Info">
                              {isOnChain && <TableRow label={'ID'} value={list.listId} labelSpan={9} valueSpan={15} />}
                              {!isOnChain && list && <TableRow label={'ID'} value={list.listId.split('_')[1]} labelSpan={9} valueSpan={15} />}

                              {!isOnChain && <TableRow label={'Access'} value={isPrivate ? 'Private' : 'Public'} labelSpan={9} valueSpan={15} />}
                              {list?.customData && <TableRow label={'ID'} value={list.customData} labelSpan={9} valueSpan={15} />}

                              {list?.createdBy && (
                                <TableRow
                                  label={'Created By'}
                                  value={
                                    <div className="flex-between" style={{ textAlign: 'right' }}>
                                      <div></div>
                                      <div className="flex-between flex-column" style={{ textAlign: 'right', padding: 0 }}>
                                        <AddressDisplay fontSize={13} addressOrUsername={list.createdBy} />
                                      </div>
                                    </div>
                                  }
                                  labelSpan={9}
                                  valueSpan={15}
                                />
                              )}
                              {list?.aliasAddress && (
                                <TableRow
                                  label={
                                    <>
                                      {'Alias'}
                                      <Tooltip
                                        color="black"
                                        title={
                                          'This is a fake address that is reserved to represent this list. It is not a real account and cannot initiate transactions. However, it has a portfolio and can receive badges.'
                                        }>
                                        <InfoCircleOutlined style={{ marginLeft: 8 }} />
                                      </Tooltip>
                                    </>
                                  }
                                  value={
                                    <div className="flex-between" style={{ textAlign: 'right' }}>
                                      <div></div>
                                      <div className="flex-between flex-column" style={{ textAlign: 'right', padding: 0 }}>
                                        <AddressDisplay fontSize={16} addressOrUsername={list.aliasAddress} />
                                      </div>
                                    </div>
                                  }
                                  labelSpan={7}
                                  valueSpan={17}
                                />
                              )}
                              <TableRow label={'Storage'} value={isOnChain ? 'On-Chain' : 'Off-Chain'} labelSpan={9} valueSpan={15} />
                            </InformationDisplayCard>
                            <br />

                            <MetadataDisplay
                              collectionId={0n}
                              metadataOverride={list?.metadata}
                              span={24}
                              isAddressListDisplay
                              metadataUrl={list?.uri}
                            />

                            {claim && (
                              <AddressListClaimCardWithModal
                                claim={claim}
                                onSuccess={async () => {
                                  const newLists = await BitBadgesApi.getAddressLists({
                                    listsToFetch: [
                                      {
                                        listId: listId as string
                                      }
                                    ]
                                  });
                                  setList(newLists.addressLists[0]);
                                }}
                                buttonNode={
                                  <div className="flex-center">
                                    {!exceedsMaxUses &&
                                      chain.loggedIn &&
                                      chain.cosmosAddress == list?.createdBy &&
                                      claim &&
                                      (list.private || list.viewableWithLink) && (
                                        <>
                                          <br />
                                          <br />
                                          <IconButton
                                            src={<LinkOutlined />}
                                            text="Claim Link"
                                            onClick={() => {
                                              setModalIsVisible(true);
                                            }}
                                            secondary
                                          />
                                        </>
                                      )}
                                    {fetchedPlugins.find((x) => x.id === 'codes') &&
                                      chain.cosmosAddress &&
                                      chain.cosmosAddress == list?.createdBy && (
                                        <div className="flex-center flex-column">
                                          <br />
                                          <IconButton
                                            src={<DatabaseOutlined />}
                                            text="Codes"
                                            onClick={() => {
                                              setCodesModalVisible(true);
                                            }}
                                            secondary
                                          />
                                          <PluginCodesModal
                                            codes={codes ?? []}
                                            listId={listId as string}
                                            visible={codesModalVisible}
                                            setVisible={setCodesModalVisible}
                                            password={getPluginDetails('password', fetchedPlugins)?.privateParams.password}
                                          />
                                        </div>
                                      )}
                                  </div>
                                }
                              />
                            )}
                          </Col>
                          <Col
                            md={12}
                            xs={24}
                            sm={24}
                            style={{
                              minHeight: 100,
                              paddingLeft: 4,
                              paddingRight: 4,
                              flexDirection: 'column'
                            }}>
                            {list && (
                              <>
                                <InformationDisplayCard title="Addresses">
                                  <AddressDisplayList users={list?.addresses || []} allExcept={!list?.whitelist} />

                                  <Divider />
                                  {list?.addresses.length > 10 && (
                                    <>
                                      <b>Address Checker</b>
                                      <AddressSelect defaultValue={addressToCheck} onUserSelect={setAddressToCheck} />
                                      <br />
                                      {addressToCheck ? (
                                        isAddressInList ? (
                                          <div className="flex-center">
                                            <div className="flex-center" style={{ alignItems: 'center' }}>
                                              <div className="primary-text" style={{ fontSize: 20, fontWeight: 'bolder' }}>
                                                <span className="primary-text inherit-bg" style={{ padding: 8, borderRadius: 4 }}>
                                                  ✅ Address is included in list
                                                </span>
                                              </div>
                                            </div>
                                          </div>
                                        ) : (
                                          <div className="flex-center">
                                            <div className="flex-center" style={{ alignItems: 'center' }}>
                                              <div className="primary-text" style={{ fontSize: 20, fontWeight: 'bolder' }}>
                                                <span className="primary-text inherit-bg" style={{ padding: 8, borderRadius: 4 }}>
                                                  ❌ Address is NOT included in list
                                                </span>
                                              </div>
                                            </div>
                                          </div>
                                        )
                                      ) : (
                                        <></>
                                      )}
                                    </>
                                  )}
                                </InformationDisplayCard>
                              </>
                            )}
                          </Col>
                        </Row>
                      </div>
                    }
                  </>
                )}

                {tab === 'actions' && (
                  <>
                    <div className="full-width" style={{ fontSize: 20 }}>
                      <div
                        className="primary-text flex-center flex-wrap"
                        style={{
                          padding: '0',
                          textAlign: 'center',
                          marginTop: 20
                        }}>
                        {actions.map((action, idx) => {
                          return <ActionCard key={idx} action={action} />;
                        })}
                      </div>
                      {actions.length == 0 && (
                        <Empty className="primary-text" description="No actions can be taken." image={Empty.PRESENTED_IMAGE_SIMPLE} />
                      )}
                    </div>
                  </>
                )}
              </>
            )}
          </div>
          <ClaimUrlModal visible={modalIsVisible} setVisible={setModalIsVisible} claimId={claimId as string} />
        </Content>
      }
    />
  );
}

export const ClaimUrlModal = ({ visible, setVisible, claimId }: { visible: boolean; setVisible: (visible: boolean) => void; claimId: string }) => {
  const [surveyDescription, setSurveyDescription] = useState<string>('');

  const url = claimId ? 'https://bitbadges.io/claims/' + (claimId as string) + '?description=' + surveyDescription : '';

  return (
    <GenericModal visible={visible} setVisible={setVisible} title="Generate URL / QR Code">
      <div className="flex-center flex-column">
        <div className="secondary-text" style={{ marginTop: 8, textAlign: 'left', width: '90%' }}>
          <InfoCircleOutlined /> Since this list is private / link-only, you may want to allow users to claim a spot on the list without revealing the
          list of addresses. To do this, you can generate a custom URL below. Simply have the user visit the URL and they will be able to claim a spot
          on the list without learning the private contents. You can provide them a description to be displayed,
          <br />
          <br />
          If the targeted users are approved to view the list, you do not need this feature. Simply give them the normal list URL.
        </div>
        <br />
        <Input.TextArea
          autoSize
          value={surveyDescription}
          onChange={(e) => {
            setSurveyDescription(e.target.value);
          }}
          placeholder="Description"
          style={{ width: '90%' }}
        />

        <Divider />

        <div className="secondary-text" style={{ textAlign: 'center', width: '90%', marginTop: 8 }}>
          <b>URL:</b> {url}
        </div>
        <div className="flex-center">
          <a href={url} target="_blank" rel="noopener noreferrer">
            Open URL
          </a>

          <Typography.Text className="primary-text" copyable={{ text: url }} style={{ marginLeft: 8 }}>
            Copy URL
          </Typography.Text>
        </div>
        <Divider />
        <QrCodeDisplay value={url} size={256} />
      </div>
    </GenericModal>
  );
};

export default AddressListPage;
