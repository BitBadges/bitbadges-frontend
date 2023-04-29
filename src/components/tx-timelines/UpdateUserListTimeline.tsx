import { FormTimeline } from '../navigation/FormTimeline';
import { TxTimelineProps } from './TxTimeline';
import { UserListSelectStepItem } from './step-items/UserListStepItem';

//See TxTimeline for explanations and documentation

export function UpdateUserListTimeline({
    txTimelineProps
}: {
    txTimelineProps: TxTimelineProps
}) {
    const userList = txTimelineProps.userList;
    const setUserList = txTimelineProps.setUserList;

    const UserListStep = UserListSelectStepItem(userList, setUserList)

    return (
        <FormTimeline
            items={[
              UserListStep,
            ]}
            onFinish={() => {
                if (txTimelineProps.onFinish) txTimelineProps.onFinish(txTimelineProps);
            }}
        />
    );
}
