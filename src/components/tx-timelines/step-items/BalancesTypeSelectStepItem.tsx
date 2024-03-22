import { Input, Switch } from 'antd';
import { EmptyStepItem, NEW_COLLECTION_ID, useTxTimelineContext } from '../../../bitbadges-api/contexts/TxTimelineContext';
import { updateCollection, useCollection } from '../../../bitbadges-api/contexts/collections/CollectionsContext';

import { InfoCircleOutlined } from '@ant-design/icons';
import { InformationDisplayCard } from '../../display/InformationDisplayCard';
import { GenericFormStepWrapper } from '../form-items/GenericFormStepWrapper';
import { SwitchForm } from '../form-items/SwitchForm';
import { IncrementedBalances, OffChainBalancesMetadataTimeline, UintRangeArray } from 'bitbadgesjs-sdk';
import { Tabs } from '../../navigation/Tabs';
import { MetadataAddMethod } from '../../../bitbadges-api/types';
import { CreateNodeFromPlugin } from '../../transfers/ClaimBuilder';
import { useMemo } from 'react';
import crypto from 'crypto';

export function BalanceTypeSelectStepItem() {
  const collection = useCollection(NEW_COLLECTION_ID);

  const txTimelineContext = useTxTimelineContext();
  const existingCollectionId = txTimelineContext.existingCollectionId;

  const offChainAddMethod = txTimelineContext.offChainAddMethod;
  const setOffChainAddMethod = txTimelineContext.setOffChainAddMethod;

  const noBalancesStandard = collection && collection.getStandards()?.includes('No User Ownership');

  let claim = collection?.clone().offChainClaims?.[0];
  const randomId = useMemo(() => crypto.randomBytes(32).toString('hex'), []);
  const claimId = claim?.claimId || randomId;

  if (!claim) {
    claim = {
      claimId: claimId,
      plugins: [],
      balancesToSet: new IncrementedBalances({ startBalances: [], incrementBadgeIdsBy: 0n, incrementOwnershipTimesBy: 0n })
    };
  }

  if (noBalancesStandard) return EmptyStepItem;
  if (!collection || existingCollectionId) return EmptyStepItem;

  const StandardOption = {
    title: 'On-Chain',
    message: (
      <>
        {`Everything will be facilitated in a decentralized manner on the blockchain. Every transfer requires a blockchain transaction that satisifies the approval requirements for the collection, sender, and recipient.`}
      </>
    ),
    isSelected: collection?.balancesType === 'Standard'
  };

  const OffChainBalancesStep = {
    title: 'Off-Chain',
    isSelected: collection?.balancesType === 'Off-Chain - Indexed' || collection?.balancesType === 'Off-Chain - Non-Indexed',
    message: (
      <div className="full-width">
        <span>
          Balances will be stored off-chain on a server (not the blockchain). This option should only be used for specific use cases. Learn more
          <a href="https://docs.bitbadges.io/overview/how-it-works/balances-types#off-chain" target="_blank" rel="noopener noreferrer">
            {' '}
            here{' '}
          </a>
          or see the comparison table below.
        </span>
      </div>
    ),
    additionalNode: () => (
      <div className="flex-center flex-column">
        <Switch
          checked={collection.balancesType === 'Off-Chain - Indexed'}
          checkedChildren="Indexed"
          unCheckedChildren="Non-Indexed"
          onChange={(checked) => {
            if (!collection) return;

            updateCollection({
              collectionId: NEW_COLLECTION_ID,
              balancesType: checked ? 'Off-Chain - Indexed' : 'Off-Chain - Non-Indexed'
            });
          }}
        />
        <br />
        <div className="secondary-text" style={{ textAlign: 'center' }}>
          {collection.balancesType === 'Off-Chain - Indexed'
            ? 'The entire distribution of balances will be indexed and known at any given time. Limited to 15k owners.'
            : 'Balances will be fetched on-demand. No verifiable total supply, ledger of activity, or list of all balances / owners. This option also does not show up in search results.'}
        </div>

        {collection.balancesType === 'Off-Chain - Non-Indexed' && (
          <div className="full-width">
            <br />
            <div className="flex-center mb-7">
              <Tabs
                tab={offChainAddMethod}
                setTab={(tab) => {
                  setOffChainAddMethod(tab as MetadataAddMethod);
                }}
                tabInfo={[
                  { key: MetadataAddMethod.UploadUrl, content: 'URL' },
                  {
                    key: MetadataAddMethod.Plugins,
                    content: 'Queries'
                  }
                ]}
                type="underline"
              />
            </div>
            {offChainAddMethod === MetadataAddMethod.Plugins && claim && (
              <>
                <div className="primary-text my-3">
                  Create a custom query to fetch balances. If an address meets the criteria, they will be assigned a balance of x1 for ALL badge IDs.
                </div>
                <div className="w-full">
                  <CreateNodeFromPlugin
                    nonIndexed
                    id="api"
                    plugins={claim?.plugins || []}
                    disabledMap={{}}
                    setDisabledMap={() => {}}
                    isUpdate={!!txTimelineContext.existingCollectionId && txTimelineContext.existingCollectionId > 0}
                    type={'balances'}
                    claim={claim}
                    setPlugins={(plugins) => {
                      updateCollection({
                        collectionId: NEW_COLLECTION_ID,
                        offChainClaims: [
                          {
                            claimId: claimId,
                            plugins,
                            balancesToSet: new IncrementedBalances({ startBalances: [], incrementBadgeIdsBy: 0n, incrementOwnershipTimesBy: 0n })
                          }
                        ],
                        offChainBalancesMetadataTimeline: [
                          new OffChainBalancesMetadataTimeline({
                            timelineTimes: UintRangeArray.FullRanges(),
                            offChainBalancesMetadata: {
                              uri: 'https://api.bitbadges.io/placeholder/{address}',
                              customData: ''
                            }
                          })
                        ]
                      });
                    }}
                  />
                </div>
              </>
            )}
            {txTimelineContext.offChainAddMethod === MetadataAddMethod.UploadUrl && (
              <div className="full-width">
                <Input
                  placeholder="Enter the URL for your balances"
                  value={
                    collection.offChainBalancesMetadataTimeline.length > 0
                      ? collection.offChainBalancesMetadataTimeline[0].offChainBalancesMetadata.uri
                      : ''
                  }
                  onChange={(e) => {
                    if (!collection) return;

                    updateCollection({
                      collectionId: NEW_COLLECTION_ID,
                      balancesType: collection.balancesType,
                      collectionApprovals: collection.collectionApprovals,
                      offChainBalancesMetadataTimeline: [
                        new OffChainBalancesMetadataTimeline({
                          timelineTimes: UintRangeArray.FullRanges(),
                          offChainBalancesMetadata: {
                            uri: e.target.value,
                            customData: ''
                          }
                        })
                      ]
                    });
                  }}
                  className="primary-text inherit-bg"
                />
                <div
                  className="secondary-text"
                  style={{
                    color:
                      collection.offChainBalancesMetadataTimeline.length == 0 ||
                      collection.offChainBalancesMetadataTimeline.some(
                        (x) => x.offChainBalancesMetadata.uri == '' || !x.offChainBalancesMetadata.uri.includes('{address}')
                      )
                        ? 'red'
                        : undefined
                  }}>
                  <InfoCircleOutlined /> You must use {`"{address}"`} as a placeholder for the address in the URL.
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    )
  };

  const options = [OffChainBalancesStep, StandardOption];

  return {
    title: `Balances Storage`,
    disabled:
      collection.balancesType === 'Off-Chain - Non-Indexed' &&
      (collection.offChainBalancesMetadataTimeline.length == 0 ||
        collection.offChainBalancesMetadataTimeline.some(
          (x) =>
            x.offChainBalancesMetadata.uri == '' ||
            (offChainAddMethod === MetadataAddMethod.UploadUrl && !x.offChainBalancesMetadata.uri.includes('{address}'))
        )),
    description: (
      <>
        {'Select your preferred storage method for your balances. This cannot be changed later.'} Learn more about the different options{' '}
        <a href="https://docs.bitbadges.io/overview/how-it-works/balances-types" target="_blank" rel="noopener noreferrer">
          here
        </a>
        .
      </>
    ),
    node: () => (
      <GenericFormStepWrapper
        documentationLink="https://docs.bitbadges.io/overview/how-it-works/balances-types"
        node={() => (
          <div>
            <SwitchForm
              options={options}
              onSwitchChange={(idx) => {
                if (!collection) return;
                setOffChainAddMethod(MetadataAddMethod.Plugins);
                updateCollection({
                  collectionId: NEW_COLLECTION_ID,
                  balancesType: idx == 1 ? 'Standard' : idx == 0 ? 'Off-Chain - Indexed' : 'Off-Chain - Non-Indexed',
                  collectionApprovals: idx == 1 ? collection.collectionApprovals : [],
                  offChainBalancesMetadataTimeline: idx == 0 ? collection.offChainBalancesMetadataTimeline : []
                });
              }}
            />
            <br />
            <BalanceComparisonTable />
          </div>
        )}
      />
    )
  };
}

export const BalanceComparisonTable = () => {
  return (
    <InformationDisplayCard title="Comparison" subtitle="" span={24}>
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
              <td className="border p-2 secondary-text">Can access non-blockchain data to customize the experience.</td>
              <td className="border p-2 secondary-text">Can access non-blockchain data to customize the experience.</td>
              <td className="border p-2 secondary-text">Must use blockchain data only (i.e. smart contracts, native features, etc.).</td>
            </tr>

            <tr>
              <td className="border p-2">Max owners limit?</td>
              <td className="border p-2 secondary-text">15k</td>
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
              <td className="border p-2 secondary-text">
                No on-chain transfers or approvals. If self-hosting, you can custom implement an off-chain solution.
              </td>
              <td className="border p-2 secondary-text">
                No on-chain transfers or approvals. If self-hosting, you can custom implement an off-chain solution.
              </td>
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
              <td className="border p-2 secondary-text">
                <span className="text-green-500">✅</span>
              </td>
              <td className="border p-2 secondary-text">
                <span className="text-red-500">❌</span>
              </td>
              <td className="border p-2 secondary-text">
                <span className="text-green-500">✅</span>
              </td>
            </tr>
            <tr>
              <td className="border p-2">Verifiable total supply?</td>
              <td className="border p-2 secondary-text">
                <span className="text-green-500">✅</span>
              </td>
              <td className="border p-2 secondary-text">
                <span className="text-red-500">❌</span>
              </td>
              <td className="border p-2 secondary-text">
                <span className="text-green-500">✅</span>
              </td>
            </tr>
            <tr>
              <td className="border p-2">All balances / owners known?</td>
              <td className="border p-2 secondary-text">Yes, all balances / owners are known at any given time.</td>
              <td className="border p-2 secondary-text">
                No, you can query individual addresses, but a verifiable list of all balances / owners is not kept.
              </td>
              <td className="border p-2 secondary-text">Yes, all balances / owners are known at any given time.</td>
            </tr>
            <tr>
              <td className="border p-2">Ledger of activity?</td>
              <td className="border p-2 secondary-text">
                <span className="text-green-500">✅</span>
              </td>
              <td className="border p-2 secondary-text">
                <span className="text-red-500">❌</span>
              </td>
              <td className="border p-2 secondary-text">
                <span className="text-green-500">✅</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </InformationDisplayCard>
  );
};
