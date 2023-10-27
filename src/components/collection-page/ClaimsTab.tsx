import { Empty, Spin } from 'antd';
import { CodesAndPasswords, CollectionApprovalWithDetails, isInAddressMapping } from 'bitbadgesjs-utils';
import { useState } from 'react';
import { useCollectionsContext } from '../../bitbadges-api/contexts/collections/CollectionsContext';
import { ClaimDisplay } from '../claims/ClaimDisplay';
import { DevMode } from '../common/DevMode';
import { Pagination } from '../common/Pagination';

export function ClaimsTab({ collectionId, codesAndPasswords, badgeId }: {
  collectionId: bigint;
  codesAndPasswords?: CodesAndPasswords[]
  badgeId?: bigint;
}) {
  const collections = useCollectionsContext();

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
  

  if (!collection) return <Spin />

  return (
    <div className='dark:text-white'
      style={{
        justifyContent: 'center',
        width: '100%',
      }}>
      
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

