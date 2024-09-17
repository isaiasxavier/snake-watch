import {WebSocketServer} from 'ws';

const wss = new WebSocketServer({host: '127.0.0.1', port: 9988});
let subscriptionId = 1; // Variável para gerenciar IDs de assinatura

wss.on('connection', function connection(ws) {
    console.log('Client connected');

    ws.on('message', function message(data) {
        const jsonString = data.toString();
        console.log('Received message:', jsonString);

        try {
            const messageObject = JSON.parse(jsonString);
            console.log('Parsed message:', messageObject);

            let response;
            switch (messageObject.method) {
                case 'chain_getBlockHash':
                    response = {
                        jsonrpc: "2.0",
                        id: messageObject.id,
                        result: '0x'.padEnd(66, '0') // Hex string com 32 bytes
                    };
                    break;

                case 'chain_getRuntimeVersion':
                case 'state_getRuntimeVersion':
                    response = {
                        jsonrpc: "2.0",
                        id: messageObject.id,
                        result: {
                            specName: "simple",
                            implName: "simple",
                            authoringVersion: 1,
                            specVersion: 1,
                            implVersion: 1,
                            apis: []
                        }
                    };
                    break;

                case 'state_getMetadata':
                    response = {
                        jsonrpc: "2.0",
                        id: messageObject.id,
                        result: '0x' // Placeholder de metadados
                    };
                    break;

                case 'system_chain':
                    response = {
                        jsonrpc: "2.0",
                        id: messageObject.id,
                        result: 'dummy chain' // Nome fictício da cadeia
                    };
                    break;

                case 'system_version':
                    response = {
                        jsonrpc: "2.0",
                        id: messageObject.id,
                        result: '1.0.0' // Versão fictícia
                    };
                    break;

                case 'system_properties':
                    response = {
                        jsonrpc: "2.0",
                        id: messageObject.id,
                        result: {} // Propriedades fictícias
                    };
                    break;

                case 'rpc_methods':
                    response = {
                        jsonrpc: "2.0",
                        id: messageObject.id,
                        result: {
                            methods: [
                                'chain_getBlockHash',
                                'chain_getRuntimeVersion',
                                'state_getRuntimeVersion',
                                'state_getMetadata',
                                'system_chain',
                                'system_version',
                                'system_properties',
                                'rpc_methods',
                                'state_subscribeRuntimeVersion',
                                'system_health'
                            ],
                            version: 1
                        }
                    };
                    break;

                case 'state_subscribeRuntimeVersion':
                    subscriptionId++;
                    response = {
                        jsonrpc: "2.0",
                        id: messageObject.id,
                        result: subscriptionId.toString() // ID de assinatura válido
                    };

                    // Simulando uma notificação periódica para "subscription"
                    const interval = setInterval(() => {
                        const notification = {
                            jsonrpc: "2.0",
                            method: "state_runtimeVersion", // Método que o cliente espera
                            params: {
                                subscription: subscriptionId.toString(),
                                result: {
                                    specName: "simple",
                                    implName: "simple",
                                    authoringVersion: 1,
                                    specVersion: 1,
                                    implVersion: 1,
                                    apis: []
                                }
                            }
                        };
                        ws.send(JSON.stringify(notification));
                    }, 5000); // Enviar notificações a cada 5 segundos

                    // Parar as notificações ao desconectar
                    ws.on('close', () => clearInterval(interval));
                    break;

                case 'system_health':
                    response = {
                        jsonrpc: "2.0",
                        id: messageObject.id,
                        result: {
                            peers: 0,
                            isSyncing: false,
                            shouldHavePeers: true
                        }
                    };
                    break;
                case 'state_subscribeStorage':
                    subscriptionId++;
                    response = {
                        jsonrpc: "2.0",
                        id: messageObject.id,
                        result: subscriptionId.toString() // Retorna um ID de assinatura válido
                    };

                    // Simula o envio de eventos fictícios a cada 5 segundos
                    const eventInterval = setInterval(() => {
                        const eventNotification = {
                            jsonrpc: "2.0",
                            method: "state_storage",
                            params: {
                                subscription: subscriptionId.toString(),
                                result: [
                                    {
                                        phase: '0x00',
                                        event: {
                                            method: 'omnipool.TransactionExecuted', // Evento fictício
                                            section: 'omnipool',
                                            data: ['0x01', '0x02'] // Dados fictícios de evento
                                        }
                                    }
                                ]
                            }
                        };
                        ws.send(JSON.stringify(eventNotification));
                    }, 5000);

                    // Limpar o intervalo quando o cliente desconectar
                    ws.on('close', () => clearInterval(eventInterval));
                    break;


                default:
                    response = {
                        jsonrpc: "2.0",
                        id: messageObject.id,
                        error: {
                            code: -32601,
                            message: 'Method not found'
                        }
                    };
            }

            console.log('Sending response:', response);
            ws.send(JSON.stringify(response));

        } catch (error) {
            console.error('Failed to parse message as JSON:', jsonString);
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected');
    });

    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
    });

    ws.send(JSON.stringify({message: 'Hello! Message from server...'}));
});

console.log('WebSocket server is running on ws://127.0.0.1:9988');