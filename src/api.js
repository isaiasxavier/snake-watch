// api.js
import {ApiPromise, WsProvider} from "@polkadot/api";

let initialized = false;
let _api;
let provider;

export async function initApi(rpc) {
    console.warn = () => {
    };
    console.log(`Connecting to RPC at: ${rpc}`);
    provider = new WsProvider(rpc);
    provider.on('connected', () => {
        console.log('WebSocket connected');
    });
    provider.on('disconnected', () => {
        console.log('WebSocket disconnected');
    });
    provider.on('error', (error) => {
        console.error('WebSocket error:', error);
    });
    try {
        _api = await ApiPromise.create({provider});
        initialized = true;
        console.log('API initialized successfully');
    } catch (error) {
        console.error('Failed to initialize API:', error);
        throw error;
    }
}

export async function disconnect() {
    await _api.disconnect();
    provider = null;
    _api = null;
    initialized = false;
}

export function api() {
    if (!initialized || !_api) {
        throw new Error('api not initialized');
    }
    return _api;
}