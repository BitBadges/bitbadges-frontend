import { WarningOutlined } from '@ant-design/icons';
import { Empty, Spin, notification } from 'antd';
import { CodesAndPasswords, CollectionApprovalWithDetails, isInAddressMapping } from 'bitbadgesjs-utils';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useCollectionsContext } from '../../bitbadges-api/contexts/collections/CollectionsContext';
import { INFINITE_LOOP_MODE } from '../../constants';
import { ClaimDisplay } from '../claims/ClaimDisplay';
import { DevMode } from '../common/DevMode';
import { Pagination } from '../common/Pagination';

export function ClaimsTab({ collectionId, codesAndPasswords, badgeId }: {
  collectionId: bigint;
  codesAndPasswords?: CodesAndPasswords[]
  badgeId?: bigint;
}) {
  const collections = useCollectionsContext();
  const router = useRouter();



  const [currPage, setCurrPage] = useState<number>(1);

  const collection = collections.getCollection(collectionId)

  const approvalsForClaims: CollectionApprovalWithDetails<bigint>[] = [];
  const approvals = collection?.collectionApprovals ?? [];

  for (const approval of approvals) {
    if (isInAddressMapping(approval.fromMapping, 'Mint')) {
      approvalsForClaims.push(approval);
    }
  }

  const numActiveClaims = approvalsForClaims.length;
  const currApproval = currPage > 0 && currPage <= approvalsForClaims.length ? approvalsForClaims[currPage - 1] : undefined;

  const approvalItem = numActiveClaims > currPage - 1 ? currApproval : undefined;
  const approvalCriteria = approvalItem?.approvalCriteria

  //TODO: This is hardcoded for only one merkle challenge. Technically an assumption, although it is a rare case where they may have more than one.
  const claimItem = approvalCriteria?.merkleChallenge?.root ? approvalCriteria?.merkleChallenge : undefined;
  const query = router.query;

  //Auto scroll to page upon claim ID query in URL
  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect: set claim auto');
    if (query.approvalId && typeof query.approvalId === 'string') {
      const idx = approvals.findIndex((x) => x.approvalId === query.approvalId);
      if (idx >= 0) setCurrPage(idx + 1);
      notification.info({
        message: 'Code / Password',
        description: `Code / password was found in the URL. We have automatically inserted it into the input field for you.`,
      });
    }
  }, [query.approvalId]);


  let isRefreshing = false;
  if (collection?.cachedCollectionMetadata?._isUpdating || collection?.cachedBadgeMetadata.find(badge => badge.metadata._isUpdating)) {
    isRefreshing = true;
  }

  if (!collection) return <Spin />

  return (
    <div className='dark:text-white'
      style={{
        justifyContent: 'center',
        width: '100%',
      }}>
      {isRefreshing && <>
        <div className='flex-center' style={{ textAlign: 'center' }}>
          <WarningOutlined style={{ marginRight: '8px', color: 'orange' }} />
          The metadata for this claim is currently being refreshed. Certain information may be incomplete or not up to date.
        </div>
        <br />
      </>}
      <Pagination currPage={currPage} onChange={setCurrPage} total={numActiveClaims} pageSize={1} />
      <br />

      <div className=''>
        {currApproval &&
          <>
            <ClaimDisplay
              collectionId={collectionId}
              approvals={approvals}
              approval={currApproval}
              isCodeDisplay={codesAndPasswords ? true : false}
              codes={codesAndPasswords ? codesAndPasswords[currPage - 1]?.codes : []}
              claimPassword={codesAndPasswords ? codesAndPasswords[currPage - 1]?.password : ""}
            />
          </>
        }

      </div>
      {
        numActiveClaims == 0 && <Empty
          className='dark:text-white'
          description={`No active claims found${badgeId ? ' for this badge' : ''}.`}
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      }

      <DevMode obj={claimItem} />


    </div >
  );
}

