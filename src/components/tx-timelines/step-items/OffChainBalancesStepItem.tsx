import { Divider, Form, Input, Typography } from "antd";
import { Transfer } from "bitbadgesjs-sdk";
import { MetadataAddMethod, TransferWithIncrements } from "bitbadgesjs-sdk";
import { useEffect, useState } from "react";
import { EmptyStepItem, NEW_COLLECTION_ID, useTxTimelineContext } from "../../../bitbadges-api/contexts/TxTimelineContext";

import { InfoCircleOutlined } from "@ant-design/icons";
import { updateCollection, useCollection } from "../../../bitbadges-api/contexts/collections/CollectionsContext";
import { areBalancesBitBadgesHosted } from "../../../bitbadges-api/utils/balances";
import { INFINITE_LOOP_MODE } from "../../../constants";
import { MarkdownEditor } from "../../../pages/account/[addressOrUsername]/settings";
import { GO_MAX_UINT_64 } from "../../../utils/dates";
import { TransferSelect } from "../../transfers/TransferOrClaimSelect";
import { getExistingBalanceMap } from "../../tx-modals/UpdateBalancesModal";
import { SwitchForm } from "../form-items/SwitchForm";
import { UpdateSelectWrapper } from "../form-items/UpdateSelectWrapper";

const { Text } = Typography

export const DistributionComponent = ({
  transfersOverride,
  setTransfersOverride,
  collectionIdOverride,
}: {
  transfersOverride?: TransferWithIncrements<bigint>[];
  setTransfersOverride?: (transfers: TransferWithIncrements<bigint>[]) => void;
  collectionIdOverride?: bigint;
}) => {
  const collectionId = collectionIdOverride ?? NEW_COLLECTION_ID;
  const collection = useCollection(collectionIdOverride ?? NEW_COLLECTION_ID);
  const txTimelineContext = useTxTimelineContext();
  const transfers = transfersOverride ?? txTimelineContext.transfers;
  const setTransfers = setTransfersOverride ?? txTimelineContext.setTransfers;

  if (!collection) return <></>;

  return <div>
    <br />

    <div className=''>
      <TransferSelect
        collectionId={collectionId}
        sender={'Mint'}
        originalSenderBalances={collection.owners.find(x => x.cosmosAddress === 'Total')?.balances ?? []} //We use total balances and allow them to fetch currently minted
        setTransfers={(transfers) => {
          if (transfers.length > 15000) {
            alert('Too many transfers. Please keep under 15000.')
            return;
          }

          setTransfers(transfers);
        }}
        transfers={transfers}
        plusButton
        isOffChainBalancesUpdate
        fetchExisting={!!collectionId && collectionId > 0n && collection.offChainBalancesMetadataTimeline.length > 0 ? async () => {
          const balancesMap = await getExistingBalanceMap(collection);
          const transfers: Transfer<bigint>[] = Object.entries(balancesMap).map(([cosmosAddress, balances]) => {
            return {
              from: 'Mint',
              toAddresses: [cosmosAddress],
              balances,
            }
          })
          setTransfers(transfers);
        } : undefined}
      />
    </div >
  </div >
}

