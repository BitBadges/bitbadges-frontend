import { InfoCircleOutlined } from "@ant-design/icons";
import { Tooltip } from "antd";
import { useState } from "react";
import { BitBadgesUserInfo, TransferMappingWithUnregisteredUsers } from "bitbadgesjs-utils";
import { TransferMappingSelectType, TransfersMappingSelect } from "../form-items/TransfersMappingSelect";

export function ManagerApprovedTransfersStepItem(
  managerApprovedTransfersWithUnregisteredUsers: TransferMappingWithUnregisteredUsers[],
  setManagerApprovedTransfersWithUnregisteredUsers: (managerApprovedTransfersWithUnregisteredUsers: TransferMappingWithUnregisteredUsers[]) => void,
  toSelectType: TransferMappingSelectType,
  setToSelectType: (toSelectType: TransferMappingSelectType) => void,
  fromSelectType: TransferMappingSelectType,
  setTransferabiityFromSelectType: (fromSelectType: TransferMappingSelectType) => void,
  to: BitBadgesUserInfo[],
  setTo: (to: BitBadgesUserInfo[]) => void,
  from: BitBadgesUserInfo[],
  setFrom: (from: BitBadgesUserInfo[]) => void,
) {
  const [handled, setHandled] = useState(false);
  return {
    title: <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center' }}>{'Manager\'s Approved Transfers'} <Tooltip color="black" title="The manager's approved transfers are those they can execute without needing to be approved by the badge owner. These transfers override the transferability restrictions selected in the previous step." >
      <InfoCircleOutlined style={{ marginLeft: 4, marginRight: 4 }} />
    </Tooltip></div>,
    description: `The manager's approved transfers cannot be updated after the collection is created.`,
    node: <TransfersMappingSelect
      transfersMapping={managerApprovedTransfersWithUnregisteredUsers}
      setTransfersMapping={(managerApprovedTransfers) => setManagerApprovedTransfersWithUnregisteredUsers(managerApprovedTransfers)}
      isManagerApprovedSelect
      setHandled={() => setHandled(true)}
      toSelectType={toSelectType}
      setToSelectType={(toSelectType) => setToSelectType(toSelectType)}
      fromSelectType={fromSelectType}
      setFromSelectType={(fromSelectType) => setTransferabiityFromSelectType(fromSelectType)}
      to={to}
      setTo={(to) => setTo(to)}
      from={from}
      setFrom={(from) => setFrom(from)}
    />,
    disabled: !handled
  }
}