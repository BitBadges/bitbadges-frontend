import { Layout, Typography } from 'antd';
import { useChainContext } from '../chain/ChainContext';

function BrowseScreen({ message }: { message?: string }) {
    const chain = useChainContext();
    const address = chain.cosmosAddress;

    return (
        <>TODO</>
    );
}

export default BrowseScreen;
