import instanceConfig from "./config-instance.js";
import deepmerge from 'deepmerge';
import { getRuntimeOverrides } from "./src/config/runtime-config-service.js";

const baseConfig = {
    hostip: {
        endpoint: "wss://ws.tunnel.enyo.cc",
        httpEndpoint: "https://all.tunnel.enyo.cc",
        port: "443",
        domainSuffix: "tunnel.enyo.cc"
    },
    runtime: {
        enableLogging: true
    }
}

type ConfigShape = typeof baseConfig;

const runtimeOverrides = getRuntimeOverrides();
const config = deepmerge.all<ConfigShape>([
    baseConfig,
    instanceConfig as Partial<ConfigShape>,
    runtimeOverrides as Partial<ConfigShape>
]) as ConfigShape;

export default config;
