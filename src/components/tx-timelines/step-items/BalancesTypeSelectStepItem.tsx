import { Input, Switch } from "antd";
import { EmptyStepItem, NEW_COLLECTION_ID, useTxTimelineContext } from "../../../bitbadges-api/contexts/TxTimelineContext";
import { updateCollection, useCollection } from "../../../bitbadges-api/contexts/collections/CollectionsContext";

import { InfoCircleOutlined } from "@ant-design/icons";
import { GO_MAX_UINT_64 } from "../../../utils/dates";
import { GenericFormStepWrapper } from "../form-items/GenericFormStepWrapper";
import { SwitchForm } from "../form-items/SwitchForm";
import { InformationDisplayCard } from "../../display/InformationDisplayCard";
import { getCurrentValuesForCollection } from "bitbadgesjs-sdk";

export function BalanceTypeSelectStepItem() {

  const collection = useCollection(NEW_COLLECTION_ID);

  const txTimelineContext = useTxTimelineContext();
  const existingCollectionId = txTimelineContext.existingCollectionId;

  const noBalancesStandard = collection && getCurrentValuesForCollection(collection).standards.includes("No User Ownership");

  if (noBalancesStandard) return EmptyStepItem;
  if (!collection || existingCollectionId) return EmptyStepItem;

  const StandardOption = {
    title: 'On-Chain',
    message: <>
      {`Everything will be facilitated in a decentralized manner on the blockchain. Every transfer requires a blockchain transaction that satisifies the approval requirements for the collection, sender, and recipient.`}
    </>,
    isSelected: collection?.balancesType === "Standard",
  }

  const OffChainBalancesStep = {
    title: 'Off-Chain',
    isSelected: collection?.balancesType === "Off-Chain - Indexed" || collection?.balancesType === "Off-Chain - Non-Indexed",
    message: <div className='full-width'><span>
      ALL balances will be assigned exclusively off-chain by a centralized entity (you) to optimize the owner experience and ensure scalability.
      Users never need to interact with the blockchain.
      There are no transfers or approvals, just balance updates by you.

      <br /> <br />
      This option should only be used for specific use cases. Learn more
      <a href="https://docs.bitbadges.io/overview/how-it-works/balances-types#off-chain" target="_blank" rel="noopener noreferrer">
        {' '}here.
      </a></span>
    </div >,
    additionalNode: () => <div className="flex-center flex-column">
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
      <div className="secondary-text" style={{ textAlign: 'center' }}>
        If you are unsure, choose indexed. Indexed has full support for all features if less than 15k unique owners and can be outsourced to BitBadges, while non-indexed is more limited and must be self-hosted.
      </div>

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
    OffChainBalancesStep,
    StandardOption,
  ];

  return {
    title: `Balances Storage`,
    disabled: collection.balancesType === 'Off-Chain - Non-Indexed' && (collection.offChainBalancesMetadataTimeline.length == 0 || collection.offChainBalancesMetadataTimeline.some(x => x.offChainBalancesMetadata.uri == '' || !x.offChainBalancesMetadata.uri.includes('{address}'))),
    description: <>
      {"Select your preferred storage method for your balances. This cannot be changed later."} Learn more about the different options <a href="https://docs.bitbadges.io/overview/how-it-works/balances-types" target="_blank" rel="noopener noreferrer">here</a>.
    </>,
    node: () => <GenericFormStepWrapper
      documentationLink="https://docs.bitbadges.io/overview/how-it-works/balances-types"
      node={() => <div>
        <SwitchForm
          options={options}
          onSwitchChange={(idx) => {
            if (!collection) return;

            updateCollection({
              collectionId: NEW_COLLECTION_ID,
              balancesType: idx == 1 ? "Standard" : idx == 1 ? "Off-Chain - Indexed" : "Off-Chain - Non-Indexed",
              collectionApprovals: idx == 1 ? collection.collectionApprovals : [],
              offChainBalancesMetadataTimeline: idx == 0 ? collection.offChainBalancesMetadataTimeline : [],
            })
          }}
        />
        <br />
        <BalanceComparisonTable />
      </div>
      }
    />
  }
}

