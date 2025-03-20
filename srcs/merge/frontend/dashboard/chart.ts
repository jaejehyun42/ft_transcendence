declare var Chart: any;

export function setUpChart() {
	
	const ctx = (document.getElementById('totalWinRate') as HTMLCanvasElement).getContext('2d');
	const ctx1 = (document.getElementById('PvEWinRate') as HTMLCanvasElement).getContext('2d');
	const ctx2 = (document.getElementById('PvPWinRate') as HTMLCanvasElement).getContext('2d');

	const total_data = {
		labels: [
			'Lose',
			'Win'
		],
		datasets: [{
			label: 'Total Winning Rate',
			data: [300, 50],
			backgroundColor: [
				'rgb(255, 99, 132)',
				'rgb(54, 162, 235)'
			],
			hoverOffset: 4
		}]
	};
	
	const pve_data = {
		labels: [
			'Lose',
			'Win'
		],
		datasets: [{
			label: 'PvE Winning Rate',
			data: [50, 100],
			backgroundColor: [
				'rgb(255, 99, 132)',
				'rgb(54, 162, 235)'
			],
			hoverOffset: 4
		}]
	};
	
	const pvp_data = {
		labels: [
			'Lose',
			'Win'
		],
		datasets: [{
			label: 'PvP Winning Rate',
			data: [300, 100],
			backgroundColor: [
				'rgb(255, 99, 132)',
				'rgb(54, 162, 235)'
			],
			hoverOffset: 4
		}]
	};
	
	// @ts-ignore
	const totalWinRate = new Chart(ctx, {
		type: 'doughnut',
		data: total_data,
		options: {
			responsive: false,
			aspectRatio: 1,
			maintainAspectRatio: false,
			plugins: {
				legend: {
					position: 'top',
				},
				title: {
					display: true,
					text: 'Total Win Rate'
				}
			}
		}
	});
	
	// @ts-ignore
	const pveWinRate = new Chart(ctx1, {
		type: 'doughnut',
		data: pve_data,
		options: {
			responsive: false,
			aspectRatio: 1,
			maintainAspectRatio: false,
			plugins: {
				legend: {
					position: 'top',
				},
				title: {
					display: true,
					text: 'PvE Win Rate'
				}
			}
		}
	});
	
	// @ts-ignore
	const pvpWinRate = new Chart(ctx2, {
		type: 'doughnut',
		data: pvp_data,
		options: {
			responsive: false,
			aspectRatio: 1,
			maintainAspectRatio: false,
			plugins: {
				legend: {
					position: 'top',
				},
				title: {
					display: true,
					text: 'PvP Win Rate'
				}
			}
		}
	});
}