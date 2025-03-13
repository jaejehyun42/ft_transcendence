import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/postcss";

export default defineConfig({
	server: {
		host: "0.0.0.0", // 도커 내부에서도 접근 가능하게 설정
		port: 3000,
	},
	css: {
		postcss: {
			plugins: [tailwindcss()],
		},
	},
});
