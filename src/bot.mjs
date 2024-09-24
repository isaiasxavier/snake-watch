import {api, initApi} from './api.mjs';
import {Events} from "./events.mjs";
import xyk from "./handlers/xyk.mjs";
import lbp from "./handlers/lbp.mjs";
import omnipool from "./handlers/omnipool.mjs";
import stableswap from "./handlers/stableswap.mjs";
import router from "./handlers/router.mjs";
import transfers from "./handlers/transfers.mjs";
import otc from "./handlers/otc.mjs";
import dca from "./handlers/dca.mjs";
import staking from "./handlers/staking.mjs";
import referrals from "./handlers/referrals.mjs";
import {rpc, sha} from "./config.mjs";
import {currenciesHandler} from "./currencies.mjs";
import {main as omnipoolTransactionsMain} from './omnipoolTransactions.mjs';
import {main as xykTransactionsMain} from './xykTransactions.mjs';
import express from 'express';

let isApiInitialized = false;
let botOutput = [];

// Função para adicionar saída ao array
export function addBotOutput(output) {
    const timestamp = new Date().toISOString();
    botOutput.push(`${timestamp} ${output}`);
}

// Função principal para iniciar o bot
async function main() {
    if (isApiInitialized) {
        console.log('API já foi inicializada.');
        return;
    }

    console.log('Iniciando API...');
    isApiInitialized = true;

    console.log('🐍⌚');
    console.log(`snakewatch ${sha}`);
    await initApi(rpc);
    const {rpc: {system}} = api();
    const [chain, version] = await Promise.all([system.chain(), system.version()]);
    console.log(`connected to ${rpc} (${chain} ${version})`);

    const events = new Events();
    events.addHandler(currenciesHandler);
    events.addHandler(xyk);
    events.addHandler(lbp);
    events.addHandler(omnipool);
    events.addHandler(stableswap);
    events.addHandler(router);
    events.addHandler(otc);
    events.addHandler(dca);
    events.addHandler(transfers);
    events.addHandler(staking);
    events.addHandler(referrals);

    console.log('watching for new blocks');
    events.startWatching();

    await omnipoolTransactionsMain();
    await xykTransactionsMain();
}

// Chamando a função principal e tratando erros
main().catch(err => {
    console.error(err);
    process.exit(1);
});

// Configurando o servidor HTTP usando express
const app = express();
const port = 3000;

// Endpoint para retornar a saída do bot
app.get('/run-bot', (req, res) => {
    res.json(botOutput);
});

// Iniciando o servidor HTTP na porta 3000
app.listen(port, '0.0.0.0', () => {
    console.log(`Bot HTTP API listening at http://0.0.0.0:${port}`);
});