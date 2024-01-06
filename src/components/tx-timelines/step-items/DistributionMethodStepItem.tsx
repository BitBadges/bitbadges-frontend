import { useState } from "react";
import { EmptyStepItem, NEW_COLLECTION_ID, useTxTimelineContext } from "../../../bitbadges-api/contexts/TxTimelineContext";

import { updateCollection, useCollection } from "../../../bitbadges-api/contexts/collections/CollectionsContext";
import { getMintApprovals, getNonMintApprovals } from "../../../bitbadges-api/utils/mintVsNonMint";
import { TransferabilityTab } from "../../collection-page/transferability/TransferabilityTab";
import { UpdateSelectWrapper } from "../form-items/UpdateSelectWrapper";

export function DistributionMethodStepItem() {
  const txTimelineContext = useTxTimelineContext();
  const collection = useCollection(NEW_COLLECTION_ID);
  const startingCollection = txTimelineContext.startingCollection;
  const updateCollectionApprovals = txTimelineContext.updateCollectionApprovals;
  const setUpdateCollectionApprovals = txTimelineContext.setUpdateCollectionApprovals;
  const isOffChainBalances = collection?.balancesType === "Off-Chain - Indexed";

  const [err, setErr] = useState<Error | null>(null);


  if (!collection) return EmptyStepItem;

  const DistributionComponent = () => <div>
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
    title: `Collection Approvals (Transferability) - Minting`,
    description: 'You previously created badges which have been sent to the Mint address. Here, you create the collection level approvals for who can transfer from the Mint address. All transfers must be approved on the collection level.',
    node: () => <>
      {
        collection?.balancesType === "Off-Chain - Indexed" ? DistributionComponent :
          <UpdateSelectWrapper
            documentationLink={"https://docs.bitbadges.io/overview/how-it-works/transferability"}
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