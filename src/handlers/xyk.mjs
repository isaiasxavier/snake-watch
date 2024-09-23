import {addBotOutput} from '../bot.mjs';
import {
    formatAccount,
    formatAmount,
    formatUsdValue,
    isWhale,
    loadCurrency,
    recordPrice,
    usdValue
} from "../currencies.mjs";
import {usdCurrencyId} from "../config.mjs";
import {notInRouter} from "./router.mjs";

export default function xykHandler(events) {
    events
        .onFilter('xyk', 'SellExecuted', notInRouter, sellHandler)
        .onFilter('xyk', 'BuyExecuted', notInRouter, buyHandler)
        .on('xyk', 'LiquidityAdded', liquidityAddedHandler)
        .on('xyk', 'LiquidityRemoved', liquidityRemovedHandler);
}

async function sellHandler({event}) {
    const {who, assetIn, assetOut, amount: amountIn, salePrice: amountOut} = event.data;
    return swapHandler({who, assetIn, assetOut, amountIn, amountOut});
}

async function buyHandler({event}) {
    const {who, assetIn, assetOut, amount: amountOut, buyPrice: amountIn} = event.data;
    return swapHandler({who, assetIn, assetOut, amountIn, amountOut});
}

export async function swapHandler({who, assetIn, assetOut, amountIn, amountOut}, action = `swapped`) {
    const sold = {currencyId: assetIn, amount: amountIn};
    const bought = {currencyId: assetOut, amount: amountOut};

    const currencyIn = await loadCurrency(assetIn);
    const currencyOut = await loadCurrency(assetOut);

    recordPrice(sold, bought);
    const value = usdValue(bought);
    let message = `${formatAccount(who, isWhale(value))} ${action} **${formatAmount(sold.amount, currencyIn)}** for **${formatAmount(bought.amount, currencyOut)}**`;
    if (![assetIn, assetOut].map(id => id.toString()).includes(usdCurrencyId)) {
        message += formatUsdValue(value);
    }
    addBotOutput(message);
}

async function liquidityAddedHandler({event}) {
    const {who, assetA, assetB, amountA, amountB} = event.data;
    const a = {amount: amountA, currencyId: assetA};
    const b = {amount: amountB, currencyId: assetB};
    const [va, vb] = [a, b].map(usdValue);
    const value = va && vb ? va + vb : null;
    const message = `💦 liquidity added as **${formatAmount(a)}** + **${formatAmount(b)}**${formatUsdValue(value)} by ${formatAccount(who, isWhale(value))}`;
    addBotOutput(message);
}

async function liquidityRemovedHandler({event, siblings}) {
    const {who, assetId: currencyId} = event.data;

    if (!siblings) {
        console.error('siblings is undefined');
        return;
    }

    const transfers = siblings
        .slice(0, siblings.indexOf(event))
        .reverse()
        .filter(({method, data: {to}}) => method === 'Transferred' && to.toString() === who.toString());

    let asset = transfers[0].data;
    let lrna = '';
    if (asset.currencyId.toNumber() === 1) {
        lrna = ' + ' + formatAmount(asset);
        asset = transfers[1].data;
    }
    const value = currencyId.toString() !== usdCurrencyId ? usdValue(asset) : null;
    const message = `🚰 omnipool dehydrated of **${formatAmount(asset)}**${formatUsdValue(value)}${lrna} by ${formatAccount(who, isWhale(value))}`;
    addBotOutput(message);
}