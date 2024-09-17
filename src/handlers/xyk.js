// src/handlers/xyk.js
import {decimals, loadCurrency, symbol} from "../currencies.js";
import {notInRouter} from "./router.js";

export default async function xykHandler(events) {
    for (const record of events) {
        const {event, phase} = record;
        const siblings = events.filter(({phase: siblingPhase}) =>
            (phase.isApplyExtrinsic && siblingPhase.isApplyExtrinsic && phase.asApplyExtrinsic.eq(siblingPhase.asApplyExtrinsic)) ||
            (phase.isFinalization && siblingPhase.isFinalization)
        );

        if (event.section === 'xyk') {
            if (event.method === 'SellExecuted' && notInRouter({event, siblings})) {
                await sellHandler({event});
            } else if (event.method === 'BuyExecuted' && notInRouter({event, siblings})) {
                await buyHandler({event});
            }
        }
    }
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
    await loadCurrency(assetIn);
    await loadCurrency(assetOut);

    const soldDecimals = decimals(assetIn);
    const boughtDecimals = decimals(assetOut);

    const soldAmountReadable = (Number(amountIn) / 10 ** soldDecimals).toFixed(soldDecimals);
    const boughtAmountReadable = (Number(amountOut) / 10 ** boughtDecimals).toFixed(boughtDecimals);

    const truncatedAccountId = who.toString().slice(-5);

    const message = `${truncatedAccountId} ${action} ${soldAmountReadable} ${symbol(assetIn)} for ${boughtAmountReadable} ${symbol(assetOut)}`;
    console.log(message);
}