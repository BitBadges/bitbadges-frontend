import { InfoCircleOutlined, WarningOutlined } from '@ant-design/icons';
import { Button, Divider, Empty, Spin } from 'antd';
import { CodesAndPasswords, CollectionApprovedTransferWithDetails, getCurrentValueForTimeline } from 'bitbadgesjs-utils';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useChainContext } from '../../bitbadges-api/contexts/ChainContext';
import { useCollectionsContext } from '../../bitbadges-api/contexts/CollectionsContext';
import { MSG_PREVIEW_ID } from '../../bitbadges-api/contexts/TxTimelineContext';
import { INFINITE_LOOP_MODE } from '../../constants';
import { ClaimDisplay } from '../claims/ClaimDisplay';
import { DevMode } from '../common/DevMode';
import { Pagination } from '../common/Pagination';
import { CreateTxMsgClaimBadgeModal } from '../tx-modals/CreateTxMsgClaimBadge';
import { FetchCodesModal } from '../tx-modals/FetchCodesModal';

export function ClaimsTab({ collectionId, codesAndPasswords, isModal, badgeId }: {
  collectionId: bigint;
  codesAndPasswords?: CodesAndPasswords[]
  isModal?: boolean
  badgeId?: bigint;
}) {
  const collections = useCollectionsContext();
  const chain = useChainContext();
  const router = useRouter();
  const isPreview = collectionId === MSG_PREVIEW_ID;

  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [code, setCode] = useState<string>("");
  const [currPage, setCurrPage] = useState<number>(1);
  const [whitelistIndex, setWhitelistIndex] = useState<number>();
  const [fetchCodesModalIsVisible, setFetchCodesModalIsVisible] = useState<boolean>(false);
  const [recipient, setRecipient] = useState<string>(chain.address);
  const [approvalDetailsIdx, setApprovalDetailsIdx] = useState<number>(0);

  const collection = collections.collections[collectionId.toString()]

  const approvedTransfersForClaims: CollectionApprovedTransferWithDetails<bigint>[] = [];

  const currentManager = getCurrentValueForTimeline(collection?.managerTimeline ?? [])?.manager ?? "";
  const approvedTransfers = collection?.collectionApprovedTransfers ?? [];

  for (const approvedTransfer of approvedTransfers) {
    if (approvedTransfer.approvalDetails.find(x => x.predeterminedBalances.precalculationId)) {
      approvedTransfersForClaims.push(approvedTransfer);
    }
  }

  const numActiveClaims = approvedTransfersForClaims.length;


  useEffect(() => {
    if (approvalDetailsIdx >= approvedTransfersForClaims[currPage - 1]?.approvalDetails.length) {
      setApprovalDetailsIdx(0);
    }
  }, [currPage])

  const approvedTransferItem = numActiveClaims > currPage - 1 ? approvedTransfersForClaims[currPage - 1] : undefined;
  const approvalDetails = approvedTransferItem?.approvalDetails[approvalDetailsIdx];

  //TODO: This is hardcoded for only one merkle challenge. Technically an assumption, although it is a rare case where they may have more than one.
  const claimItem = (approvalDetails?.merkleChallenges ?? [])?.length > 0 ? approvalDetails?.merkleChallenges[0] : undefined;
  const query = router.query;
  const hasMerkleChallenge = approvedTransfers.find(x => x.approvalDetails.find(y => y.merkleChallenges.length > 0));

  //Auto scroll to page upon claim ID query in URL
  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect: set claim auto');
    if (query.claimId && typeof query.claimId === 'string') {
      const idx = approvedTransfers.findIndex((x) => x.approvalDetails.find(y => y.merkleChallenges.find(z => z.challengeId === query.claimId)));
      const approvalIdx = approvedTransfers[idx]?.approvalDetails.findIndex(y => y.merkleChallenges.find(z => z.challengeId === query.claimId));

      if (approvalIdx >= 0) setApprovalDetailsIdx(approvalIdx);
      if (idx >= 0) setCurrPage(idx + 1);
    }
  }, [query.claimId]);




  if (isPreview) return <Empty
    className='primary-text'
    description={
      "Claim displays are not supported for previews."
    }
    image={Empty.PRESENTED_IMAGE_SIMPLE}
  />

  //Get IPFS cid and path
  let currClaimCid = '';
  if (claimItem?.uri.startsWith('ipfs://')) {
    currClaimCid = claimItem.uri.split('ipfs://')[1];
    currClaimCid = currClaimCid.split('/')[0];
  }

  let isRefreshing = false;
  if (collection?.cachedCollectionMetadata?._isUpdating || collection?.cachedBadgeMetadata.find(badge => badge.metadata._isUpdating)) {
    isRefreshing = true;
  }

  if (!collection) return <Spin />

  return (
    <div className='primary-text'
      style={{
        justifyContent: 'center',
        width: '100%',
      }}>
      {isRefreshing && <>
        <div className='flex-center' style={{ textAlign: 'center' }}>
          <WarningOutlined style={{ marginRight: '8px', color: 'orange' }} />
          The metadata for this claim is currently being refreshed. Certain metadata may not be up to date.
        </div>
        <br />
      </>}
      <Pagination currPage={currPage} onChange={setCurrPage} total={numActiveClaims} pageSize={1} showOnSinglePage />
      <br />
      {approvedTransfersForClaims[currPage - 1].approvalDetails.length > 1 && <>
        <div className=''>
          <br />
          <b>Approval Criteria #{approvalDetailsIdx + 1}</b>
          <br />
          <InfoCircleOutlined style={{ marginRight: '8px' }} /> Only one of the {approvedTransfersForClaims[currPage - 1].approvalDetails.length} approvals needs to be satisfied to claim this badge.
          <Pagination currPage={approvalDetailsIdx + 1} onChange={
            (page) => {
              setApprovalDetailsIdx(page - 1);
            }
          }
            total={approvedTransfersForClaims[currPage - 1].approvalDetails.length} pageSize={1} showOnSinglePage />
          <br />
        </div>
      </>}

      <div className='flex-center'>
        {approvedTransfersForClaims[currPage - 1] && approvalDetails &&
          <>
            <ClaimDisplay
              collectionId={collectionId}
              approvedTransfer={approvedTransfersForClaims[currPage - 1]}
              approvalDetails={approvalDetails}
              openModal={(_x: any, leafIndex?: number) => {
                setWhitelistIndex(leafIndex);
                setModalVisible(true);
              }}
              code={code}
              setCode={setCode}
              recipient={recipient}
              setRecipient={setRecipient}
              isCodeDisplay={codesAndPasswords ? true : false}
              codes={codesAndPasswords ? codesAndPasswords.find(x => x.cid === currClaimCid)?.codes : []}
              claimPassword={codesAndPasswords ? codesAndPasswords.find(x => x.cid === currClaimCid)?.password : ""}
            />
          </>
        }

      </div>
      {/* <Divider />
      <Typography.Text strong style={{ fontSize: 20 }} className='primary-text'>Approvals</Typography.Text>
      <br />
      <br />
      {
        <div className='flex-center full-width'>
          {getApprovalsDisplay(
            [approvedTransfersForClaims[currPage - 1]],
            collection,
          )}
        </div>
      } */}
      {
        numActiveClaims == 0 && <Empty
          className='primary-text'
          description={`No active claims found${badgeId ? ' for this badge' : ''}.`}
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      }


      <DevMode obj={claimItem} />
      <CreateTxMsgClaimBadgeModal
        collectionId={collectionId}
        visible={modalVisible}
        setVisible={setModalVisible}
        code={code}
        approvalDetails={approvedTransferItem?.approvalDetails[approvalDetailsIdx]}
        claimItem={claimItem}
        whitelistIndex={whitelistIndex}
        recipient={recipient}
      />
      <Divider />
      <div className='flex-center'>

        {!isModal && currentManager === chain.cosmosAddress && hasMerkleChallenge && <div>
          {"To distribute the codes and/or passwords, click the button below. This is a manager-only privilege."}
          <br />
          <Button
            className='styled-button primary-blue-bg'
            style={{ marginTop: '12px' }}
            onClick={() => {
              setFetchCodesModalIsVisible(true);
            }}
          >
            {"Distribute Codes and/or Passwords"}
          </Button>

          <FetchCodesModal
            visible={fetchCodesModalIsVisible}
            setVisible={setFetchCodesModalIsVisible}
            collectionId={collectionId}
          />
          <Divider />
        </div>}
        {!isModal && currentManager !== chain.cosmosAddress && numActiveClaims > 0 && hasMerkleChallenge && <div>
          {"If you are the manager of this collection, please connect your wallet to distribute the codes/password."}
        </div>}
      </div>
    </div >
  );
}

