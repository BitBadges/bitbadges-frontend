import { useState } from "react";
import { EmptyStepItem, NEW_COLLECTION_ID, useTxTimelineContext } from "../../../bitbadges-api/contexts/TxTimelineContext";

import { updateCollection, useCollection } from "../../../bitbadges-api/contexts/collections/CollectionsContext";
import { getMintApprovals, getNonMintApprovals } from "../../../bitbadges-api/utils/mintVsNonMint";
import { TransferabilityTab } from "../../collection-page/TransferabilityTab";
import { UpdateSelectWrapper } from "../form-items/UpdateSelectWrapper";

export function DistributionMethodStepItem() {


  const txTimelineContext = useTxTimelineContext();
  const collection = useCollection(NEW_COLLECTION_ID);
  const startingCollection = txTimelineContext.startingCollection;
  const updateCollectionApprovals = txTimelineContext.updateCollectionApprovals;
  const setUpdateCollectionApprovals = txTimelineContext.setUpdateCollectionApprovals;
  const isOffChainBalances = collection?.balancesType === "Off-Chain";

  const [err, setErr] = useState<Error | null>(null);

  if (!collection) return EmptyStepItem;

  const DistributionComponent = <div>
    {<>
      {!isOffChainBalances &&
        <div className='flex-center full-width' style={{ textAlign: 'center' }}>
          <TransferabilityTab
            editable
            showDeletedGrayedOut
            collectionId={NEW_COLLECTION_ID}
            onlyShowFromMint
            hideHelperMessage
          />
        </div>}
    </>}
  </div>

  return {
    title: `Transferability - Minting`,
    description: 'You previously created badges which have been sent to the Mint address. Here, you decide who can transfer from the Mint address.',
    node: <>
      {
        collection?.balancesType === "Off-Chain" ? DistributionComponent :
          <UpdateSelectWrapper
            err={err}
            setErr={(err) => { setErr(err) }}
            updateFlag={updateCollectionApprovals}
            setUpdateFlag={setUpdateCollectionApprovals}
            jsonPropertyPath='collectionApprovals'
            permissionName='canUpdateCollectionApprovals'
            customRevertFunction={() => {
              const prevMint = startingCollection ? getMintApprovals(startingCollection) : [];
              const currentNonMint = getNonMintApprovals(collection);

              updateCollection({
                collectionId: NEW_COLLECTION_ID,
                collectionApprovals: [
                  ...prevMint,
                  ...currentNonMint
                ],
              });
            }}
            mintOnly
            node={DistributionComponent}
          />
      }
    </>,
    disabled: !collection || !!err
  }
}