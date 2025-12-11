import HostipWebSocket from "../websocket/host-ip-websocket.js";
import ForwardedRequestMessage from "../messages/forwarded-request-message.js";
import http from 'http';
import ForwardedResponseMessage from "../messages/forwarded-response-message.js";
import ForwardedResponseStreamStartMessage from "../messages/forwarded-response-stream-start-message.js";
import ForwardedResponseStreamChunkMessage from "../messages/forwarded-response-stream-chunk-message.js";
import { forwardedResponse, forwardedResponseStreamStart, forwardedResponseStreamChunk } from "../messages/types.js";
import log from "../logging/log.js";
import { Options } from "../options.js";
import chalk from 'chalk';
import { HTTP_STATUS_MESSAGES } from "../http/constants.js";
import { registerPendingRequest, completePendingRequest } from "../http/pending-requests.js";

export default async function forwardedRequest(forwardedRequestMessage: ForwardedRequestMessage, websocket: HostipWebSocket, options : Options) {
    const port = options.port;
    const { requestId, url, headers, method, responseMode } = forwardedRequestMessage;
    const userAgentString = headers['User-Agent'] || "";
    const shouldStreamResponse = responseMode === 'stream';

    const requestOptions : http.RequestOptions = {
        hostname: 'localhost',
        method,
        port,
        path: url,
        headers
    };

    const request = http.request(requestOptions, (response : http.IncomingMessage) => {
        const statusCode = response.statusCode || 200;

        if (shouldStreamResponse) {
            const startMessage: ForwardedResponseStreamStartMessage = {
                type: forwardedResponseStreamStart,
                requestId,
                statusCode,
                url,
                headers: response.headers
            };

            websocket.sendMessage(startMessage);
            console.info(`${getStatusString(statusCode)} ${chalk.bold.white(`${method} ${url}`)} ${userAgentString}`);

            let streamClosed = false;
            const sendChunk = (chunk: Buffer, isFinal = false) => {
                const chunkMessage: ForwardedResponseStreamChunkMessage = {
                    type: forwardedResponseStreamChunk,
                    requestId,
                    url,
                    body: chunk.length > 0 ? chunk.toString('base64') : ''
                };

                if (isFinal) {
                    chunkMessage.isFinal = true;
                }

                websocket.sendMessage(chunkMessage);
            };

            response.on('data', (chunk: Buffer) => {
                if (!streamClosed && chunk.length > 0) {
                    sendChunk(chunk);
                }
            });

            const finalizeStream = () => {
                if (streamClosed) {
                    return;
                }
                streamClosed = true;
                sendChunk(Buffer.alloc(0), true);
                completePendingRequest(requestId);
            };

            response.on('end', finalizeStream);
            response.on('close', finalizeStream);
            response.on('error', (error: any) => {
                log(error);
                finalizeStream();
            });

            return;
        }

        let responseBody : Buffer;
        response.on('data', (chunk: Buffer) => {
            if (typeof responseBody === 'undefined') {
                responseBody = chunk;
            } else {
                responseBody = Buffer.concat([responseBody, chunk]);
            }
        });

        response.on('end', () => {
            const forwardedResponseMessage : ForwardedResponseMessage = {
                type: forwardedResponse,
                requestId,
                statusCode: response.statusCode,
                url,
                headers: response.headers,
                body: ''
            }

            if (Buffer.isBuffer(responseBody)) {
                forwardedResponseMessage.body = responseBody.toString('base64');
            }

            console.info(`${getStatusString(response.statusCode)} ${chalk.bold.white(`${method} ${url}`)} ${userAgentString}`);
            websocket.sendMessage(forwardedResponseMessage);
            completePendingRequest(requestId);
        });

        response.on('error', (error: any) => {
            log(error);
            completePendingRequest(requestId);
        });
    });

    registerPendingRequest(requestId, request);

    if (forwardedRequestMessage.body !== '') {
        const requestBody : Buffer = Buffer.from(forwardedRequestMessage.body, 'base64');
        request.write(requestBody);
    }

    request.on('error', (error : any) => {
        log(error);
        completePendingRequest(requestId);
    });

    request.end();
}

const getStatusString = (statusCode: number): string => {
    const message = HTTP_STATUS_MESSAGES[statusCode] || 'Unknown status code';
    
    let formattedMessage: string;
  
    if (statusCode >= 100 && statusCode < 200) {
        // Informational responses: Blue
        formattedMessage = chalk.blue.bold(`[${statusCode} ${message}]`);
    } else if (statusCode >= 200 && statusCode < 300) {
        // Successful responses: Green
        formattedMessage = chalk.green.bold(`[${statusCode} ${message}]`);
    } else if (statusCode >= 300 && statusCode < 400) {
        // Redirection messages: Cyan
        formattedMessage = chalk.cyan.bold(`[${statusCode} ${message}]`);
    } else if (statusCode >= 400 && statusCode < 500) {
        // Client errors: Yellow
        formattedMessage = chalk.yellow.bold(`[${statusCode} ${message}]`);
    } else if (statusCode >= 500 && statusCode < 600) {
        // Server errors: Red
        formattedMessage = chalk.redBright.bold(`[${statusCode} ${message}]`);
    } else {
        // Fallback: White
        formattedMessage = chalk.white.bold(`[${statusCode} ${message}]`);
    }
    
    return formattedMessage;
};
