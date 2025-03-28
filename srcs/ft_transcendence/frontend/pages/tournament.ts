import { startGame, escapeHTML, setupGame } from "./game.js"
import { loadLanguage } from "../locales/lang";

const matchWinners = new Map<string, string>(); 

// 토너먼트 설정 페이지
export async function setupTournament(name: string)
{
	matchWinners.clear();
	const contentDiv = document.getElementById("content");
	if (!contentDiv) throw new Error("Error: Cannot find content element!");
	
	contentDiv.innerHTML = `
		<div class="relative flex flex-col items-center justify-center h-full">
			<!-- 헤더 -->
			<h2 data-i18n="tournamentsetup" class="text-5xl font-semibold absolute top-3 left-1/2 transform -translate-x-1/2">
			</h2>
			
			<!-- 입력 및 버튼 -->
			<div class="flex flex-col space-y-4 bg-purple-100 rounded-xl shadow-lg items-center justify-center p-6 w-auto min-h-[250px]">
				<label data-i18n="numberofplayers" class="text-2xl"></label>
				<input type="number" id="player-count" class="p-2 border rounded text-center w-24" min="1" max="8" value="1">
				<button data-i18n="starttournament" id="enter-tournament" class="btn bg-purple-500 text-white text-xl py-3 px-6 rounded-lg shadow-lg hover:bg-purple-600 transition duration-300">
				</button>
			</div>
		</div>

		<div id="nickname-modal-wrapper" class="absolute inset-0 z-60 hidden flex items-center justify-center" style="background-color: rgba(0, 0, 0, 0.45)">
			<div id="nickname-modal" class="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center justify-center w-80">
				<h3 data-i18n="enterNickname" class="text-2xl font-semibold mb-4"></h3>
				<div id="nickname-inputs" class="w-full mb-4"></div>
				<div class="flex space-x-4">
					<button id="start-tournament" class="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600">Start</button>
					<button id="close-modal" class="bg-gray-400 text-white px-4 py-2 rounded-lg hover:bg-gray-500">Cancel</button>
				</div>
			</div>
		</div>
	`;

	const currentLang = localStorage.getItem("language") || "en";
        await loadLanguage(currentLang);

	// 토너먼트 참가 인원 이름 입력
	document.getElementById("enter-tournament")!.addEventListener("click", () => {
		const playerCountInput = document.getElementById("player-count") as HTMLInputElement;
		const playerCount = parseInt(playerCountInput.value, 10);

		if (isNaN(playerCount)) {
			alert("Enter a valid number for player count.");
			playerCountInput.value = "1";
			return;
		}
		if (playerCount <= 0 || playerCount > 8)
		{
			alert("Player count must be between 1 and 8.");
			return;
		}
		if (playerCount == 1) {
			startTournament(1, [name]);
			return;
		}

		const nicknameInputsDiv = document.getElementById("nickname-inputs")!;
		nicknameInputsDiv.innerHTML = ""; 
		for (let i = 2; i <= playerCount; i++) {
			const input = document.createElement("input");
			input.type = "text";
			input.placeholder = `Player ${i}`;
			input.className = "border px-4 py-2 mb-2 w-full";
			input.maxLength = 10;
			input.id = `player-${i}-name`;
			nicknameInputsDiv.appendChild(input);
		}
		document.getElementById("nickname-modal-wrapper")!.classList.remove("hidden");
	});

	document.getElementById("start-tournament")!.addEventListener("click", async () => {
		const playerCount = parseInt((document.getElementById("player-count") as HTMLInputElement).value, 10);
		const nicknames = new Set<string>();

		nicknames.add(name);
		for (let i = 2; i <= playerCount; i++) {
			const playerName = document.getElementById(`player-${i}-name`) as HTMLInputElement;
			const finalName = playerName.value.trim() || `Player ${i}`;
			const res = await fetch(`/profile/${encodeURIComponent(finalName)}`);
			const data = await res.json();
	
			if (nicknames.has(finalName)) {
				alert(`Duplicate nickname found: "${finalName}". Please use a unique nickname.`);
				return;
			}
			if (finalName.startsWith("AI") || finalName === "???")
			{
				alert(`Forbidden Nickname: ${finalName}. Please use Another Nickname`);
				return;
			}
			if (data.exists) {
				alert(`Nickname "${finalName}" is already taken. Please choose another one.`);
				return;
			}
			
			nicknames.add(finalName);
		}
	
		console.log("Tournament Players:", Array.from(nicknames));
		document.getElementById("nickname-modal-wrapper")!.classList.add("hidden");
		startTournament(playerCount, Array.from(nicknames));
	});

	document.getElementById("close-modal")!.addEventListener("click", () => {
		document.getElementById("nickname-modal-wrapper")!.classList.add("hidden");
	});
}

// 대진표 구성
function startTournament(playerCount: number, nicknames: string[])
{
	const totalPlayers = 8;
	let players: string[] = [];

	// 배열에 플레이어 추가 후 셔플
	for (let i = 0; i < playerCount; i++)
		players.push(`${nicknames[i]}`);
	for (let i = playerCount + 1; i <= totalPlayers; i++)
		players.push(`AI ${i - playerCount}`);
	players = players.sort(() => Math.random() - 0.5);

	// 대진표 트리 생성
	let bracket: string[][] = [];
	while (players.length > 1) {
		bracket.push([...players]);
		let nextRound: string[] = [];
		for (let i = 0; i < players.length / 2; i++) {
			nextRound.push("???");
		}
		players = nextRound;
	}
	bracket.push(["🏆"]);
	renderBracket(bracket);
}

