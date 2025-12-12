export default interface ForwardedResponseStreamChunkMessage {
    type: 'forwardedResponseStreamChunk';
    requestId: string;
    url: string;
    body: string;
    isFinal?: boolean;
}
