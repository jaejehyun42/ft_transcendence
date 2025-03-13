// AI 설정 페이지
export function setupTournament()
{
	const contentDiv = document.getElementById("content");
	if (!contentDiv) throw new Error("Error: Cannot find content element!");
	
	contentDiv.innerHTML = `
		<div class="relative flex flex-col items-center h-full">
			<!-- 헤더 -->
			<h2 class="text-5xl font-semibold absolute top-5 left-1/2 transform -translate-x-1/2">
				🏆 AI Setup
			</h2>
			
			<!-- 입력 및 버튼 -->
			<div class="flex flex-col space-y-4 items-center flex-grow justify-center">
				<button id="start-ai" class="btn bg-blue-500 text-white text-xl py-3 px-6 rounded-lg shadow-lg hover:bg-purple-600 transition duration-300">
					EASY
				</button>
				<button id="start-ai" class="btn bg-green-500 text-white text-xl py-3 px-6 rounded-lg shadow-lg hover:bg-purple-600 transition duration-300">
					MEDIUM
				</button>
				<button id="start-ai" class="btn bg-red-500 text-white text-xl py-3 px-6 rounded-lg shadow-lg hover:bg-purple-600 transition duration-300">
					HARD
				</button>
			</div>
		</div>
	`;

	document.getElementById("start-tournament")!.addEventListener("click", () => {
	});
}