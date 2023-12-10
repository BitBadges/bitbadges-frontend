import { EmptyStepItem, NEW_COLLECTION_ID, useTxTimelineContext } from "../../../bitbadges-api/contexts/TxTimelineContext";
import { updateCollection, useCollection } from "../../../bitbadges-api/contexts/collections/CollectionsContext";

import { SwitchForm } from "../form-items/SwitchForm";

export function BalanceTypeSelectStepItem() {

  const collection = useCollection(NEW_COLLECTION_ID);

  const txTimelineContext = useTxTimelineContext();
  const existingCollectionId = txTimelineContext.existingCollectionId;


  if (!collection || existingCollectionId) return EmptyStepItem;

  const StandardOption = {
    title: 'Standard',
    message: <>

      {`Everything will be facilitated in a decentralized manner on the blockchain. Created badges will initially be sent to the Mint address.
        Every transfer requires a blockchain transaction that satisifies the approval requirements for the collection, sender, and recipient.`}

    </>,
    isSelected: collection?.balancesType === "Standard"
  }

  const OffChainBalancesStep = {
    title: 'Off-Chain Balances',
    isSelected: collection?.balancesType === "Off-Chain",
    message: <div className='full-width'><span>
      Off-chain storage will be utilized to optimize the user experience and ensure scalability.
      Balances will be managed exclusively by a centralized entity (you), which is responsible for assigning and updating ALL balances.
      There will never be any blockchain transactions for transfers or approvals.
      <br /> <br />
      This option should only be used for specific use cases. Learn more
      <a href="https://docs.bitbadges.io/overview/how-it-works/balances-types#off-chain" target="_blank" rel="noopener noreferrer">
        {' '}here.
      </a></span>
    </div >
  }

  const options = [
    OffChainBalancesStep,
    StandardOption,
  ];



  return {
    title: `Balances Storage`,
    description: <>
      {"Select your preferred storage method for your balances. This cannot be changed later."} Learn more about the different options <a href="https://docs.bitbadges.io/overview/how-it-works/balances-types" target="_blank" rel="noopener noreferrer">here</a>.
    </>,
    node: <div>
      <SwitchForm
        options={options}
        onSwitchChange={(idx) => {
          if (!collection) return;

          updateCollection({
            collectionId: NEW_COLLECTION_ID,
            balancesType: idx == 1 ? "Standard" : "Off-Chain",
            collectionApprovals: idx == 1 ? collection.collectionApprovals : [],
            offChainBalancesMetadataTimeline: idx == 0 ? collection.offChainBalancesMetadataTimeline : [],
          })
        }}
      />
    </div>
  }
}