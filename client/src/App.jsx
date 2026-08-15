// BQE v2 — App router
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Frontpage from "./pages/Frontpage";
import AdminDashboard from "./pages/AdminDashboard";
import TVDisplay from "./pages/TVDisplay";
import CustomerPage from "./pages/CustomerPage";
import JoinPage from "./pages/JoinPage";

export default function App() {
	return (
		<BrowserRouter>
			<Routes>
				<Route path="/" element={<Frontpage />} />
				<Route path="/admin/:code" element={<AdminDashboard />} />
				<Route path="/tv/:code" element={<TVDisplay />} />
				<Route path="/ticket/:id" element={<CustomerPage />} />
				<Route path="/join" element={<JoinPage />} />
			</Routes>
		</BrowserRouter>
	);
}