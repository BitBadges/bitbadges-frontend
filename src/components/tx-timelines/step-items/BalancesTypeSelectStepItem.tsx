import { EmptyStepItem, MSG_PREVIEW_ID, useTxTimelineContext } from "../../../bitbadges-api/contexts/TxTimelineContext";
import { useCollectionsContext } from "../../../bitbadges-api/contexts/collections/CollectionsContext";
import { SwitchForm } from "../form-items/SwitchForm";

export function BalanceTypeSelectStepItem() {
  const collections = useCollectionsContext();
  const collection = collections.getCollection(MSG_PREVIEW_ID);

  const txTimelineContext = useTxTimelineContext();
  const existingCollectionId = txTimelineContext.existingCollectionId;

  if (existingCollectionId) return EmptyStepItem;

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
      Balances will be managed exclusively by a centralized entity (you), which is responsible for assigning and updating them.
      There will never be any transfer or approval blockchain transactions. Ownership of assets can only be granted by the centralized entity through assignment.



      <br /> <br />


      This option should only be used for specific use cases. Learn more
      <a href="https://docs.bitbadges.io/overview/how-it-works/balances-types#off-chain" target="_blank" rel="noopener noreferrer">
        {' '}here.
      </a></span>
    </div >,
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

          collections.updateCollection({
            collectionId: MSG_PREVIEW_ID,
            balancesType: idx == 1 ? "Standard" : "Off-Chain",
            collectionApprovals: idx == 1 ? collection.collectionApprovals : [],
            offChainBalancesMetadataTimeline: idx == 0 ? collection.offChainBalancesMetadataTimeline : [],
          })
        }}
      />
    </div>
  }
}