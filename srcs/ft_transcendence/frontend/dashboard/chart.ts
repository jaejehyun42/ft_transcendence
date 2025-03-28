import Chart from 'chart.js/auto';
import { TooltipItem } from 'chart.js/auto';
import ChartDataLabels from 'chartjs-plugin-datalabels';

// 폰트 설정 등록
Chart.defaults.color = '#374151';
Chart.defaults.font.family = 'CookieRun-Regular, sans-serif';

let charts: Record<string, Chart | null> = {};

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

function createWinRateChart(canvasId: string, wins: number, losses: number, label: string, lang: string) {
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!canvas) return;

    if (charts[canvasId])
        charts[canvasId]?.destroy();

    const ctx = canvas.getContext('2d')!;
    const hasData = wins + losses > 0;
    
    let data, labels, backgroundColor;

    if (hasData) {
        // 정상 데이터
        data = [wins, losses];
        if (lang === "en")
            labels = ["WIN", "LOSE"];
        else if (lang === "ko")
            labels = ["승", "패"];
        else
            labels = ["Victoire", "Défaite"];

        const gradientWin = ctx.createLinearGradient(0, 0, 0, 150);
        gradientWin.addColorStop(0, '#6EE7B7');
        gradientWin.addColorStop(1, '#34D399');

        const gradientLoss = ctx.createLinearGradient(0, 0, 0, 150);
        gradientLoss.addColorStop(0, '#FCA5A5');
        gradientLoss.addColorStop(1, '#EF4444');

        backgroundColor = [gradientWin, gradientLoss];
    } else {
        // 데이터 없음 -> 빈 차트 형태 유지
        data = [1];
        if (lang === "en")
            labels = ["No Data"];
        else if (lang === "ko")
            labels = ["데이터 없음"];
        else
            labels = ["Aucune donnée"];
        backgroundColor = ["#E5E7EB"];
    }

    const newChart = new Chart(ctx, {
        type: 'doughnut',
        plugins: [ChartDataLabels],
        data: {
            labels: labels as string[],
            datasets: [{
                label: label as string,
                data: data as number[],
                backgroundColor: backgroundColor as (string | CanvasGradient)[],
                borderColor: '#F3F4F6',
                borderWidth: 3,
                hoverOffset: 8,
            }]
        },
        options: {
            responsive: false,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        boxWidth: 16,
                        padding: 20,
                        font: { size: 14 }
                    }
                },
                title: {
                    display: true,
                    text: label,
                    padding: 16,
                    font: { size: 18 }
                },
                tooltip: {
                    bodyFont: { size: 14 },
                    titleFont: { size: 16 },
                    padding: 12,
                    callbacks: {
                        title: function() {
                            return '';
                        },
                        label: function (tooltipItem: TooltipItem<'doughnut'>) {
                            if (!hasData)
                            {
                                if (lang === "en")
                                    return `No Data`;
                                else if (lang === "ko")
                                    return `데이터 없음`;
                                else
                                    return `Aucune donnée`;
                            }
                            const dataset = tooltipItem.dataset;
                            const data = dataset.data as number[];
                            const value = data[tooltipItem.dataIndex];
                            const total = data.reduce((sum: number, num: number) => sum + num, 0);
                            const percentage = total > 0 ? ((value / total) * 100).toFixed(2) : "0.00";
                            return ` ${tooltipItem.label}: ${value} (${percentage}%)`;
                        }
                    }
                },
                datalabels: {
                    color: hasData ? '#FFFFFF' : '#9CA3AF',
                    font: { weight: 'bold' },
                    formatter: (value: number) => {
                        if (!hasData)
                            return "";
                        const percentage = (value / (wins + losses)) * 100;
                        return percentage > 0 ? `${Math.round(percentage)}%` : "";
                    }
                }
            },
            animation: {
                duration: 1500,
                easing: 'easeInOutQuart'
            }
        }
    });
    charts[canvasId] = newChart;
}

export async function setUpChart() {
    const canvas = document.getElementById("totalWinRate") as HTMLCanvasElement
    if (!canvas) return;

    const currentLang = localStorage.getItem("language") || "en";
    const { totalWins, totalLosses, pveWins, pveLosses, pvpWins, pvpLosses } = await calculateWinRates();

    if (currentLang === "en")
    {
        createWinRateChart("totalWinRate", totalWins, totalLosses, "Total Win Rate", currentLang);
        createWinRateChart("PvEWinRate", pveWins, pveLosses, "PvE Win Rate", currentLang);
        createWinRateChart("PvPWinRate", pvpWins, pvpLosses, "PvP Win Rate", currentLang);
    }
    else if (currentLang === "ko")
    {
        createWinRateChart("totalWinRate", totalWins, totalLosses, "전체 승률", currentLang);
        createWinRateChart("PvEWinRate", pveWins, pveLosses, "PvE 승률", currentLang);
        createWinRateChart("PvPWinRate", pvpWins, pvpLosses, "PvP 승률", currentLang);
    }
    else
    {
        createWinRateChart("totalWinRate", totalWins, totalLosses, "Taux de victoire global", currentLang);
        createWinRateChart("PvEWinRate", pveWins, pveLosses, "Taux de victoire PVE", currentLang);
        createWinRateChart("PvPWinRate", pvpWins, pvpLosses, "Taux de victoire PVP", currentLang);
    }
}