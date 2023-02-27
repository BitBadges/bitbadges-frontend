import { Avatar, Tooltip } from "antd"
import { InformationDisplayCard } from "../display/InformationDisplayCard"
import { useCollectionsContext } from "../../contexts/CollectionsContext"
import { LinkOutlined } from "@ant-design/icons";
import { PRIMARY_TEXT } from "../../constants";
import { useRouter } from "next/router";
import { BalanceDisplay } from "../balances/BalanceDisplay";
import { useAccountsContext } from "../../contexts/AccountsContext";

export function CollectionDisplay({ collectionId, cosmosAddress }: { collectionId: number, cosmosAddress: string }) {
    const collections = useCollectionsContext();
    const router = useRouter();
    const collection = collections.collections[`${collectionId}`];
    const accounts = useAccountsContext();
    const accountInfo = accounts.accounts[`${cosmosAddress}`];


    return <div style={{ width: 400, margin: 10, display: 'flex' }}><InformationDisplayCard
        title={<>
            <Avatar
                src={collection.collectionMetadata?.image}
                size={50}
                style={{
                    verticalAlign: 'middle',
                    border: '3px solid',
                    borderColor: collection.collectionMetadata?.color
                        ? collection.collectionMetadata?.color
                        : 'black',
                    margin: 4,
                }}
            />
            <br />
            {collection.collectionMetadata?.name}

            <a style={{ marginLeft: 4 }}>
                <Tooltip title="Go to collection page">
                    <LinkOutlined
                        onClick={() => {
                            router.push('/collections/' + collection.collectionId)
                        }}
                    />
                </Tooltip>
            </a>
        </>}
    >
        <div key={collection.collectionId} style={{ color: PRIMARY_TEXT }}>
            <BalanceDisplay
                message='Collected Badges'
                collection={collection}
                balance={collection.balances[accountInfo?.accountNumber || 0]}
            />
        </div>
    </InformationDisplayCard>
    </div>
}