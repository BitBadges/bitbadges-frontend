import { Spin } from 'antd';
import { useAccountsContext } from '../../bitbadges-api/contexts/AccountsContext';
import { useChainContext } from '../../bitbadges-api/contexts/ChainContext';
import RegisterScreen from '../../pages/register';

export function RegisteredWrapper({ node, message }: { node: JSX.Element, message?: string }) {
  const chain = useChainContext();
  const accounts = useAccountsContext();

  const signedInAccount = accounts.getAccount(chain.address);
  const airdropped = signedInAccount?.airdropped;
  const fetched = signedInAccount?.fetchedProfile;

  if (!signedInAccount) return <div className='primary-blue-bg flex-center'><Spin size='large' style={{ marginTop: 30 }} /></div>

  return (
    <>
      {airdropped && fetched ? node : <RegisterScreen message={message} />}
    </>
  );
}
