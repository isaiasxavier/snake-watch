import {api} from "./api.mjs";
import dijkstrajs from "dijkstrajs";
import {usdCurrencyId, whaleAmount} from "./config.mjs";
import {fromAccount} from "./utils/evm.mjs";
import {emojify} from "./utils/emojify.mjs";
import {metadata as fetchMetadata} from './utils/assethub.mjs';


let currencies = {};
const prices = {};

export const isWhale = amount => amount >= whaleAmount;

export function currenciesHandler(events) {
    events
        .onSection('currencies', ({event: {data: {currencyId}}}) => currencyId && loadCurrency([currencyId]))
        .onSection('tokens', ({event: {data: {currencyId}}}) => currencyId && loadCurrency([currencyId]))
        .on('otc', 'Placed', ({event: {data: {assetIn}}}) => assetIn && loadCurrency(assetIn))
}

export async function usdValue({currencyId, amount}) {
    const price = getPrice(currencyId, usdCurrencyId);
    if (price) {
        return amount * price;
    }
    return null;
}

async function loadCurrency(id) {
    if (!currencies[id]) {
        let currency = (await api().query.assetRegistry.assets(id)).toHuman();

        if (api().query.assetRegistry.assetMetadataMap) {
            const metadata = await api().query.assetRegistry.assetMetadataMap(id);
            currency = {...currency, ...metadata.toHuman()};
        }

        if (currency.assetType === 'Bond') {
            const bond = await api().query.bonds.bonds(id);
            const [parent, maturity] = bond.toHuman();
            currency = {...currency, parent, maturity};
        }

        if (currency.assetType === 'External') {
            const location = (await api().query.assetRegistry.assetLocations(id)).toJSON();
            const ahId = location?.interior?.x3[2]?.generalIndex;
            if (ahId) {
                const meta = await fetchMetadata(ahId);
                if (meta) {
                    currency = {...currency, ...meta.toHuman()};
                }
            }
        }

        currencies = {...currencies, [id]: currency};
    }
    return currencies[id];
}

// currencies.mjs
// currencies.mjs
export const recordPrice = (sold, bought) => {
    const pair = [sold, bought];
    const [a, b] = pair.map(({currencyId}) => currencyId.toNumber());
    if (!prices[a]) {
        prices[a] = {};
    }
    prices[a][b] = pair[0].amount / pair[1].amount;
    console.log(`Recorded price: ${prices[a][b]} for pair: ${a} ${b}`); // Log the recorded price
    console.log('Current prices object:', JSON.stringify(prices, null, 2)); // Log the current state of the prices object
}

// currencies.mjs
// currencies.mjs
export function getPrice(asset, target) {
    if (prices[asset] && prices[asset][target]) {
        return prices[asset][target];
    }
    try {
        console.log(`Attempting to find path from ${asset} to ${target}`); // Log the attempt to find a path
        const path = dijkstrajs.find_path(prices, asset, target);
        console.log('Path found:', path); // Log the path found
        const swaps = path.map((from, i) => [from, path[i + 1]]).filter(([, to]) => to);
        const price = swaps.reduce((acc, [from, to]) => acc * prices[from][to], 1);
        console.log('Calculated price:', price); // Log the calculated price
        return price;
    } catch (e) {
        console.error(`Error finding path or calculating price from ${asset} to ${target}:`, e); // Log any errors
        console.log('Current prices object:', JSON.stringify(prices, null, 2)); // Log the current state of the prices object
        return null;
    }
}

export const hdx = amount => ({currencyId: 0, amount});

export function symbol(currency) {
    // Verificação de existência da propriedade assetType
    if (!currency || typeof currency.assetType === 'undefined') {
        console.error("Currency ou assetType está indefinido:", currency);
        return "N/A";  // Retorna um valor padrão ou lança um erro
    }

    switch (currency.assetType) {
        case 'HDX':
            return 'HDX';
        case 'DAI':
            return 'DAI';
        // Adicione mais casos aqui conforme necessário
        default:
            return 'Unknown';
    }
}

async function decimals(id) {
    if (!currencies[id]) {
        let currency = (await api().query.assetRegistry.assets(id)).toHuman();
        if (api().query.assetRegistry.assetMetadataMap) {
            const metadata = await api().query.assetRegistry.assetMetadataMap(id);
            currency = {...currency, ...metadata.toHuman()};
        }
        currencies[id] = currency;
    }

    const currency = currencies[id];
    if (!currency || !currency.assetType) {
        console.error(`Currency or assetType not found for id: ${id}`);
        return null; // or a default value
    }

    return currency.assetType === 'Token' ? currency.decimals : 12; // Adjust as needed
}

const short = address => "`" + (fromAccount(address.toString()) || address.toString()).substr(-3) + "`";
const url = (prefix, address) => `[${short(address)}](${prefix}/${address})`;
const maybeUrl = address => {
    const explorer = process.env.EXPLORER;
    return explorer ? url(explorer, address) : short(address);
}
export const icon = address => currencies[0]?.symbol === 'HDX' ? emojify(address) : `🐍`;
export const formatAccount = (address, whale) => (whale ? '🐋' : icon(address)) + `${maybeUrl(address)}`;

export function formatAmount(amount, currency) {
    if (!currency) {
        return 'Invalid currency';
    }

    const decimals = currency.decimals || 0;
    const formattedAmount = (amount / Math.pow(10, decimals)).toFixed(decimals);
    return `${formattedAmount} ${currency.symbol || 'Unknown'}`;
}

export const formatUsdValue = value => {
    if (!value) {
        return '';
    }
    let amount = Number(value) / 10 ** (currencies[usdCurrencyId].decimals || 12);
    amount = amount > 1 ? Math.round(amount) : amount;
    const symbol = currencies[usdCurrencyId].symbol || currencies[usdCurrencyId].name || 'USD';
    return ` ~ ${new Intl.NumberFormat('en-US', {
        maximumSignificantDigits: amount < 1 ? 1 : 4,
        maximumFractionDigits: 2
    }).format(amount).replace(/,/g, " ")} ${symbol}`;
};

// currencies.mjs
export {loadCurrency};