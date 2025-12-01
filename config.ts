import instanceConfig from "./config-instance.js";
import deepmerge from 'deepmerge';

const baseConfig = {
    hostip: {
        endpoint: "all.tunnel.enyo.cc",
        port: "443"
    },
    runtime: {
        enableLogging: true
    }
}


const config = deepmerge(baseConfig, instanceConfig);

export default config;