import {api} from './api.mjs';
import {addBotOutput} from './bot.mjs';
import {Events} from './events.mjs'; // Adicione esta linha
import omnipoolHandler from './handlers/omnipool.mjs';

export async function main() {
    try {
        const apiInstance = api();

        if (!apiInstance.query || !apiInstance.query.system || !apiInstance.query.system.events) {
            console.error('API structure:', apiInstance.query);
            throw new Error('API não foi inicializada corretamente ou propriedade "events" está ausente');
        }

        const metadata = await apiInstance.rpc.state.getMetadata();
        if (!metadata || metadata.toHex() === '0x') {
            throw new Error('Metadata está vazia ou não foi carregada corretamente');
        }

        apiInstance.query.system.events(async (events) => {
            const eventHandler = new Events();
            omnipoolHandler(eventHandler);
            await eventHandler.emit(events);
        });
    } catch (error) {
        console.error('Falha ao inicializar API:', error);
        addBotOutput(`Falha ao inicializar API: ${error.message}`);
    }
}