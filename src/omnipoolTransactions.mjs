// omnipoolTransactions.mjs
import {api} from './api.mjs';
import {decimals, formatUsdValue, loadCurrency, symbol, usdValue} from './currencies.mjs';

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
            for (const record of events) {
                const {event, phase} = record;
                if (event.section === 'omnipool' && event.method === 'SellExecuted') {
                    const [accountId, assetSold, assetBought, amountSold, amountBought] = event.data;

                    await loadCurrency(assetSold);
                    await loadCurrency(assetBought);

                    const soldDecimals = decimals(assetSold);
                    const boughtDecimals = decimals(assetBought);

                    const soldAmountReadable = (Number(amountSold) / 10 ** soldDecimals).toFixed(soldDecimals);
                    const boughtAmountReadable = (Number(amountBought) / 10 ** boughtDecimals).toFixed(boughtDecimals);

                    const truncatedAccountId = accountId.toString().slice(-5);

                    const usdValueSold = usdValue({currencyId: assetSold, amount: amountSold});
                    const usdFormattedValue = formatUsdValue(usdValueSold);

                    console.log(`${truncatedAccountId} swapped ${soldAmountReadable} ${symbol(assetSold)} for ${boughtAmountReadable} ${symbol(assetBought)} ${usdFormattedValue}`);
                }
            }
        });
    } catch (error) {
        console.error('Falha ao inicializar API:', error);
    }
}