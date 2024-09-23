// src/xykTransactions.js
import {api, initApi} from './api.js';
import {rpc} from './config.js';
import xykHandler from './handlers/xyk.mjs';

export async function main() {
    try {
        await initApi(rpc);
        const apiInstance = api();
        console.log('Connected to the NODE:', rpc);

        if (!apiInstance.query || !apiInstance.query.system || !apiInstance.query.system.events) {
            console.error('API structure:', apiInstance.query);
            throw new Error('API não foi inicializada corretamente ou propriedade "events" está ausente');
        }

        const metadata = await apiInstance.rpc.state.getMetadata();
        if (!metadata || metadata.toHex() === '0x') {
            throw new Error('Metadata está vazia ou não foi carregada corretamente');
        }

        apiInstance.query.system.events(async (events) => {
            await xykHandler(events);
        });
    } catch (error) {
        console.error('Falha ao inicializar API:', error);
    }
}

main().catch(console.error);