// This is the first custom step in the off-chain balances creation flow. It allows the user to select between
// uploading metadata themselves or having it outsourced. It uses the SwitchForm component to render the options.
export function OffChainBalancesStorageSelectStepItem() {

  const collection = useCollection(NEW_COLLECTION_ID);

  const txTimelineContext = useTxTimelineContext();
  const existingCollectionId = txTimelineContext.existingCollectionId;
  const existingCollection = useCollection(existingCollectionId);
  const canUpdateOffChainBalancesMetadata = txTimelineContext.updateOffChainBalancesMetadataTimeline;
  const setCanUpdateOffChainBalancesMetadata = txTimelineContext.setUpdateOffChainBalancesMetadataTimeline;

  const addMethod = txTimelineContext.offChainAddMethod;
  const setAddMethod = txTimelineContext.setOffChainAddMethod;

  const host = collection?.cachedCollectionMetadata?.offChainTransferabilityInfo?.host ?? '';
  const assignMethod = collection?.cachedCollectionMetadata?.offChainTransferabilityInfo?.assignMethod ?? '';

  const setHost = (host: string) => {
    if (!collection || !collection.cachedCollectionMetadata) return;

    updateCollection({
      collectionId: NEW_COLLECTION_ID,
      cachedCollectionMetadata: {
        ...collection.cachedCollectionMetadata,
        offChainTransferabilityInfo: {
          host,
          assignMethod: collection.cachedCollectionMetadata.offChainTransferabilityInfo?.assignMethod ?? ''
        }
      }
    })
  }

  const setAssignMethod = (assignMethod: string) => {
    if (!collection || !collection.cachedCollectionMetadata) return;

    updateCollection({
      collectionId: NEW_COLLECTION_ID,
      cachedCollectionMetadata: {
        ...collection.cachedCollectionMetadata,
        offChainTransferabilityInfo: {
          host: collection.cachedCollectionMetadata.offChainTransferabilityInfo?.host ?? '',
          assignMethod
        }
      }
    })
  }


  const [uri, setUri] = useState('');
  const [err, setErr] = useState<Error | null>(null);

  const DELAY_MS = 200;
  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect: uri select, badge uri changed ');
    const delayDebounceFn = setTimeout(async () => {
      if (!uri) {
        console.log("no badge uri or collection")
        return
      }

      updateCollection({
        collectionId: NEW_COLLECTION_ID,
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

  const isBitBadgesHosted = areBalancesBitBadgesHosted(existingCollection);

  const Component = () => <>

    <SwitchForm
      options={[
        {
          title: 'Self-Hosted (Advanced)',
          message: `Store and host the balances yourself. Provide a URL to where it is hosted.`,
          isSelected: addMethod === MetadataAddMethod.UploadUrl,
          additionalNode: () => <>
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
            <Divider />
            {txTimelineContext.collectionAddMethod === MetadataAddMethod.UploadUrl && txTimelineContext.updateCollectionMetadataTimeline && <>
              <div className="secondary-text" style={{ textAlign: 'center' }}>
                <InfoCircleOutlined /> {'To provide additional transferability info, you can host it at the self-hosted URL of your collection metadata.'} See <a href='https://app.gitbook.com/o/7VSYQvtb1QtdWFsEGoUn/s/7R34Y0QZwgpUGaJnJ4dq/for-developers/core-concepts/metadata' target='_blank'>here</a> for more info.
              </div>
            </>}
            {txTimelineContext.collectionAddMethod === MetadataAddMethod.Manual && txTimelineContext.updateCollectionMetadataTimeline && <>
              <div className="full-width" style={{ marginBottom: 20, display: 'flex', justifyContent: 'center', flexDirection: 'column' }}>
                <Form
                  colon={false}
                  layout="vertical"
                  className="full-width"
                >
                  <Form.Item
                    label={<>
                      <Typography.Text className='primary-text' strong>
                        Host
                      </Typography.Text >
                    </>}
                  >
                    <MarkdownEditor
                      height={200}
                      markdown={host}
                      setMarkdown={(e) => {
                        setHost(e);
                      }}
                      placeholder={`Provide a brief description of where the balances are hosted (i.e. decentralized? who controls it?)`}
                    />
                  </Form.Item>
                  <Form.Item
                    label={<>
                      <Typography.Text className='primary-text' strong>
                        Assignment
                      </Typography.Text>
                    </>}
                  >
                    <MarkdownEditor
                      height={200}
                      markdown={assignMethod}
                      setMarkdown={(e) => {
                        setAssignMethod(e);
                      }}
                      placeholder={`How are balances assigned?`}
                    />
                  </Form.Item>
                </Form>
              </div>
            </>}
            {!txTimelineContext.updateCollectionMetadataTimeline && <>
              <div className="secondary-text" style={{ textAlign: 'center' }}>
                <InfoCircleOutlined /> {'To edit the transferability metadata, you cannot have collection metadata set to "Do not update".'}
              </div>
            </>}
          </>
        },
        {
          title: 'Manual',
          message: <div>{`Assign your balances directly in this form, and we handle the balances storage for you! The current manager will be able to update the balances.`}
          </div>,
          isSelected: addMethod === MetadataAddMethod.Manual,
        },
      ]}
      onSwitchChange={(idx) => {
        if (!collection) return;

        if (idx === 1) {
          setAddMethod(MetadataAddMethod.Manual);
          updateCollection({
            collectionId: NEW_COLLECTION_ID,
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
          updateCollection({
            collectionId: NEW_COLLECTION_ID,
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
      <>{<DistributionComponent />}</>
    }
  </>


  return {
    title: 'Off-Chain Balances',
    description: `For off-chain balances, you are responsible for assigning who owns what badges. This is done off-chain, so this will not add to your on-chain transaction fee.`,
    node: () => <>
      <UpdateSelectWrapper
        documentationLink={"https://docs.bitbadges.io/overview/how-it-works/balances-types"}
        err={err}
        setErr={(err) => { setErr(err) }}
        updateFlag={canUpdateOffChainBalancesMetadata}
        setUpdateFlag={setCanUpdateOffChainBalancesMetadata}
        jsonPropertyPath='offChainBalancesMetadataTimeline'
        permissionName='canUpdateOffChainBalancesMetadata'
        disableJson
        node={Component}
      />
    </>,
    disabled: addMethod === MetadataAddMethod.None || !!err
  }
}