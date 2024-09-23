import {swapHandler} from "./xyk.mjs";
import {notInRouter} from "./router.mjs";
import {addBotOutput} from '../bot.mjs'; // Importa a função addBotOutput

export default function lbpHandler(events) {
    events
        .onFilter('lbp', 'SellExecuted', notInRouter, sellHandler)
        .onFilter('lbp', 'BuyExecuted', notInRouter, buyHandler)
}

async function sellHandler({event}) {
    const {who, assetIn, assetOut, amount, salePrice: amountOut, feeAsset, feeAmount} = event.data;
    const amountIn = Number(assetIn) === Number(feeAsset) ? amount.add(feeAmount) : amount;
    const message = await swapHandler({who, assetIn, assetOut, amountIn, amountOut});
    addBotOutput(message); // Adiciona a saída do bot
}

async function buyHandler({event}) {
    const {who, assetIn, assetOut, amount: amountIn, buyPrice: amountOut} = event.data;
    const message = await swapHandler({who, assetIn, assetOut, amountIn, amountOut});
    addBotOutput(message); // Adiciona a saída do bot
}