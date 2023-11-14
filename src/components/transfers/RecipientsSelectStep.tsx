import { InfoCircleOutlined } from "@ant-design/icons";
import { Col, Divider, Typography } from "antd";
import { useEffect } from "react";
import { getAccount, useAccount } from "../../bitbadges-api/contexts/accounts/AccountsContext";
import { INFINITE_LOOP_MODE } from "../../constants";
import { AddressListSelect } from "../address/AddressListSelect";

export function RecipientsSelectStep({
  sender,
  toAddresses,
  showApprovalsMessage,
  setToAddresses,
  setNumRecipients }
  : {
    sender: string,
    toAddresses: string[],
    showApprovalsMessage?: boolean,
    setToAddresses: (addresses: string[]) => void,
    setNumRecipients: (numRecipients: bigint) => void
  }
) {

  const senderAccount = useAccount(sender);

  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect: recipients select step, fetch accounts ');
    setNumRecipients(BigInt(toAddresses.length));
  }, [toAddresses, setNumRecipients]);

  //TODO: Actually thoroughly check for approvals rather than relying on simulation and naive implementations. See past code in Git. Or run simulation here ?!?!
  //This is relic code. Can probably be removed.
  let forbiddenUsersMap: { [cosmosAddress: string]: string } = {}; //Map of cosmosAddress to an error message
  for (const address of toAddresses) {
    const account = getAccount(address);
    if (!account) {
      forbiddenUsersMap[address] = `Address not found.`;
      continue;
    }

    //Even in the case of manager approved transfer, the sender cannot be the recipient
    if (account?.cosmosAddress === senderAccount?.cosmosAddress) {
      forbiddenUsersMap[account?.cosmosAddress] = `Recipient cannot equal sender.`;
    }
  }

  let canTransfer = Object.values(forbiddenUsersMap).find((message) => message !== '') === undefined;
  if (sender === 'Mint') canTransfer = true;

  return {
    title: `Recipients (${toAddresses.length})`,
    description: <div className="flex-center"><Col className='' md={12} xs={24} >
      <AddressListSelect
        users={toAddresses}
        setUsers={setToAddresses}
        invalidUsers={forbiddenUsersMap}
      />
      {showApprovalsMessage && <>
        <Divider />
        <Typography.Text className='secondary-text' style={{ fontSize: 16 }}>
          <InfoCircleOutlined /> {"All transfers must satisfy the collection transferability, and if not overriden by the collection transferability, the transfer must also satisfy the sender's outgoing and recipient's incoming approvals as well."}
        </Typography.Text></>}
    </Col>
    </div>,
    disabled: !canTransfer || toAddresses.length === 0,
  }
}