import { InfoCircleOutlined } from "@ant-design/icons";
import { Divider, Typography } from "antd";
import { useEffect } from "react";
import { useAccountsContext } from "../../bitbadges-api/contexts/accounts/AccountsContext";
import { INFINITE_LOOP_MODE } from "../../constants";
import { AddressListSelect } from "../address/AddressListSelect";

export function RecipientsSelectStep({ sender,
  toAddresses,
  showApprovalsMessage,
  setToAddresses,
  // collectionId, senderBalance, 
  setNumRecipients }
  : {
    sender: string,
    toAddresses: string[],
    showApprovalsMessage?: boolean,
    setToAddresses: (addresses: string[]) => void,
    // collectionId: bigint, 
    // senderBalance: UserBalance<bigint>, 
    setNumRecipients: (numRecipients: bigint) => void
  }
) {
  // const chain = useChainContext();
  // const collections = useCollectionsContext();

  // const collection = collections.getCollection(collectionId)
  // const signedInAccount = accounts.getAccount(chain.cosmosAddress);
  const accounts = useAccountsContext();
  const senderAccount = accounts.getAccount(sender);

  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect: recipients select step, fetch accounts ');
    setNumRecipients(BigInt(toAddresses.length));
  }, [toAddresses, setNumRecipients]);

  //TODO: Actually thoroughly check for approvals rather than relying on simulation and naive implementations. See past code in Git. Or run simulation here ?!?!

  let forbiddenUsersMap: { [cosmosAddress: string]: string } = {}; //Map of cosmosAddress to an error message
  for (const address of toAddresses) {
    const account = accounts.getAccount(address);
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
    description: <div className=''>
      <AddressListSelect
        users={toAddresses}
        setUsers={setToAddresses}
        invalidUsers={forbiddenUsersMap}
      />
      {showApprovalsMessage && <>
        <Divider />
        <Typography.Text className='primary-text' style={{ fontSize: 16 }}>
          <InfoCircleOutlined /> {"All transfers must satisfy the collection transferability, and if not overriden by the collection transferability, the transfer must also satisfy the recipient's incoming approvals as well."}
        </Typography.Text></>}
    </div>,
    disabled: !canTransfer || toAddresses.length === 0,
  }
}