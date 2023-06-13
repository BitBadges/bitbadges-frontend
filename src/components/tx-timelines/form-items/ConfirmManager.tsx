import { Avatar, Typography, Modal } from 'antd';
import { useRouter } from 'next/router';
import { useChainContext } from '../../../bitbadges-api/contexts/ChainContext';
import { AddressDisplay } from '../../address/AddressDisplay';
import { BlockiesAvatar } from '../../address/Blockies';
import { useAccountsContext } from '../../../bitbadges-api/contexts/AccountsContext';


export function ConfirmManager() {
  const chain = useChainContext();
  const router = useRouter();
  const accounts = useAccountsContext();
  const signedInAccount = accounts.getAccount(chain.address);
  const address = chain.address;

  return (
    <div>
      <div className='primary-text'
        style={{
          padding: '0',
          textAlign: 'center',
          justifyContent: 'center',
          alignItems: 'center',
          marginTop: 20,
        }}
      >
        <Avatar
          size={150}
          src={
            <BlockiesAvatar
              address={address}
              avatar={signedInAccount?.avatar}
              fontSize={150}
              shape='circle'
            />
          }
        />

        <div style={{ marginBottom: 10, marginTop: 4, display: 'flex', justifyContent: 'center' }}>
          <AddressDisplay
            addressOrUsername={address}
            hidePortfolioLink
          />
        </div>
      </div>
      <Typography style={{ color: 'lightgrey', textAlign: 'center' }}>
        <button
          style={{
            backgroundColor: 'inherit',
            fontSize: 17,
          }}
          onClick={() => {
            router.push('/connect');
            Modal.destroyAll()
          }}
          className="opacity link-button secondary-text"
        >
          Click here to connect a different wallet.
        </button>
      </Typography>
    </div >
  )
}