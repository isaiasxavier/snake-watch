import {swapHandler} from "./xyk.mjs";
import {notInDca} from "./dca.mjs";

export default function routerHandler(events) {
    events
        .onFilter('router', 'Executed', notInDca, executedHandler);
}

const isBuy = ({event, siblings}) => {
    if (!siblings) {
        return false;
    }
    return siblings
        .slice(0, siblings.indexOf(event))
        .find(({section, method}) => `${section}.${method}` === 'xyk.BuyExecuted') !== undefined;
};

const isSell = ({event, siblings}) => {
    if (!siblings) {
        return false;
    }
    return siblings
        .slice(0, siblings.indexOf(event))
        .find(({section, method}) => `${section}.${method}` === 'xyk.SellExecuted') !== undefined;
};

async function executedHandler({event, siblings}) {
    const {who, assetIn, assetOut, amount: amountIn, salePrice: amountOut} = event.data;
    if (isBuy({event, siblings})) {
        return swapHandler({who, assetIn, assetOut, amountIn, amountOut}, 'bought');
    }
    if (isSell({event, siblings})) {
        return swapHandler({who, assetIn, assetOut, amountIn, amountOut}, 'sold');
    }
}

export function notInRouter(event) {
    const {siblings} = event;
    if (!siblings) {
        return true;
    }
    return siblings.find(({section, method}) => `${section}.${method}` === 'router.Executed') === undefined;
}