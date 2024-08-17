import { PrimeReactProvider } from "primereact/api";
import Home from "./Pages/Home";
import "primereact/resources/themes/saga-blue/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";

export default function MyApp() {
  return (
    <PrimeReactProvider>
      <Home />
    </PrimeReactProvider>
  );
}
