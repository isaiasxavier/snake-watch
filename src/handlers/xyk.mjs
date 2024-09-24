import {addBotOutput} from '../bot.mjs';
import {
    formatAccount,
    formatAmount,
    formatUsdValue,
    getPrice,
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

// xyk.mjs
export async function swapHandler({who, assetIn, assetOut, amountIn, amountOut}, action = `swapped`) {
    if (!assetIn || !assetOut) {
        console.error('Invalid asset IDs:', {assetIn, assetOut});
        return;
    }

    const sold = {currencyId: assetIn, amount: amountIn};
    const bought = {currencyId: assetOut, amount: amountOut};

    const currencyIn = await loadCurrency(assetIn);
    const currencyOut = await loadCurrency(assetOut);

    if (!currencyIn || !currencyOut) {
        console.error('Currency data not found for assets:', {assetIn, assetOut});
        return;
    }

    recordPrice(sold, bought);

    let value = await usdValue(bought) || (getPrice(assetOut, usdCurrencyId) ? amountOut / getPrice(assetOut, usdCurrencyId) : null);
    let soldValueInUsd = await usdValue(sold);

    console.log('Value in USD:', value); // Log the value in USD
    console.log('Sold value in USD:', soldValueInUsd); // Log the sold value in USD

    const formattedSoldAmount = formatAmount(sold.amount, currencyIn);
    const formattedBoughtAmount = formatAmount(bought.amount, currencyOut);
    const formattedUsdValue = formatUsdValue(value);
    const formattedSoldValueInUsd = formatUsdValue(soldValueInUsd);

    // Add the description "Stable Coin" for 4-Pool and 2-Pool
    const soldPoolDescription = (currencyIn.symbol === '4-Pool' || currencyIn.symbol === '2-Pool') ? ' (USDT)' : '';
    const boughtPoolDescription = (currencyOut.symbol === '4-Pool' || currencyOut.symbol === '2-Pool') ? ' (USDT)' : '';
    const formattedSoldAmountWithDescription = `${formattedSoldAmount}${soldPoolDescription}`;
    const formattedBoughtAmountWithDescription = `${formattedBoughtAmount}${boughtPoolDescription}`;

    // Format the USDT value
    const usdtValue = value ? ` ~ ${Math.round(value)} USDT` : '';

    let message = `${formatAccount(who, isWhale(value))} ${action} **${formattedSoldAmountWithDescription}** for **${formattedBoughtAmountWithDescription}**${usdtValue}`;
    if (![assetIn, assetOut].map(id => id.toString()).includes(usdCurrencyId)) {
        message += ` (~${formattedSoldValueInUsd})`;
    }

    addBotOutput(message);
}

export async function liquidityAddedHandler({event}) {
    const {who, assetA, assetB, amountA, amountB} = event.data;

    const currencyA = await loadCurrency(assetA);
    const currencyB = await loadCurrency(assetB);

    const formattedAmountA = formatAmount(amountA, currencyA);
    const formattedAmountB = formatAmount(amountB, currencyB);

    const valueA = await usdValue({currencyId: assetA, amount: amountA});
    const valueB = await usdValue({currencyId: assetB, amount: amountB});

    const totalValue = (valueA || 0) + (valueB || 0);

    let message = `💦 liquidity added as **${formattedAmountA}** + **${formattedAmountB}** by ${formatAccount(who, isWhale(totalValue))}`;
    if (![assetA, assetB].map(id => id.toString()).includes(usdCurrencyId)) {
        message += formatUsdValue(totalValue);
    }

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
    const value = currencyId.toString() !== usdCurrencyId ? await usdValue(asset) : null;
    const message = `🚰 omnipool dehydrated of **${formatAmount(asset)}**${formatUsdValue(value)}${lrna} by ${formatAccount(who, isWhale(value))}`;
    addBotOutput(message);
}