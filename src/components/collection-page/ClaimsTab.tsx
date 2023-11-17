import { Empty, Spin } from 'antd';
import { CodesAndPasswords, CollectionApprovalWithDetails, isInAddressMapping } from 'bitbadgesjs-utils';
import { useState } from 'react';

import { useCollection } from '../../bitbadges-api/contexts/collections/CollectionsContext';
import { CodesDisplay } from '../claims/CodesPasswordsDisplay';
import { DevMode } from '../common/DevMode';
import { Pagination } from '../common/Pagination';

export function ClaimsTab({ collectionId, codesAndPasswords, badgeId }: {
  collectionId: bigint;
  codesAndPasswords?: CodesAndPasswords[]
  badgeId?: bigint;
}) {


  const [currPage, setCurrPage] = useState<number>(1);

  const collection = useCollection(collectionId)

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
  const claimItem = approvalCriteria?.merkleChallenge?.root ? approvalCriteria?.merkleChallenge : undefined;


  if (!collection) return <Spin />

  return (
    <div className='primary-text'
      style={{
        justifyContent: 'center',
        width: '100%',
      }}>

      <Pagination currPage={currPage} onChange={setCurrPage} total={numActiveClaims} pageSize={1} />


      <div className=''>
        {currApproval &&
          <>
            <CodesDisplay
              collectionId={collectionId}
              approval={currApproval}
              codes={codesAndPasswords ? codesAndPasswords[currPage - 1]?.codes : []}
              claimPassword={codesAndPasswords ? codesAndPasswords[currPage - 1]?.password : ""}
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


    </div >
  );
}

