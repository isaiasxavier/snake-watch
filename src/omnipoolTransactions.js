import {api, initApi} from './api.js';
import {rpc} from './config.js'; // Importa o endpoint RPC do config.js
import {decimals, formatUsdValue, loadCurrency, symbol, usdValue} from './currencies.js'; // Importa as funções de conversão para USD e símbolo

export async function main() {
    try {
        await initApi(rpc);
        const apiInstance = api();
        console.log('Connected to the NODE:', rpc);

        // Verifica se a API está inicializada corretamente
        if (!apiInstance.query || !apiInstance.query.system || !apiInstance.query.system.events) {
            console.error('API structure:', apiInstance.query);
            throw new Error('API não foi inicializada corretamente ou propriedade "events" está ausente');
        }

        // Verifica se a metadata está carregada
        const metadata = await apiInstance.rpc.state.getMetadata();
        if (!metadata || metadata.toHex() === '0x') {
            throw new Error('Metadata está vazia ou não foi carregada corretamente');
        }

        // Subscrição para eventos
        apiInstance.query.system.events(async (events) => {
            for (const record of events) {
                const {event, phase} = record; // Filtra eventos da Omnipool (especificamente "SellExecuted")
                if (event.section === 'omnipool' && event.method === 'SellExecuted') {
                    const [accountId, assetSold, assetBought, amountSold, amountBought] = event.data;

                    // Carregar dados dos tokens
                    await loadCurrency(assetSold);
                    await loadCurrency(assetBought);

                    // Obter o número de decimais para cada token
                    const soldDecimals = decimals(assetSold);
                    const boughtDecimals = decimals(assetBought);

                    // Converter valores u128 para um formato legível com decimais
                    const soldAmountReadable = (Number(amountSold) / 10 ** soldDecimals).toFixed(soldDecimals);
                    const boughtAmountReadable = (Number(amountBought) / 10 ** boughtDecimals).toFixed(boughtDecimals);

                    // Truncar o endereço da carteira
                    const truncatedAccountId = accountId.toString().slice(-5);

                    // Valor aproximado em USDT (ou outra moeda de referência)
                    const usdValueSold = usdValue({currencyId: assetSold, amount: amountSold});
                    const usdFormattedValue = formatUsdValue(usdValueSold);

                    // Formatação da mensagem de swap
                    console.log(`${truncatedAccountId} swapped ${soldAmountReadable} ${symbol(assetSold)} for ${boughtAmountReadable} ${symbol(assetBought)} ${usdFormattedValue}`);
                }
            }
        });
    } catch (error) {
        console.error('Falha ao inicializar API:', error);
    }
}

// Chamando a função main
main().catch(console.error);