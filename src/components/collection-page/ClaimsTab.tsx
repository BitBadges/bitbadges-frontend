import { Button, Divider, Empty } from 'antd';
import { Numberify } from 'bitbadgesjs-utils';
import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';
import { useChainContext } from '../../bitbadges-api/contexts/ChainContext';
import { useCollectionsContext } from '../../bitbadges-api/contexts/CollectionsContext';
import { ClaimDisplay } from '../claims/ClaimDisplay';
import { DevMode } from '../common/DevMode';
import { Pagination } from '../common/Pagination';
import { CreateTxMsgClaimBadgeModal } from '../tx-modals/CreateTxMsgClaimBadge';
import { FetchCodesModal } from '../tx-modals/FetchCodesModal';
import { MSG_PREVIEW_ID } from '../tx-timelines/TxTimeline';

export function ClaimsTab({ collectionId, codes, passwords, isModal, badgeId }: {
  collectionId: bigint;
  codes?: string[][];
  passwords?: string[];
  isModal?: boolean
  badgeId?: bigint;
}) {
  const collections = useCollectionsContext();
  const collectionsRef = useRef(collections);
  const chain = useChainContext();
  const router = useRouter();
  const isPreview = collectionId === MSG_PREVIEW_ID;

  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [code, setCode] = useState<string>("");
  const [currPage, setCurrPage] = useState<number>(1);
  const [whitelistIndex, setWhitelistIndex] = useState<number>();
  const [fetchCodesModalIsVisible, setFetchCodesModalIsVisible] = useState<boolean>(false);

  const collection = collections.getCollection(collectionId);
  const claimItem = collection?.claims.length && collection?.claims.length > currPage - 1 ? collection?.claims[currPage - 1] : undefined;
  const query = router.query;
  const numActiveClaims = collection?.views.claimsById?.pagination.total ?? 0;

  //Auto scroll to page upon claim ID
  useEffect(() => {
    if (query.claimId && typeof query.claimId === 'string') {
      setCurrPage(Numberify(query.claimId));
    }
  }, [query.claimId]);


  useEffect(() => {
    async function fetchClaims() {
      if (claimItem) return;

      //TODO: fetch exact claim instead of just fetching next page by id (should be fine for now as collections will not have >50 active claims (2 pages))
      if (!claimItem) {
        await collectionsRef.current.fetchNextForViews(collectionId, ['claimsById']);
      }
    }

    fetchClaims();
  }, [claimItem, collectionId]);

  if (isPreview) return <Empty
    className='primary-text'
    description={
      "Claim displays are not supported for previews."
    }
    image={Empty.PRESENTED_IMAGE_SIMPLE}
  />



  return (
    <div className='primary-text'
      style={{
        justifyContent: 'center',
      }}>
      <div className='flex-center'>
        {!isModal && collection?.manager === chain.cosmosAddress && collection?.claims.length && <div>
          {"To distribute the codes and/or passwords, click the button below. This is a manager-only privilege."}
          <br />
          <Button
            className='screen-button primary-blue-bg'
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
        {!isModal && collection?.manager !== chain.cosmosAddress && collection?.claims.length && <div>
          {"If you are the manager of this collection, please connect your wallet to distribute the codes/password."}
        </div>}
      </div>
      <Pagination currPage={currPage} onChange={setCurrPage} total={numActiveClaims} pageSize={1} />

      <div className='flex-center'>
        {claimItem &&
          <>
            <ClaimDisplay
              collectionId={collectionId}
              claim={claimItem}
              openModal={(code, whitelistIndex) => {
                setModalVisible(true);
                setCode(code ? code : "");
                setWhitelistIndex(whitelistIndex);
              }}
              isCodeDisplay={codes ? true : false}
              codes={codes ? codes[Numberify(claimItem.claimId - 1n)] : []}
              claimPassword={passwords ? passwords[Numberify(claimItem.claimId - 1n)] : ""}
            />
          </>
        }

      </div>

      {
        !collection?.claims.length && <Empty
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
        claimItem={claimItem}
        whitelistIndex={whitelistIndex}
      />
    </div >
  );
}

