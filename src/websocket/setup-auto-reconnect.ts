
/*
 * Handle automatic reconnection if a custom subdomain is used. Use a delay with exponential backoff.
 */
import log from "../logging/log.js";
import { Options } from "../options.js";
import { connect } from "./connect.js";
import HostipWebSocket from "./host-ip-websocket";

let reconnectAttempts = 0;
let isReconnecting = false;
const maxReconnectDelay = 30000; // Maximum delay of 30 seconds
const baseReconnectDelay = 1000; // Start with 1 second


// Every 6 hours, reset reconnectAttempts. This should keep reconnections fast for long lived connections.
let resetConnnectionAttemptsInterval;
const resetTheConnectionAttemptsInterval = () => {
    resetConnnectionAttemptsInterval = setInterval(() => {
        reconnectAttempts = 0;
    }, 21600000);
}

const attemptReconnection = async (options: Options) => {
    if (isReconnecting) return;
    isReconnecting = true;
    
    reconnectAttempts++;
    const reconnectDelay = Math.min(baseReconnectDelay * Math.pow(2, reconnectAttempts - 1), maxReconnectDelay);
    
    setTimeout(async () => {
        log("Got disconnected, attempting to reconnect...", "warning");
        try {
            const newWebsocket = await connect(options);
            isReconnecting = false;  
            setUpAutoReconnect(options, newWebsocket);
        } catch (error) {
            log("Reconnection attempt failed.", "error");
            isReconnecting = false;
            attemptReconnection(options);
        }
    }, reconnectDelay);
};

const setUpAutoReconnect = async(
    options: Options,
    websocket: HostipWebSocket
) => {
    // Always listen for disconnects so the CLI (and API consumers) are aware their tunnel has died.
    websocket.on('close', () => {
        if (typeof options.domain === 'string') {
            attemptReconnection(options);
            return;
        }

        log('Tunnel disconnected. Please restart Tunnelmole to get a new public URL.', 'error');
        process.exit(1);
    });

    // We can only reliably reconnect custom subdomains. Otherwise we'd hand out a brand new random subdomain.
    if (typeof options.domain === 'string') {
        resetTheConnectionAttemptsInterval();
    }
}

export { setUpAutoReconnect }
