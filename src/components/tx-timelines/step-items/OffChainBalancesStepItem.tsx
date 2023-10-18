import { Form, Input, Typography } from "antd";
import { Transfer } from "bitbadgesjs-proto";
import { BigIntify, MetadataAddMethod, convertOffChainBalancesMap } from "bitbadgesjs-utils";
import { useEffect, useState } from "react";
import { fetchMetadataDirectly } from "../../../bitbadges-api/api";
import { EmptyStepItem, MSG_PREVIEW_ID, useTxTimelineContext } from "../../../bitbadges-api/contexts/TxTimelineContext";
import { useCollectionsContext } from "../../../bitbadges-api/contexts/collections/CollectionsContext";
import { INFINITE_LOOP_MODE } from "../../../constants";
import { GO_MAX_UINT_64 } from "../../../utils/dates";
import { TransferSelect } from "../../transfers/TransferOrClaimSelect";
import { SwitchForm } from "../form-items/SwitchForm";
import { UpdateSelectWrapper } from "../form-items/UpdateSelectWrapper";

const { Text } = Typography

// This is the first custom step in the off-chain balances creation flow. It allows the user to select between
// uploading metadata themselves or having it outsourced. It uses the SwitchForm component to render the options.
export function OffChainBalancesStorageSelectStepItem() {
  const collections = useCollectionsContext();
  const collection = collections.collections[`${MSG_PREVIEW_ID}`];


  const txTimelineContext = useTxTimelineContext();
  const existingCollectionId = txTimelineContext.existingCollectionId;
  const existingCollection = collections.collections[`${existingCollectionId}`];
  const canUpdateOffChainBalancesMetadata = txTimelineContext.updateOffChainBalancesMetadataTimeline;
  const setCanUpdateOffChainBalancesMetadata = txTimelineContext.setUpdateOffChainBalancesMetadataTimeline;

  const addMethod = txTimelineContext.offChainAddMethod;
  const setAddMethod = txTimelineContext.setOffChainAddMethod;

  const [uri, setUri] = useState('');

  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);

  const DELAY_MS = 200;
  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect: uri select, badge uri changed ');
    const delayDebounceFn = setTimeout(async () => {
      if (!uri || !collection) {
        console.log("no badge uri or collection")
        return
      }

      collections.updateCollection({
        ...collection,
        offChainBalancesMetadataTimeline: [{
          timelineTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
          offChainBalancesMetadata: {
            uri: uri,
            customData: ''
          }
        }]
      })
    }, DELAY_MS)

    return () => clearTimeout(delayDebounceFn)
  }, [uri])

  if (!collection) return EmptyStepItem;

  const isBitBadgesHosted = existingCollection && existingCollection.offChainBalancesMetadataTimeline.length > 0 && existingCollection?.offChainBalancesMetadataTimeline[0].offChainBalancesMetadata.uri.startsWith('https://bitbadges.nyc3.digitaloceanspaces.com/balances/');

  const DistributionComponent = <div>
    <br />
    {!!txTimelineContext.existingCollectionId && txTimelineContext.existingCollectionId > 0n && !fetched && collection.offChainBalancesMetadataTimeline.length > 0 &&
      <div className="flex-center">
        <button className="styled-button"
          disabled={loading}
          onClick={async () => {
            setLoading(true);
            const offChainBalancesMapRes = await fetchMetadataDirectly({
              uris: [collection.offChainBalancesMetadataTimeline[0].offChainBalancesMetadata.uri]
            });
            console.log(offChainBalancesMapRes);
            //filter undefined entries
            const filteredMap = Object.entries(offChainBalancesMapRes.metadata[0] as any).filter(([, balances]) => {
              return !!balances;
            }).reduce((obj, [cosmosAddress, balances]) => {
              obj[cosmosAddress] = balances;
              return obj;
            }, {} as any);

            const balancesMap = convertOffChainBalancesMap(filteredMap as any, BigIntify)
            const transfers: Transfer<bigint>[] = Object.entries(balancesMap).map(([cosmosAddress, balances]) => {
              return {
                from: 'Mint',
                toAddresses: [cosmosAddress],
                balances,
              }
            })
            txTimelineContext.setTransfers(transfers);
            setLoading(false);
            setFetched(true);
          }}>
          Fetch Existing Off-Chain Balances
        </button>
      </div>
    }


    <div className=''>
      <TransferSelect
        collectionId={MSG_PREVIEW_ID}
        sender={'Mint'}
        originalSenderBalances={collection.owners.find(x => x.cosmosAddress === 'Total')?.balances ?? []}
        setTransfers={txTimelineContext.setTransfers}
        transfers={txTimelineContext.transfers}
        plusButton
      />
    </div >
  </div >

  const Component = <>

    <SwitchForm
      options={[
        {
          title: 'Self-Hosted (Advanced)',
          message: `Store and host the balances yourself. Provide a URL to where it is hosted.`,
          isSelected: addMethod === MetadataAddMethod.UploadUrl,
          additionalNode: <>
            <Form.Item
              label={
                <Text
                  className='primary-text'
                  strong
                >
                  Balances URI
                </Text>
              }
              required
            >
              <Input
                value={uri}
                onChange={(e: any) => {
                  setUri(e.target.value);
                }}
                className='primary-text inherit-bg'
              />
            </Form.Item>
          </>
        },
        {
          title: 'Manual',
          message: <div>{`Assign your balances directly in this form, and we handle the balances storage for you!`}

          </div>,
          isSelected: addMethod === MetadataAddMethod.Manual,
        },
      ]}
      onSwitchChange={(idx) => {
        if (!collection) return;

        if (idx === 1) {
          setAddMethod(MetadataAddMethod.Manual);
          collections.updateCollection({
            ...collection,
            offChainBalancesMetadataTimeline: existingCollection ?
              isBitBadgesHosted ? existingCollection.offChainBalancesMetadataTimeline : [{
                timelineTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
                offChainBalancesMetadata: {
                  uri: 'bitbadges-hosted', //something different so it triggers the validateUpdate (not bitbadges hosted -> bitbadges hosted will change URL)
                  customData: ''
                }
              }] : []
          });
        } else if (idx === 0) {
          setAddMethod(MetadataAddMethod.UploadUrl);
          txTimelineContext.setTransfers([]);
          collections.updateCollection({
            ...collection,
            offChainBalancesMetadataTimeline: [{
              timelineTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
              offChainBalancesMetadata: {
                uri: uri,
                customData: ''
              }
            }]
          })
        }
      }}
    />
    <br />
    {addMethod === MetadataAddMethod.Manual &&
      <>{DistributionComponent}</>
    }
  </>


  return {
    title: 'Off-Chain Balances',
    description: `For off-chain balances, you are responsible for assigning who owns what badges. This is done off-chain, so this will not add to your on-chain transaction fee.`,
    node: <>
      <UpdateSelectWrapper
        updateFlag={canUpdateOffChainBalancesMetadata}
        setUpdateFlag={setCanUpdateOffChainBalancesMetadata}
        jsonPropertyPath='offChainBalancesMetadataTimeline'
        permissionName='canUpdateOffChainBalancesMetadata'
        disableJson
        node={Component}
      />
    </>,
    disabled: addMethod === MetadataAddMethod.None
  }
}