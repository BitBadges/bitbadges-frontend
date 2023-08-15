import { Divider, Typography } from "antd";
import { useEffect } from "react";
import { useAccountsContext } from "../../bitbadges-api/contexts/AccountsContext";
import { INFINITE_LOOP_MODE } from "../../constants";
import { AddressListSelect } from "../address/AddressListSelect";
import { ToolIcon } from "../display/ToolIcon";

export function RecipientsSelectStep({ sender,
  toAddresses,
  setToAddresses,
  // collectionId, senderBalance, 
  setNumRecipients }
  : {
    sender: string,
    toAddresses: string[],
    setToAddresses: (addresses: string[]) => void,
    // collectionId: bigint, 
    // senderBalance: UserBalance<bigint>, 
    setNumRecipients: (numRecipients: bigint) => void
  }
) {
  // const chain = useChainContext();
  // const collections = useCollectionsContext();

  // const collection = collections.collections[collectionId.toString()]
  // const signedInAccount = accounts.getAccount(chain.cosmosAddress);
  const accounts = useAccountsContext();
  const senderAccount = accounts.getAccount(sender);

  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect: recipients select step, fetch accounts ');
    setNumRecipients(BigInt(toAddresses.length));
  }, [toAddresses, setNumRecipients]);

  //Check if the toAddresses are allowed
  //Three things we have to check: 1) allowedTransfer, 2) managerApprovedTransfers, 3) current approvals for sender address (if sending on behalf of another user)
  // const forbiddenAddresses = collection && senderAccount ? getValidTransfersForTransferMapping(collection.allowedTransfers, senderAccount.cosmosAddress, toAddresses, collection.manager) : [];
  // const managerApprovedAddresses = collection && senderAccount ? getValidTransfersForTransferMapping(collection.managerApprovedTransfers, senderAccount.cosmosAddress, toAddresses, collection.manager) : [];

  //If sender !== current user, check if they have any approvals. 
  // const unapprovedAddresses: any[] = [];
  //TODO: Better check for approvals
  //Tricky here because we need balances but we don't have them yet
  //This is a naive implementation that just checks if the sender has any approval for the current user
  //Right now, we just catch upon simulation
  // if (signedInAccount && signedInAccount?.cosmosAddress !== senderAccount?.cosmosAddress) {
  //   if (senderBalance.approvals.find((approval) => approval.address === signedInAccount?.cosmosAddress) === undefined) {
  //     for (const address of toAddresses) {
  //       unapprovedAddresses.push(address);
  //     }
  //   }
  // }


  // if (signedInAccount && signedInAccount?.cosmosAddress !== senderAccount?.cosmosAddress) {
  //   const isApproved = checkIfApproved(senderBalance, signedInAccount?.cosmosAddress, balances);

  //   if (!isApproved) {
  //     for (const address of toAddresses) {
  //       unapprovedAddresses.push(address);
  //     }
  //   }
  // }
  let forbiddenUsersMap: { [cosmosAddress: string]: string } = {}; //Map of cosmosAddress to an error message
  for (const address of toAddresses) {
    const account = accounts.getAccount(address);
    if (!account) {
      forbiddenUsersMap[address] = `Address not found.`;
      continue;
    }
    // //If forbidden or unapproved, add to map
    // if (forbiddenAddresses.includes(account?.cosmosAddress)) {
    //   forbiddenUsersMap[account?.cosmosAddress] = `Transfer to this recipient has been allowed by the manager.`;
    // }

    // if (unapprovedAddresses.includes(account?.cosmosAddress)) {
    //   forbiddenUsersMap[account?.cosmosAddress] = `The selected sender has not approved you to transfer on their behalf.`;
    // }

    // //If manager approved transfer, this overrides the allowed transfer
    // if (collection && signedInAccount?.cosmosAddress === collection?.manager && managerApprovedAddresses.includes(account?.cosmosAddress)) {
    //   delete forbiddenUsersMap[account?.cosmosAddress];
    // }

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
      <Divider />
      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <Typography.Text strong className='primary-text' style={{ fontSize: 20, textAlign: 'center' }}>Helper Tools</Typography.Text>
        <Typography.Text strong className='secondary-text' style={{ fontSize: 14, textAlign: 'center' }}>Fetch addresses using one of the following tools.</Typography.Text>
        <br />
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
          <ToolIcon name="Sketch.io" />
        </div>
        <br />
      </div>
    </div>,
    disabled: !canTransfer,
  }
}