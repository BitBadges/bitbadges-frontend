import { Divider } from 'antd';
import { BitBadgeCollection, SupportedChain } from '../../../bitbadges-api/types';
import { DEV_MODE, PRIMARY_TEXT } from '../../../constants';
import { TransferDisplay } from '../../common/TransferDisplay';

export function ActivityTab({ badgeCollection, setBadgeCollection }: {
    badgeCollection: BitBadgeCollection | undefined;
    setBadgeCollection: (badgeCollection: BitBadgeCollection) => void;
}) {
    return (
        <div>
            <div
                style={{
                    color: PRIMARY_TEXT,
                    justifyContent: 'center',
                    alignItems: 'center',
                    display: 'flex'
                }}>
                <div>
                    {badgeCollection?.activity.map((activity, idx) => {
                        return <div key={idx} style={{ color: PRIMARY_TEXT, maxWidth: 600 }}>
                            {activity.balances.map((balance, idx) => {
                                return <>
                                    <TransferDisplay
                                        fontColor={PRIMARY_TEXT}
                                        key={idx}
                                        badge={badgeCollection}
                                        setBadgeCollection={setBadgeCollection}
                                        from={activity.from.map((from) => {
                                            return {
                                                accountNumber: Number(from),
                                                address: '',
                                                cosmosAddress: '',
                                                chain: SupportedChain.COSMOS,
                                            }
                                        })}
                                        to={activity.to.map((to) => {
                                            return {
                                                accountNumber: Number(to),
                                                address: '',
                                                cosmosAddress: '',
                                                chain: SupportedChain.COSMOS,
                                            }
                                        })}
                                        amount={balance.balance}
                                        badgeIds={balance.badgeIds}
                                    />
                                    <Divider />
                                </>
                            })}
                        </div>

                    })}
                </div>
            </div>


            {
                DEV_MODE &&
                <pre style={{ marginTop: '10px', borderTop: '3px dashed white', color: PRIMARY_TEXT, alignContent: 'left', width: '100%', textAlign: 'left' }}>
                    {JSON.stringify(badgeCollection, null, 2)}
                </pre>
            }
        </div >
    );
}
