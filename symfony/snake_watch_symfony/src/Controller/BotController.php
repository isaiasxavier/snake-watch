<?php

namespace App\Controller;

use App\Service\BotService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

class BotController extends AbstractController
{
    private BotService $botService;

    public function __construct(BotService $botService)
    {
        $this->botService = $botService;
    }

    #[Route('/', name: 'app_home')]
    public function home(): Response
    {
        return $this->render('bot/bot.html.twig');
    }

    #[Route('/api/bot-output', name: 'app_bot_output')]
    public function getBotOutput(): JsonResponse
    {
        $output = $this->botService->runBotScript();
        return new JsonResponse($output);
    }
}