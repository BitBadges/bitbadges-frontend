import { Divider } from "antd";
import { useCollectionsContext } from "../../../bitbadges-api/contexts/collections/CollectionsContext";
import { EmptyStepItem, MSG_PREVIEW_ID, useTxTimelineContext } from "../../../bitbadges-api/contexts/TxTimelineContext";
import { InformationDisplayCard } from "../../display/InformationDisplayCard";
import { SwitchForm } from "../form-items/SwitchForm";

export function BalanceTypeSelectStepItem() {
  const collections = useCollectionsContext();
  const collection = collections.collections[`${MSG_PREVIEW_ID}`];

  const txTimelineContext = useTxTimelineContext();
  const existingCollectionId = txTimelineContext.existingCollectionId;

  if (existingCollectionId) return EmptyStepItem;
  const neverHasManager = collection?.managerTimeline.length == 0 || collection?.managerTimeline.every(x => !x.manager);

  const StandardOption = {
    title: 'Standard',
    message: <>

      {`Balances will be stored on the blockchain. Created badges will be sent to the Mint address, and you define the rules for how they are distributed and transferred from there. Everything occurs on the blockchain in a decentralized manner.`}
      <Divider />
      <InformationDisplayCard title='Pros and Cons'>
        <div style={{ textAlign: 'start' }}>
          <ul>
            <li>
              <strong>Pros:</strong>
              <ul>
                <li><strong>Functionality:</strong> Users can natively transfer and set approvals via blockchain transactions.</li>
                <li><strong>Decentralization:</strong> Everything is handled in a decentralized manner on the blockchain.</li>
              </ul>
            </li>
            <li>
              <strong>Cons:</strong>
              <ul>
                <li><strong>Scalability:</strong> All balances are stored on the blockchain which means that the collection uses blockchain resources for storing balances and transfer transactions, meaning this option is more expensive.</li>
                <li><strong>User Experience:</strong> Users must interact with the blochchain and pay transaction fees to receive badges and to transfer / approve badges.</li>
              </ul>
            </li>
          </ul>
        </div>
      </InformationDisplayCard>
    </>,
    isSelected: collection?.balancesType === "Standard"
  }

  const OffChainBalancesStep = {
    title: 'Off-Chain Balances',
    isSelected: collection?.balancesType === "Off-Chain",
    message: <div className='full-width'><span>Balances will be stored on a typical server (not the blockchain).
      This option should only be used for specific use cases. Balances will be assigned manually by you in the following steps. If allowed, any future balance update for a user must also be done manually (users cannot transfer themselves).

      Learn more
      <a href="https://docs.bitbadges.io/overview/how-it-works/balances-types#off-chain" target="_blank" rel="noopener noreferrer">
        {' '}here.
      </a></span>
      {neverHasManager && <>
        <br /> <br />
        IMPORTANT: Updating balances in the future is a manager-only privilege, and this collection does / will not have a manager. The assigned balances in the following steps will be PERMANENT and FROZEN.
      </>}
      <Divider />
      <InformationDisplayCard title='Pros and Cons'>
        <div style={{ textAlign: 'start' }}>
          <ul>
            <li>
              <strong>Pros:</strong>
              <ul>
                <li><strong>Enhanced User Experience:</strong> Users can receive badges without blockchain interaction.</li>
                <li><strong>Scalability:</strong> No blockchain resources used for storing balances and no transaction fees paid for transfers / approvals means this option is much cheaper.</li>
              </ul>
            </li>
            <li>
              <strong>Cons:</strong>
              <ul>
                <li><strong>No Native Transfers:</strong> Transfers and approvals are not supported. All balances must be manually assigned off-chain, and users cannot transfer badges to other users on-chain.</li>
                <li><strong>Centralization:</strong> Introduces trust in server for availability and a central entity for balance assignment.</li>
              </ul>
            </li>
          </ul>
        </div>
      </InformationDisplayCard>

    </div>,
  }

  const options = [
    OffChainBalancesStep,
    StandardOption,
  ];



  return {
    title: `Balances Type`,
    description: 'Select your preferred balance type. This cannot be changed later. Standard balances offer more customizability and decentralization, but off-chain balances offer enhanced scalability and user experience.',
    node: <div>
      <SwitchForm
        options={options}
        onSwitchChange={(idx) => {
          if (!collection) return;

          collections.updateCollection({
            ...collection,
            balancesType: idx == 1 ? "Standard" : "Off-Chain",
            collectionApprovedTransfers: idx == 1 ? collection.collectionApprovedTransfers : [],
            offChainBalancesMetadataTimeline: idx == 0 ? collection.offChainBalancesMetadataTimeline : [],
          })
        }}
      />
    </div>
  }
}