// 대진표 렌더링
async function renderBracket(bracket: string[][])
{
	const contentDiv = document.getElementById("content");
	if (!contentDiv)
		throw new Error("Error: Cannot find content element!");

	let bracketHTML = `
		<div class="relative flex flex-col items-center h-full">
			<!-- 헤더 -->
			<h2 data-i18n="tournamentbracket" class="text-5xl font-semibold absolute top-3 left-1/2 transform -translate-x-1/2"></h2>
			<!-- 대진표 -->
			<div class="flex flex-col space-y-4 items-center flex-grow justify-center">
	`;

	for (let r = bracket.length - 1; r >= 0; r--)
	{
		bracketHTML += `<div class="flex justify-center gap-10 w-full">`;
		for (let i = 0; i < bracket[r].length / 2; i++)
		{
			if (r === bracket.length - 1) {
				const winner = bracket[r][i];

				bracketHTML += `
					<div class="flex flex-col items-center bg-yellow-300 p-4 rounded-lg shadow-md w-40">
						<span id="winner" class="text-xl font-bold">${escapeHTML(winner)}</span>
						<button data-i18n="winnerConfirm" id="winner-action-btn" 
							class="hidden bg-blue-300 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded mt-3 transition duration-200 whitespace-nowrap max-w-full">
						</button>
					</div>
				`;
			}
			else {
				const matchKey = `${r}-${i}`;
				const p1 = bracket[r][i * 2] || "???";
				const p2 = bracket[r][i * 2 + 1] || "???";
				const isDisabled = matchWinners.has(matchKey) ? "disabled" : "";

				// 저장된 승자 확인
				let winner = matchWinners.get(matchKey);
				let p1Class = "";
				let p2Class = "";
				let buttonClass = "text-xl";
				let buttonShape = "▶"

				if (winner)
				{
					buttonClass = "text-green-500 font-bold text-xl";
					buttonShape = "✔";
					if (p1 === winner) {
						p1Class = "text-green-500 font-bold";
						p2Class = "text-red-500 font-light";
					} else {
						p1Class = "text-red-500 font-light";
						p2Class = "text-green-500 font-bold";
					}
				}

				bracketHTML += `
					<div class="flex flex-col items-center bg-gray-200 p-4 rounded-lg shadow-md w-40">
						<span class="text-lg font-semibold ${p1Class}">${escapeHTML(p1)}</span>
						<button 
							class="match-btn text-gray-500 hover:text-gray-700 font-bold py-1 px-3 rounded mt-2 my-2 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
							data-round="${r}" data-match="${i}" data-player1="${escapeHTML(p1)}" data-player2="${escapeHTML(p2)}" ${isDisabled}>
							<span class="${buttonClass}">${buttonShape}</span>
						</button>
						<span class="text-lg font-semibold ${p2Class}">${escapeHTML(p2)}</span>
					</div>
				`;
			}
		}
		bracketHTML += `</div>`;
	}
	bracketHTML += `</div></div>`;
	contentDiv.innerHTML = bracketHTML;

	const currentLang = localStorage.getItem("language") || "en";
		await loadLanguage(currentLang);

	// 우승자가 확정되었을 때 버튼 활성화
	const winnerSpan = document.getElementById("winner");
	const winnerActionBtn = document.getElementById("winner-action-btn") as HTMLButtonElement;

	if (winnerSpan && winnerSpan.textContent !== "🏆") {
		winnerActionBtn.classList.remove("hidden");
		winnerActionBtn.addEventListener("click", () => {
			alert(`🎉 ${winnerSpan.textContent} 가 우승했습니다!`);
			setupGame();
			return ;
		});
	}

	// 경기 버튼 이벤트 추가
	document.querySelectorAll(".match-btn").forEach((btn) => {
		btn.addEventListener("click", async (event) => {
			const target = event.currentTarget as HTMLButtonElement; // 여기서 currentTarget 사용
			const round = parseInt(target.getAttribute("data-round")!, 10);
			const index = parseInt(target.getAttribute("data-match")!, 10);
			const player1 = target.getAttribute("data-player1")!;
			const player2 = target.getAttribute("data-player2")!;
	
			if (player1 === "???" || player2 === "???")
				return;
	
			target.disabled = true;
			await setupTourGame(player1, player2, bracket, round, index);
		});
	});
}

async function setupTourGame(player1: string, player2: string, bracket: string[][], round: number, index: number)
{
	let winner = "???";

	// AI vs AI 경기일 경우 랜덤으로 승자 결정
	if (player1.startsWith("AI") && player2.startsWith("AI"))
		winner = Math.random() > 0.5 ? player1 : player2;
	else
		winner = await startGame(player1, player2);

	if (winner === "???")
		return ;

	// 승자 데이터 저장
	const matchKey = `${round}-${index}`;
	matchWinners.set(matchKey, winner);

	// 승자를 다음 라운드에 추가
	let nextIndex = Math.floor(index / 2) * 2;
	if (index % 2 === 0)
		bracket[round + 1][nextIndex] = winner;
	else
		bracket[round + 1][nextIndex + 1] = winner;

	renderBracket(bracket);
}
