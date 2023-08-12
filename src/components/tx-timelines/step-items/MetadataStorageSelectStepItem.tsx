import { InfoCircleOutlined } from "@ant-design/icons";
import { MetadataAddMethod } from "bitbadgesjs-utils";
import { SwitchForm } from "../form-items/SwitchForm";
import { Tooltip } from "antd";

export function MetadataStorageSelectStepItem(
  addMethod: MetadataAddMethod,
  setAddMethod: (addMethod: MetadataAddMethod) => void
) {
  return {
    title: 'Metadata Storage',
    description: `For setting / updating metadata in the following steps, choose your preferred storage method.`,
    node: <SwitchForm
      options={[
        {
          title: 'Self-Hosted (Advanced)',
          message: `Store and host the metadata yourself. Provide a URL to where it is hosted.`,
          isSelected: addMethod === MetadataAddMethod.UploadUrl,
        },
        {
          title: 'Outsourced',
          message: <div>{`Enter your metadata directly into this form, and we handle the metadata storage for you! This is done in a decentralized manner using IPFS.`}
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
        if (idx === 1) {
          setAddMethod(MetadataAddMethod.Manual);
        } else if (idx === 0) {
          setAddMethod(MetadataAddMethod.UploadUrl);
        }
      }}
    />,
    disabled: addMethod === MetadataAddMethod.None
  }
}