import { Divider, Typography } from "antd";
import { useEffect } from "react";
import { useAccountsContext } from "../../bitbadges-api/contexts/accounts/AccountsContext";
import { INFINITE_LOOP_MODE } from "../../constants";
import { AddressListSelect } from "../address/AddressListSelect";
import { ToolIcon, tools } from "../display/ToolIcon";

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

  //TODO: Actually thoroughly check for approvals rather than relying on simulation and naive implementations. See past code in Git. Or run simulation here ?!?!
  //Need to check: 
  //-Check collection-level transferability
  //-If sender != current user, check if they satisfy all outgoing approvals (including overrides)
  //-Must satisfy all incoming approvals (including overrides)


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
      <Divider />
      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <Typography.Text strong className='primary-text' style={{ fontSize: 20, textAlign: 'center' }}>Helper Tools</Typography.Text>
        <Typography.Text strong className='secondary-text' style={{ fontSize: 14, textAlign: 'center' }}>Fetch addresses using one of the following tools.</Typography.Text>
        <br />
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
          {tools.map(x => {
            if (x.toolType !== "Collect") return null;

            return <ToolIcon
              key={x.name}
              name={x.name}
            />
          })}

        </div>
        <br />
      </div>
    </div>,
    disabled: !canTransfer || toAddresses.length === 0,
  }
}