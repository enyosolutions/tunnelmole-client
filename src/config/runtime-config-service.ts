import fs from 'fs';
import os from 'os';
import path from 'path';

type HostipOverrides = {
    hostip?: {
        endpoint?: string;
        httpEndpoint?: string;
        domainSuffix?: string;
    }
}

const CONFIG_DIR = path.join(os.homedir(), '.tmole.sh');
const CONFIG_FILE = path.join(CONFIG_DIR, 'client-config.json');

const readOverrides = (): HostipOverrides => {
    try {
        if (!fs.existsSync(CONFIG_FILE)) {
            return {};
        }

        const fileContents = fs.readFileSync(CONFIG_FILE, 'utf8');
        if (!fileContents) {
            return {};
        }

        return JSON.parse(fileContents);
    } catch (error) {
        console.error('Warning: unable to parse client config overrides. Using defaults instead.');
        return {};
    }
}

const persistOverrides = (overrides: HostipOverrides) => {
    if (!fs.existsSync(CONFIG_DIR)) {
        fs.mkdirSync(CONFIG_DIR, { recursive: true });
    }

    fs.writeFileSync(CONFIG_FILE, JSON.stringify(overrides, null, 2));
}

const setHostEndpoint = async (endpoint: string): Promise<void> => {
    const overrides = readOverrides();
    overrides.hostip = {
        ...overrides.hostip,
        endpoint
    };
    persistOverrides(overrides);
    console.info(`Remote websocket endpoint set to ${endpoint}\n`);
    process.exit(0);
}

const setHostHttpEndpoint = async (httpEndpoint: string): Promise<void> => {
    const overrides = readOverrides();
    overrides.hostip = {
        ...overrides.hostip,
        httpEndpoint
    };
    persistOverrides(overrides);
    console.info(`Remote HTTP endpoint set to ${httpEndpoint}\n`);
    process.exit(0);
}

const setHostDomainSuffix = async (domainSuffix: string): Promise<void> => {
    const overrides = readOverrides();
    overrides.hostip = {
        ...overrides.hostip,
        domainSuffix
    };
    persistOverrides(overrides);
    console.info(`Domain suffix set to ${domainSuffix}\n`);
    process.exit(0);
}

const getRuntimeOverrides = (): HostipOverrides => {
    return readOverrides();
}

export {
    getRuntimeOverrides,
    setHostEndpoint,
    setHostHttpEndpoint,
    setHostDomainSuffix
}
