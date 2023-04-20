import { Divider, Select } from 'antd';
import { BitBadgeCollection } from 'bitbadgesjs-utils';
import { useState } from 'react';
import { DEV_MODE, PRIMARY_BLUE, PRIMARY_TEXT } from '../../constants';

import { DownOutlined } from '@ant-design/icons';
import { MultiCollectionBadgeDisplay } from '../badges/MultiCollectionBadgeDisplay';

export function BadgesTab({ collection, }: {
    collection: BitBadgeCollection
}) {
    const [cardView, setCardView] = useState(true);

    return (
        <div
            style={{
                color: PRIMARY_TEXT,
            }}>
            <br />

            <div style={{
                backgroundColor: PRIMARY_BLUE,
                color: PRIMARY_TEXT,
                float: 'right',
                display: 'flex',
                alignItems: 'center',
                marginLeft: 16,
                marginRight: 16
            }}>
                View:

                <Select
                    className="selector"
                    value={cardView ? 'card' : 'image'}
                    placeholder="Default: None"
                    onChange={(e: any) => {
                        setCardView(e === 'card');
                    }}
                    style={{
                        backgroundColor: PRIMARY_BLUE,
                        color: PRIMARY_TEXT,
                        float: 'right',
                        marginLeft: 8
                    }}
                    suffixIcon={
                        <DownOutlined
                            style={{ color: PRIMARY_TEXT }}
                        />
                    }
                >
                    <Select.Option value="card">Card</Select.Option>
                    <Select.Option value="image">Image</Select.Option>
                </Select>
            </div>
            <Divider />
            <div
                style={{
                    // display: 'flex',
                    // justifyContent: 'center',
                    // flexWrap: 'wrap',
                }}
            >
                <MultiCollectionBadgeDisplay
                    collections={[collection]}
                    // accountInfo={accounts.accounts[cosmosAddress]}
                    cardView={cardView}
                    groupByCollection={false}
                    pageSize={cardView ? 25 : 1000}
                    hideCollectionLink={true}
                />
            </div>

            {DEV_MODE &&
                <pre style={{ marginTop: '10px', borderTop: '3px dashed white', color: PRIMARY_TEXT, alignContent: 'left', width: '100%', textAlign: 'left' }}>
                    {JSON.stringify(collection, null, 2)}
                </pre>
            }
        </div >
    );
}
