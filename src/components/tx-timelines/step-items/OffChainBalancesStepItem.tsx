import { InfoCircleOutlined } from "@ant-design/icons";
import { Form, Input, Tooltip, Typography } from "antd";
import { MetadataAddMethod } from "bitbadgesjs-utils";
import { SwitchForm } from "../form-items/SwitchForm";
import { MSG_PREVIEW_ID } from "../TxTimeline";
import { useCollectionsContext } from "../../../bitbadges-api/contexts/CollectionsContext";
import { useEffect, useState } from "react";
import { FOREVER_DATE } from "../../../utils/dates";
import { INFINITE_LOOP_MODE } from "../../../constants";

const { Text } = Typography

// This is the first custom step in the off-chain balances creation flow. It allows the user to select between
// uploading metadata themselves or having it outsourced. It uses the SwitchForm component to render the options.
export function OffChainBalancesStorageSelectStepItem() {
  const collections = useCollectionsContext();
  const collection = collections.collections[`${MSG_PREVIEW_ID}`];

  const [addMethod, setAddMethod] = useState(MetadataAddMethod.None);
  const [uri, setUri] = useState('');

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
          timelineTimes: [{ start: 1n, end: FOREVER_DATE }],
          offChainBalancesMetadata: {
            uri: uri,
            customData: ''
          }
        }]
      })
    }, DELAY_MS)

    return () => clearTimeout(delayDebounceFn)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uri])
  return {
    title: 'Off-Chain Balances Storage',
    description: `Choose your preferred storage method.`,
    node: <>
      <SwitchForm
        options={[
          {
            title: 'Self-Hosted (Advanced)',
            message: `Store and host the balances yourself. Provide a URL to where it is hosted.`,
            isSelected: addMethod === MetadataAddMethod.UploadUrl,
          },
          {
            title: 'Outsourced',
            message: <div>{`Enter your balances directly into this form, and we handle the balances storage for you! This is done in a decentralized manner using IPFS.`}
              <Tooltip
                placement='bottom'
                title={`IPFS, or Interplanetary File System, is a way of sharing files and information on the internet that doesn't rely on traditional servers and makes the web more resilient to censorship and centralization.`}
              >
                <InfoCircleOutlined
                  style={{ marginLeft: 4, marginRight: 4 }}
                />
              </Tooltip>
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
              offChainBalancesMetadataTimeline: [],
            });
          } else if (idx === 0) {
            setAddMethod(MetadataAddMethod.UploadUrl);
            collections.updateCollection({
              ...collection,
              offChainBalancesMetadataTimeline: [{
                timelineTimes: [{ start: 1n, end: FOREVER_DATE }],
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
      {addMethod === MetadataAddMethod.UploadUrl &&
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
            className='primary-text primary-blue-bg'
          />
        </Form.Item>
      }





    </>,
    disabled: addMethod === MetadataAddMethod.None
  }
}