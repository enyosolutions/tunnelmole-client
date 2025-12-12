import CancelForwardedRequestMessage from "../messages/cancel-forwarded-request-message.js";
import { abortPendingRequest } from "../http/pending-requests.js";

export default function cancelForwardedRequest(message: CancelForwardedRequestMessage) {
    abortPendingRequest(message.requestId);
}
