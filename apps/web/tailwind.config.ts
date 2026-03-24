import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                indigo: {
                    50: '#f5f7ff',
                    100: '#ebf0fe',
                    200: '#ced9fd',
                    300: '#b1c2fb',
                    400: '#7694f8',
                    500: '#3b66f5',
                    600: '#355cdc',
                    700: '#2c4db8',
                    800: '#233d93',
                    900: '#1d3278',
                },
            },
        },
    },
    plugins: [],
};
export default config;
