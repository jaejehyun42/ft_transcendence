declare var Chart: any;

async function loadGameStats() {
    try {
            const response = await fetch(`/api/game-stats`, {
            method: 'GET',
            credentials: 'include', // 인증 필요 시 사용
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const gameData = await response.json();
        return gameData;
    } catch (error) {
        console.error('❌ Error fetching game stats:', error);
        return null;
    }
}

async function calculateWinRates() {
    const gameData = await loadGameStats();

    if (!gameData || gameData.length === 0) {
        return { totalWins: 0, totalLosses: 0, pveWins: 0, pveLosses: 0, pvpWins: 0, pvpLosses: 0 };
    }

    let totalWins = 0, totalLosses = 0;
    let pveWins = 0, pveLosses = 0;
    let pvpWins = 0, pvpLosses = 0;

    console.log(gameData);
    gameData.forEach((game: any) => {
        totalWins += (game.ai_win || 0) + (game.human_win || 0);
        totalLosses += (game.ai_lose || 0) + (game.human_lose || 0);
        pveWins += game.ai_win || 0;
        pveLosses += game.ai_lose || 0;
        pvpWins += game.human_win || 0;
        pvpLosses += game.human_lose || 0;
    });

    return {
        totalWins, totalLosses,
        pveWins, pveLosses,
        pvpWins, pvpLosses
    };
}

function createWinRateChart(canvasId: string, wins: number, loses: number, label: string) {
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!canvas) {
        console.error(`Error: Cannot find canvas element with ID ${canvasId}`);
        return;
    }

    new Chart(canvas.getContext('2d')!, {
        type: 'doughnut',
        data: {
            labels: ["Wins", "Losses"],
            datasets: [{
                label: label,
                data: [wins, loses],
                backgroundColor: ["#4CAF50", "#FF6384"],
                hoverOffset: 4
            }]
        },
        options: {
            responsive: false,
            aspectRatio: 1,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top'
                },
                title: {
                    display: true,
                    text: label
                }
            }
        }
    });
}

export async function setUpChart() {
    const { totalWins, totalLosses, pveWins, pveLosses, pvpWins, pvpLosses } = await calculateWinRates();

    createWinRateChart("totalWinRate", totalWins, totalLosses, "Total Win Rate");
    createWinRateChart("PvEWinRate", pveWins, pveLosses, "PvE Win Rate");
    createWinRateChart("PvPWinRate", pvpWins, pvpLosses, "PvP Win Rate");
}