import { DarkModeProvider } from "../contexts/DarkModeContext";
import { GlobalProvider } from "../contexts/GlobalContext";
// import "../styles/globals.css";

function MyApp({ Component, pageProps }) {
    return (
        <DarkModeProvider>
            <GlobalProvider initialLeavesData={pageProps.leavesData}>
                <Component {...pageProps} />
            </GlobalProvider>
        </DarkModeProvider>
    );
}
export default MyApp;