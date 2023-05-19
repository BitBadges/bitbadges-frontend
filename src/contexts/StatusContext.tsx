/* eslint-disable react-hooks/exhaustive-deps */
import { DbStatus } from 'bitbadgesjs-utils';
import { createContext, useContext, useState, useEffect } from 'react';
import { getStatus } from '../bitbadges-api/api';

export type StatusContextType = {
    status: DbStatus,
    updateStatus: () => Promise<void>,
}

const StatusContext = createContext<StatusContextType>({
    status: {
        block: {
            height: 0,
        },
        queue: [],
        nextCollectionId: 1,
        gasPrice: 0,
        lastXGasPrices: [],
    },
    updateStatus: async () => { }

});

type Props = {
    children?: React.ReactNode
};

export const StatusContextProvider: React.FC<Props> = ({ children }) => {
    const [status, setStatus] = useState<DbStatus>({
        block: {
            height: 0,
        },
        queue: [],
        nextCollectionId: 1,
        gasPrice: 0,
        lastXGasPrices: [],
    });

    useEffect(() => {
        async function fetchStatus() {
            const res = await getStatus();
            setStatus(res.status);
        }
        fetchStatus();
    }, [])

    const updateStatus = async () => {
        const res = await getStatus();
        setStatus(res.status);
    }

    const statusContext: StatusContextType = {
        status,
        updateStatus
    };

    return <StatusContext.Provider value={statusContext}>
        {children}
    </StatusContext.Provider>;
}

export const useStatusContext = () => useContext(StatusContext);