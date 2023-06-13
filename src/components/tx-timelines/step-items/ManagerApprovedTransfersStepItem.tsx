import { InfoCircleOutlined } from "@ant-design/icons";
import { Tooltip } from "antd";
import { useState } from "react";
import { TransfersMappingSelect } from "../form-items/TransfersMappingSelect";

export function ManagerApprovedTransfersStepItem() {
  const [handled, setHandled] = useState(false);
  
  return {
    title: <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center' }}>{'Manager\'s Approved Transfers'} <Tooltip color="black" title="The manager's approved transfers are those they can execute without needing to be approved by the badge owner. These transfers override the transferability restrictions selected in the previous step." >
      <InfoCircleOutlined style={{ marginLeft: 4, marginRight: 4 }} />
    </Tooltip></div>,
    description: `The manager's approved transfers cannot be updated after the collection is created.`,
    node: <TransfersMappingSelect
      isManagerApprovedSelect
      setHandled={() => setHandled(true)}
    />,
    disabled: !handled
  }
}