import {swapHandler} from "./xyk.mjs";
import {addBotOutput} from '../bot.mjs';
import {formatAccount, formatAmount, formatUsdValue, isWhale, usdValue} from "../currencies.mjs";
//import {broadcast} from "../discord.js";
import {usdCurrencyId} from "../config.mjs";
import {notInRouter} from "./router.mjs";
import {notByReferralPot} from "./referrals.mjs";

export default function omnipoolHandler(events) {
    events
        .onFilter('omnipool', 'SellExecuted', e => notInRouter(e) && notByReferralPot(e), sellHandler)
        .onFilter('omnipool', 'BuyExecuted', notInRouter, buyHandler)
        .on('omnipool', 'LiquidityAdded', liquidityAddedHandler)
        .on('omnipool', 'LiquidityRemoved', liquidityRemovedHandler);
}

async function sellHandler({event}) {
    const {who, assetIn, assetOut, amount: amountIn, salePrice: amountOut} = event.data;
    const message = await swapHandler({who, assetIn, assetOut, amountIn, amountOut});
    addBotOutput(message); // Adiciona a saída do bot
}

async function buyHandler({event}) {
    const {who, assetIn, assetOut, amount: amountOut, buyPrice: amountIn} = event.data;
    const message = await swapHandler({who, assetIn, assetOut, amountIn, amountOut});
    addBotOutput(message); // Adiciona a saída do bot
}

async function liquidityAddedHandler({event}) {
    const {who, assetId: currencyId, amount} = event.data;
    const added = {currencyId, amount};
    const value = currencyId.toString() !== usdCurrencyId ? usdValue(added) : null;
    const message = `💦 omnipool hydrated with **${formatAmount(added)}**${formatUsdValue(value)} by ${formatAccount(who, isWhale(value))}`;
    broadcast(message);
}

async function liquidityRemovedHandler({event, siblings}) {
    const {who, assetId: currencyId} = event.data;
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
    broadcast(message);
}

export {sellHandler, buyHandler};
