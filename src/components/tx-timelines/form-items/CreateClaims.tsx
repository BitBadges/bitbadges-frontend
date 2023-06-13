import { Balance, convertBalance } from 'bitbadgesjs-proto';
import { BigIntify, ClaimInfoWithDetails, DistributionMethod, TransferWithIncrements } from 'bitbadgesjs-utils';
import { useCollectionsContext } from '../../../bitbadges-api/contexts/CollectionsContext';
import { DevMode } from '../../common/DevMode';
import { ClaimSelect } from '../../transfers/TransferOrClaimSelect';
import { MSG_PREVIEW_ID } from '../TxTimeline';

//TODO: Create Claims - Select type (codes vs direct transfers vs whitelist vs anyone) dynamically instead of hardcoding to jusst one distributionMethod
//Also rename from createclaims to something more generic. Use this as 
export function CreateClaims({
  distributionMethod,
  claims,
  setClaims,
  transfers,
  setTransfers,
  balancesToDistribute
}: {
  distributionMethod: DistributionMethod;
  claims: (ClaimInfoWithDetails<bigint> & { password: string, codes: string[] })[];
  setClaims: (claims: (ClaimInfoWithDetails<bigint> & { password: string, codes: string[] })[]) => void;
  transfers: TransferWithIncrements<bigint>[];
  setTransfers: (transfers: TransferWithIncrements<bigint>[]) => void;
  balancesToDistribute?: Balance<bigint>[];
}) {
  const collections = useCollectionsContext();
  const collection = collections.getCollection(MSG_PREVIEW_ID);

  //We can either specify specific badges to distribute or distribute the whole collection if blank
  const originalSenderBalance = balancesToDistribute ? {
    balances: balancesToDistribute.map(x => convertBalance(x, BigIntify)),
    approvals: [],
  } : {
    balances: collection?.maxSupplys.map(x => convertBalance(x, BigIntify)) || [],
    approvals: []
  };

  return <div style={{ justifyContent: 'center', width: '100%' }}>
    <br />
    <div>
      <div className='flex-center'>
        <ClaimSelect
          claims={claims}
          setClaims={setClaims}
          transfers={transfers}
          setTransfers={setTransfers}
          originalSenderBalance={originalSenderBalance}
          distributionMethod={distributionMethod}
          sender={'Mint'}
          collectionId={MSG_PREVIEW_ID}
          hideTransferDisplay={true}
          plusButton
        />
      </div>
    </div>
    <DevMode obj={claims} />
  </div>
}