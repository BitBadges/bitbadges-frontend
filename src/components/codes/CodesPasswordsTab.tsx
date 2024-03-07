import { Divider, Empty, Spin } from 'antd';
import { CodesAndPasswords, CollectionApprovalWithDetails } from 'bitbadgesjs-sdk';
import { useState } from 'react';

import { useCollection } from '../../bitbadges-api/contexts/collections/CollectionsContext';
import { CodesDisplay } from './CodesPasswordsDisplay';
import { DevMode } from '../common/DevMode';
import { Pagination } from '../common/Pagination';
import { TransferabilityDisplay } from '../collection-page/transferability/TransferabilityDisplay';

export function CodesPasswordsTab({
  collectionId,
  codesAndPasswords,
  badgeId,
  approvalId
}: {
  collectionId: bigint;
  codesAndPasswords?: CodesAndPasswords[];
  badgeId?: bigint;
  approvalId?: string;
}) {
  const [address, setAddress] = useState<string>('');
  const [currPage, setCurrPage] = useState<number>(1);

  const collection = useCollection(collectionId);

  const approvalsForClaims: Array<CollectionApprovalWithDetails<bigint>> = [];
  const approvals = collection?.collectionApprovals ?? [];

  //Filter nonMint, non-matching IDs, and empty codes/passwords
  const normalizedCodesAndPasswords = [];
  for (let i = 0; i < approvals.length; i++) {
    const approval = approvals[i];
    if (approval.fromList.checkAddress('Mint')) {
      if (approvalId && approvalId !== approval.approvalId) continue;
      if (codesAndPasswords && (codesAndPasswords[i]?.codes.length > 0 || codesAndPasswords[i]?.password)) {
        approvalsForClaims.push(approval);
        normalizedCodesAndPasswords.push(codesAndPasswords[i]);
      }
    }
  }

  const numActiveClaims = approvalsForClaims.length;
  const currApproval = currPage > 0 && currPage <= approvalsForClaims.length ? approvalsForClaims[currPage - 1] : undefined;

  const approvalItem = currApproval ?? undefined;
  const approvalCriteria = approvalItem?.approvalCriteria;
  const claimItem = approvalCriteria?.merkleChallenge?.root ? approvalCriteria?.merkleChallenge : undefined;

  if (!collection || !codesAndPasswords) return <Spin />;

  return (
    <div
      className="primary-text"
      style={{
        justifyContent: 'center',
        width: '100%'
      }}
    >
      {numActiveClaims > 1 && (
        <>
          <Pagination currPage={currPage} onChange={setCurrPage} total={numActiveClaims} pageSize={1} />
          {approvalItem && (
            <TransferabilityDisplay
              collectionId={collectionId}
              approval={approvalItem}
              hideActions
              allApprovals={collection?.collectionApprovals ?? []}
              address={address}
              setAddress={setAddress}
            />
          )}
          <Divider />
        </>
      )}
      <div className="">
        {currApproval && (
          <>
            <CodesDisplay
              collectionId={collectionId}
              approval={currApproval}
              codes={normalizedCodesAndPasswords ? normalizedCodesAndPasswords[currPage - 1]?.codes : []}
              claimPassword={normalizedCodesAndPasswords ? normalizedCodesAndPasswords[currPage - 1]?.password : ''}
            />
          </>
        )}
      </div>
      {numActiveClaims == 0 && (
        <Empty
          className="primary-text"
          description={`No active claims found${badgeId ? ' for this badge' : ''}.`}
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      )}

      <DevMode obj={claimItem} />
    </div>
  );
}
