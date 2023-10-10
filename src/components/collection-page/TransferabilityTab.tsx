import { AddressMapping } from 'bitbadgesjs-proto';
import { getReservedAddressMapping, isInAddressMapping } from 'bitbadgesjs-utils';
import { useCollectionsContext } from '../../bitbadges-api/contexts/collections/CollectionsContext';
import { ApprovalsDisplay } from './ApprovalsTab';

export function TransferabilityTab({ collectionId, badgeId, onlyShowFromMint, onlyShowNotFromMint, hideHelperMessage }: {
  collectionId: bigint,
  badgeId?: bigint,
  onlyShowFromMint?: boolean,
  onlyShowNotFromMint?: boolean,
  hideHelperMessage?: boolean,
}) {
  const collections = useCollectionsContext();
  const collection = collections.collections[collectionId.toString()];

  if (!collection) return <></>;

  let approvals = collection.collectionApprovals;

  if (onlyShowFromMint) {
    approvals = approvals.filter(x => isInAddressMapping(x.fromMapping, 'Mint'))
    approvals = approvals.map(x => {
      return {
        ...x,
        fromMapping: getReservedAddressMapping('Mint') as AddressMapping,
        fromMappingId: 'Mint',
      }
    })
  }

  return (
    <>
      <ApprovalsDisplay
        approvals={approvals}
        collection={collection}
        badgeId={badgeId}
        filterFromMint={onlyShowNotFromMint}
        hideHelperMessage={hideHelperMessage}
        approvalLevel={"collection"}
        approverAddress=''
      />
    </>
  );
}

