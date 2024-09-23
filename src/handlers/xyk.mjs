import {decimals, loadCurrency, symbol} from "../currencies.mjs";
import {notInRouter} from "./router.mjs";
import {addBotOutput} from '../bot.mjs'; // Importa a função addBotOutput

export default async function xykHandler(events) {
    if (!Array.isArray(events)) {
        console.error("TypeError: events is not iterable");
        return;
    }

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
    const message = await swapHandler({who, assetIn, assetOut, amountIn, amountOut});
    addBotOutput(message); // Adiciona a saída do bot
}

async function buyHandler({event}) {
    const {who, assetIn, assetOut, amount: amountOut, buyPrice: amountIn} = event.data;
    const message = await swapHandler({who, assetIn, assetOut, amountIn, amountOut});
    addBotOutput(message); // Adiciona a saída do bot
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
    return message; // Retorna a mensagem para ser usada pelo addBotOutput
}