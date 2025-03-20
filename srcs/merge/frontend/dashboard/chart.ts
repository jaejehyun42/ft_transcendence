declare var Chart: any;

async function fetchGameStatsById(id: number) {
    try {
        const response = await fetch(`/api/game-stats/${id}`, {
            method: 'GET',
            credentials: 'include', // 인증 필요 시 사용
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const gameData = await response.json();
        console.log(`🎯 ID=${id} 게임 데이터:`, gameData);
        return gameData;
    } catch (error) {
        console.error('❌ Error fetching game stats:', error);
        return null;
    }
}

async function calculateWinRates() {
    const gameData = await fetchGameStatsById(1);

    if (gameData.length === 0) {
        return { totalWinRate: 0, PvEWinRate: 0, PvPWinRate: 0 };
    }

    let totalWins = 0, totalLosses = 0;
    let pveWins = 0, pveLosses = 0;
    let pvpWins = 0, pvpLosses = 0;

    gameData.forEach((game: any) => {
        totalWins += game.ai_win + game.human_win;
        totalLosses += game.ai_lose + game.human_lose;
        pveWins += game.ai_win;
        pveLosses += game.ai_lose;
        pvpWins += game.human_win;
        pvpLosses += game.human_lose;
    });

    return {
        totalWinRate: totalWins / (totalWins + totalLosses) * 100 || 0,
        PvEWinRate: pveWins / (pveWins + pveLosses) * 100 || 0,
        PvPWinRate: pvpWins / (pvpWins + pvpLosses) * 100 || 0
    };
}

function createWinRateChart(canvasId: string, winRate: number, label: string) {
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
                data: [winRate, 100 - winRate],
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
    const { totalWinRate, PvEWinRate, PvPWinRate } = await calculateWinRates();

    createWinRateChart("totalWinRate", totalWinRate, "Total Win Rate");
    createWinRateChart("PvEWinRate", PvEWinRate, "PvE Win Rate");
    createWinRateChart("PvPWinRate", PvPWinRate, "PvP Win Rate");
}