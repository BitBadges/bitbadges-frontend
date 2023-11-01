import { Spin } from 'antd';

import { useChainContext } from '../../bitbadges-api/contexts/ChainContext';
import RegisterScreen from '../../pages/register';
import { useAccount } from '../../bitbadges-api/contexts/accounts/AccountsContext';

export function RegisteredWrapper({ node, message }: { node: JSX.Element, message?: string }) {
  const chain = useChainContext();
  const signedInAccount = useAccount(chain.address);
  
  const airdropped = signedInAccount?.airdropped;
  const fetched = signedInAccount?.fetchedProfile;

  if (!signedInAccount) return <div className='inherit-bg flex-center'><Spin size='large' style={{ marginTop: 30, minHeight: '100vh' }} /></div>

  return (
    <>
      {airdropped && fetched ? node : <RegisterScreen message={message} />}
    </>
  );
}
