
export const config = {
    // soketi/pusher
    pusher: {
        appKey: 'app-key',
        wsHost: '127.0.0.1',
        wsPort: 6001,
        forceTLS: false,
        cluster: 'mt1', // cluster required by pusher
        enabledTransports: ['ws', 'wss']
    },

    // channel
    channel: {
        name: 'chat-room'
    }
};
