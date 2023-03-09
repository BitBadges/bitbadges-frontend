import { MessageMsgNewCollection } from "bitbadgesjs-transactions";
import { TransfersMappingSelect } from "../form-items/TransfersMappingSelect";
import { Tooltip } from "antd";
import { InfoCircleOutlined } from "@ant-design/icons";
import { useState } from "react";

export function ManagerApprovedTransfersStepItem(
    newCollectionMsg: MessageMsgNewCollection,
    setNewCollectionMsg: (newCollectionMsg: MessageMsgNewCollection) => void,
) {
    const [handled, setHandled] = useState(false);
    return {
        title: <>{'Manager\'s Approved Transfers'} <Tooltip title="The manager's approved transfers are those they can execute without needing to be approved by the badge owner. These transfers override the transferability restrictions selected in the previous step." >
            <InfoCircleOutlined style={{ marginLeft: 4, marginRight: 4 }} />
        </Tooltip></>,
        description: `The manager's approved transfers cannot be updated after the collection is created.`,
        node: <TransfersMappingSelect
            transfersMapping={newCollectionMsg.managerApprovedTransfers}
            setTransfersMapping={(managerApprovedTransfers) => setNewCollectionMsg({ ...newCollectionMsg, managerApprovedTransfers })}
            isManagerApprovedSelect
            setHandled={() => setHandled(true)}
        />,
        disabled: !handled
    }
}