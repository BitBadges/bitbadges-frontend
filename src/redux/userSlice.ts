const { createSlice } = require('@reduxjs/toolkit');

export const defaultProfileInfo = {
    username: '',
    bio: '',
    email: '',
    twitter: '',
    instagram: '',
    website: '',
    profilePic: '',
    bannerColorOne: '',
    bannerColorTwo: '',
    activity: [],
    likes: [],
    pinned: [],
    customDisplay: {},
    hidden: [],
    blockedUsers: [],
    loading: true,
    offering: [],
    concepts: [],
};

export const userSlice = createSlice({
    name: 'user',
    initialState: {
        sequence: 0,
        address: undefined,
        publicKey: undefined,
        accountNumber: undefined,
        isRegistered: false,


        // userPendingBadges: [],
        // userCreatedBadges: [],
        // userReceivedBadges: [],
        // userBalancesMap: {},
        // numPending: 0,
        // badgeMap: {},
        profileInfo: {
            ...defaultProfileInfo,
        },
    },
    reducers: {
        incrementSequence: (state: any) => {
            state.sequence += 1;
        },
        setSequence: (state: any, action: any) => {
            state.sequence = action.payload;
        },
        setAddress: (state: any, action: any) => {
            state.address = action.payload;
        },
        setPublicKey: (state: any, action: any) => {
            state.publicKey = action.payload;
        },
        setAccountNumber: (state: any, action: any) => {
            state.accountNumber = action.payload;
        },
        setIsRegistered: (state: any, action: any) => {
            state.isRegistered = action.payload;
        },


        // setUserPendingBadges: (state: any, action: any) => {
        //     state.userPendingBadges = action.payload;
        // },
        // setUserCreatedBadges: (state, action) => {
        //     state.userCreatedBadges = action.payload;
        // },
        // setUserReceivedBadges: (state, action) => {
        //     state.userReceivedBadges = action.payload;
        // },
        // setUserBalancesMap: (state, action) => {
        //     state.userBalancesMap = action.payload;
        // },
        // setNumPending: (state, action) => {
        //     state.numPending = action.payload;
        // },
        // setBadgeMap: (state, action) => {
        //     state.badgeMap = {
        //         ...state.badgeMap,
        //         ...action.payload,
        //     };
        // },
        // setProfileInfo: (state, action) => {
        //     state.profileInfo = action.payload;
        // },
    },
});

export const userReducer = userSlice.reducer;

export const userActions = userSlice.actions;
