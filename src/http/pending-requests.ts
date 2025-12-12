import http from 'http';

const pendingRequests = new Map<string, http.ClientRequest>();

const registerPendingRequest = (requestId: string, request: http.ClientRequest): void => {
    pendingRequests.set(requestId, request);
};

const completePendingRequest = (requestId: string): void => {
    pendingRequests.delete(requestId);
};

const abortPendingRequest = (requestId: string): void => {
    const pending = pendingRequests.get(requestId);

    if (!pending) {
        return;
    }

    pending.destroy();
    pendingRequests.delete(requestId);
};

export {
    registerPendingRequest,
    completePendingRequest,
    abortPendingRequest
};