export const BalanceComparisonTable = () => {
  return <InformationDisplayCard title='Comparison' subtitle='' span={24}>

    <div className="max-w-4xl mx-auto p-4 rounded-lg shadow-lg primary-text overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr>
            <th className="border p-2">Features</th>
            <th className="border p-2">Off-Chain - Indexed</th>
            <th className="border p-2">Off-Chain - Non-Indexed</th>
            <th className="border p-2">Standard</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border p-2">Collection Details Storage</td>
            <td className="border p-2 secondary-text">Blockchain</td>
            <td className="border p-2 secondary-text">Blockchain</td>
            <td className="border p-2 secondary-text">Blockchain</td>
          </tr>
          <tr>
            <td className="border p-2">Balances Storage</td>
            <td className="border p-2 secondary-text">Server</td>
            <td className="border p-2 secondary-text">Server</td>
            <td className="border p-2 secondary-text">Blockchain</td>
          </tr>
          <tr>
            <td className="border p-2">Balances Customization</td>
            <td className="border p-2 secondary-text">Can access non-blockchain data and integrate with non-blockchain tools to customize the experience.</td>
            <td className="border p-2 secondary-text">Can access non-blockchain data and integrate with non-blockchain tools to customize the experience.</td>
            <td className="border p-2 secondary-text">Must use blockchain data only (i.e. smart contracts, native features, etc.).</td>
          </tr>

          <tr>
            <td className="border p-2">Max owners limit?</td>
            <td className="border p-2 secondary-text">15k (can change)</td>
            <td className="border p-2 secondary-text">None</td>
            <td className="border p-2 secondary-text">None</td>
          </tr>
          <tr>
            <td className="border p-2">Self-hosted?</td>
            <td className="border p-2 secondary-text">Optional, can outsource to BitBadges.</td>
            <td className="border p-2 secondary-text">Mandatory</td>
            <td className="border p-2 secondary-text">No, blockchain only.</td>
          </tr>
          <tr>
            <td className="border p-2">Real-time fetches?</td>
            <td className="border p-2 secondary-text">Somewhat, cached and indexed by BitBadges using a refresh queue.</td>
            <td className="border p-2 secondary-text">Yes, fetched on-demand from source.</td>
            <td className="border p-2 secondary-text">Yes, blockchain indexed in real-time by BitBadges.</td>
          </tr>
          <tr>
            <td className="border p-2">Scalability?</td>
            <td className="border p-2 secondary-text">Good</td>
            <td className="border p-2 secondary-text">Great</td>
            <td className="border p-2 secondary-text">Poor</td>
          </tr>
          <tr>
            <td className="border p-2">Transfer / Approvals Support</td>
            <td className="border p-2 secondary-text">No, balances updates by centralized entity only. No on-chain transfers or approvals. If self-hosting, you can custom implement an off-chain solution.</td>
            <td className="border p-2 secondary-text">No, balances updates by centralized entity only. No on-chain transfers or approvals. If self-hosting, you can custom implement an off-chain solution.</td>
            <td className="border p-2 secondary-text">Yes</td>
          </tr>
          <tr>
            <td className="border p-2">Balance update / transfer costs?</td>
            <td className="border p-2 secondary-text">Free (if URL does not change)</td>
            <td className="border p-2 secondary-text">Free (if URL does not change)</td>
            <td className="border p-2 secondary-text">Yes, gas fees</td>
          </tr>
          <tr>
            <td className="border p-2">Owner experience</td>
            <td className="border p-2 secondary-text">No blockchain transactions required.</td>
            <td className="border p-2 secondary-text">No blockchain transactions required.</td>
            <td className="border p-2 secondary-text">Requires blockchain transactions for all approvals / transfers.</td>
          </tr>
          <tr>
            <td className="border p-2">Search results?</td>
            <td className="border p-2 secondary-text"><span className="text-green-500">✅</span></td>
            <td className="border p-2 secondary-text"><span className="text-red-500">❌</span></td>
            <td className="border p-2 secondary-text"><span className="text-green-500">✅</span></td>
          </tr>
          <tr>
            <td className="border p-2">Verifiable total supply?</td>
            <td className="border p-2 secondary-text"><span className="text-green-500">✅</span></td>
            <td className="border p-2 secondary-text"><span className="text-red-500">❌</span></td>
            <td className="border p-2 secondary-text"><span className="text-green-500">✅</span></td>
          </tr>
          <tr>
            <td className="border p-2">All balances / owners known?</td>
            <td className="border p-2 secondary-text">Yes, all balances / owners are known at any given time.</td>
            <td className="border p-2 secondary-text">No, you can query individual addresses, but a verifiable list of all balances / owners is not kept.</td>
            <td className="border p-2 secondary-text">Yes, all balances / owners are known at any given time.</td>
          </tr>
          <tr>
            <td className="border p-2">Ledger of activity?</td>
            <td className="border p-2 secondary-text"><span className="text-green-500">✅</span></td>
            <td className="border p-2 secondary-text"><span className="text-red-500">❌</span></td>
            <td className="border p-2 secondary-text"><span className="text-green-500">✅</span></td>
          </tr>

        </tbody>
      </table>
    </div>
  </InformationDisplayCard>
}