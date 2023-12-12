import { Input, Switch } from "antd";
import { EmptyStepItem, NEW_COLLECTION_ID, useTxTimelineContext } from "../../../bitbadges-api/contexts/TxTimelineContext";
import { updateCollection, useCollection } from "../../../bitbadges-api/contexts/collections/CollectionsContext";

import { SwitchForm } from "../form-items/SwitchForm";
import { InfoCircleOutlined } from "@ant-design/icons";
import { GO_MAX_UINT_64 } from "../../../utils/dates";

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
    isSelected: collection?.balancesType === "Off-Chain - Indexed" || collection?.balancesType === "Off-Chain - Non-Indexed",
    message: <div className='full-width'><span>
      ALL balances will be assigned exclusively off-chain by a centralized entity (you) to optimize the user experience and ensure scalability.
      Users never need to interact with the blockchain.
      There are no transfers or approvals, just balance updates by you.

      <br /> <br />
      This option should only be used for specific use cases. Learn more
      <a href="https://docs.bitbadges.io/overview/how-it-works/balances-types#off-chain" target="_blank" rel="noopener noreferrer">
        {' '}here.
      </a></span>
    </div >,
    additionalNode: <div className="flex-center flex-column">
      <Switch
        checked={collection.balancesType === "Off-Chain - Indexed"}
        checkedChildren="Indexed"
        unCheckedChildren="Non-Indexed"
        onChange={(checked) => {
          if (!collection) return;

          updateCollection({
            collectionId: NEW_COLLECTION_ID,
            balancesType: checked ? "Off-Chain - Indexed" : "Off-Chain - Non-Indexed",
          })
        }}
      />
      <br />
      {collection.balancesType === "Off-Chain - Indexed" && <div className="secondary-text" style={{ textAlign: 'center' }}>
        Indexed balances will show up in search results like portfolios, will have a verifiable total supply, and a ledger of ownership / update activity.
      </div>}
      {collection.balancesType === "Off-Chain - Non-Indexed" && <div className="secondary-text" style={{ textAlign: 'center' }}>
        Non-indexed balances will not show up in search results like portfolios, will not have a verifiable totaly supply, and will not have a ledger of ownership / update activity.
        Only the current balances can be checked, and they must be checked on-demand.
        This is more scalable than indexed balances but offers less functionality.
      </div>}
      <br />
      <br />
      <div className="secondary-text" style={{ textAlign: 'center' }}>
        If you are unsure, choose indexed. Indexed has full support for all features, while non-indexed is more limited and requires technical knowledge to use.
      </div>

      <br />
      <br />
      {collection.balancesType === "Off-Chain - Non-Indexed" && <div >
        <br />
        <div className='full-width'>
          <Input placeholder="Enter the URL for your balances" value={collection.offChainBalancesMetadataTimeline.length > 0 ?
            collection.offChainBalancesMetadataTimeline[0].offChainBalancesMetadata.uri : ''} onChange={(e) => {
              if (!collection) return;

              updateCollection({
                collectionId: NEW_COLLECTION_ID,
                balancesType: collection.balancesType,
                collectionApprovals: collection.collectionApprovals,
                offChainBalancesMetadataTimeline: [{
                  timelineTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
                  offChainBalancesMetadata: {
                    uri: e.target.value,
                    customData: '',
                  }
                }]
              })
            }}
            className="primary-text inherit-bg"
          />
          <div className='secondary-text' style={{ color: collection.offChainBalancesMetadataTimeline.length == 0 || collection.offChainBalancesMetadataTimeline.some(x => x.offChainBalancesMetadata.uri == '' || !x.offChainBalancesMetadata.uri.includes('{address}')) ? 'red' : undefined }}>
            <InfoCircleOutlined /> You must use {`"{address}"`} as a placeholder for the address in the URL.
          </div>
        </div>
      </div>}
    </div>
  }




  const options = [
    StandardOption,
    OffChainBalancesStep,
  ];

  return {
    title: `Balances Storage`,
    disabled: collection.balancesType === 'Off-Chain - Non-Indexed' && (collection.offChainBalancesMetadataTimeline.length == 0 || collection.offChainBalancesMetadataTimeline.some(x => x.offChainBalancesMetadata.uri == '' || !x.offChainBalancesMetadata.uri.includes('{address}'))),
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
            balancesType: idx == 0 ? "Standard" : idx == 1 ? "Off-Chain - Indexed" : "Off-Chain - Non-Indexed",
            collectionApprovals: idx == 0 ? collection.collectionApprovals : [],
            offChainBalancesMetadataTimeline: idx > 0 ? collection.offChainBalancesMetadataTimeline : [],
          })
        }}
      />
    </div>
  }
}