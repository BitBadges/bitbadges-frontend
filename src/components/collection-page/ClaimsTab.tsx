import { Button, Divider, Empty } from 'antd';
import { CodesAndPasswords, MerkleChallengeWithDetails, getCurrentValueForTimeline } from 'bitbadgesjs-utils';
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

  const collection = collections.collections[collectionId.toString()]

  const approvedTransfersForClaims = [];
  const merkleChallenges: MerkleChallengeWithDetails<bigint>[] = [];

  const currentManager = getCurrentValueForTimeline(collection?.managerTimeline ?? [])?.manager ?? "";
  const approvedTransfers = getCurrentValueForTimeline(collection?.collectionApprovedTransfersTimeline ?? [])?.collectionApprovedTransfers ?? [];

  //TODO: This is hardcoded for length == 0 for now
  for (const approvedTransfer of approvedTransfers) {
    for (const approvalDetails of approvedTransfer.approvalDetails) {
      if (approvedTransfer.fromMappingId === "Mint" && approvedTransfer.initiatedByMappingId !== "Manager") {
        merkleChallenges.push(...approvalDetails.merkleChallenges);
        approvedTransfersForClaims.push(approvedTransfer);
      }
    }
  }

  const numActiveClaims = approvedTransfersForClaims.length;
  const numMerkleChallenges = merkleChallenges.length;

  const claimItem = numActiveClaims > currPage - 1 ? merkleChallenges[currPage - 1] : undefined;
  const approvedTransferItem = numActiveClaims > currPage - 1 ? approvedTransfersForClaims[currPage - 1] : undefined;
  const query = router.query;

  //Auto scroll to page upon claim ID query in URL
  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect: set claim auto');
    if (query.claimId && typeof query.claimId === 'string') {
      const idx = merkleChallenges.findIndex((x) => x.challengeId === query.claimId);
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

  return (
    <div className='primary-text'
      style={{
        justifyContent: 'center',
      }}>

      <Pagination currPage={currPage} onChange={setCurrPage} total={numActiveClaims} pageSize={1} showOnSinglePage />
      <br />
      <div className='flex-center'>
        {approvedTransfersForClaims[currPage - 1] &&
          <>
            <ClaimDisplay
              collectionId={collectionId}
              approvedTransfer={approvedTransfersForClaims[currPage - 1]}
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
        approvedTransfer={approvedTransferItem}
        claimItem={claimItem}
        whitelistIndex={whitelistIndex}
        recipient={recipient}
      />
      <Divider />
      <div className='flex-center'>

        {!isModal && currentManager === chain.cosmosAddress && numMerkleChallenges > 0 && <div>
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
        {!isModal && currentManager !== chain.cosmosAddress && numActiveClaims > 0 && merkleChallenges.length > 0 && <div>
          {"If you are the manager of this collection, please connect your wallet to distribute the codes/password."}
        </div>}
      </div>
    </div >
  );
}

