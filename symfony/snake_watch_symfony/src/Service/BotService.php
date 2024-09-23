<?php

namespace App\Service;

use Symfony\Contracts\HttpClient\HttpClientInterface;

class BotService
{
    private HttpClientInterface $httpClient;

    public function __construct(HttpClientInterface $httpClient)
    {
        $this->httpClient = $httpClient;
    }

    public function runBotScript(): array
    {
        $response = $this->httpClient->request('GET', 'http://bot:3000/run-bot');

        if (200 !== $response->getStatusCode()) {
            throw new \RuntimeException('Failed to execute bot script: '.$response->getContent(false));
        }

        return $response->toArray();
    }
}