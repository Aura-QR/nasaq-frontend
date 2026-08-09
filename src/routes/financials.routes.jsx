import { Route } from "react-router-dom";
import { RequireAuth } from "react-auth-kit";
import RequirePermission from "@/components/RequirePermission";

import FeeConfigs_List from "@/pages/Financials/FeeConfigs/List";
import FeeConfigs_Add from "@/pages/Financials/FeeConfigs/Add";
import FeeConfigs_Edit from "@/pages/Financials/FeeConfigs/Edit";

import InstallmentPlans_List from "@/pages/Financials/InstallmentPlans/List";
import InstallmentPlans_Add from "@/pages/Financials/InstallmentPlans/Add";
import InstallmentPlans_Edit from "@/pages/Financials/InstallmentPlans/Edit";

import FinancialRecords_List from "@/pages/Financials/StudentsFees/List";
import FinancialRecords_Profile from "@/pages/Financials/StudentsFees/Profile";
import AllFinancialRecords_List from "@/pages/Financials/AllRecords/List";
import StudentFinancialMyRecord from "@/pages/Student/Financials/MyRecord";
import StudentFinancialMySummary from "@/pages/Student/Financials/MySummary";

import Discounts_List from "@/pages/Financials/Discounts/List";
import Discounts_Add from "@/pages/Financials/Discounts/Add";
import Discounts_Edit from "@/pages/Financials/Discounts/Edit";

import Bus_List from "@/pages/Financials/Bus/List";
import Bus_Profile from "@/pages/Financials/Bus/Profile";

import ModuleTrips_List from "@/pages/Financials/Trips/ModuleList";
import ModuleTrips_Add from "@/pages/Financials/Trips/ModuleAdd";
import ModuleTrips_Profile from "@/pages/Financials/Trips/ModuleProfile";
import Trips_List from "@/pages/Financials/Trips/List";
import Trips_Profile from "@/pages/Financials/Trips/Profile";
import AdditionalFees_List from "@/pages/Financials/AdditionalFees/List";
import AdditionalFees_Add from "@/pages/Financials/AdditionalFees/Add";

export const financialsRoutes = (
	<>
		<Route path="/financial/fee-configs" element={
			<RequireAuth loginPath="/">
				<RequirePermission module="financial" operation="read">
					<FeeConfigs_List />
				</RequirePermission>
			</RequireAuth>
		} />

		<Route path="/financial/fee-configs/add" element={
			<RequireAuth loginPath="/">
				<RequirePermission module="financial" operation="add">
					<FeeConfigs_Add />
				</RequirePermission>
			</RequireAuth>
		} />

		<Route path="/financial/fee-configs/edit/:id" element={
			<RequireAuth loginPath="/">
				<RequirePermission module="financial" operation="edit">
					<FeeConfigs_Edit />
				</RequirePermission>
			</RequireAuth>
		} />

		<Route path="/financial/installment-plans" element={
			<RequireAuth loginPath="/">
				<RequirePermission module="financial" operation="read">
					<InstallmentPlans_List />
				</RequirePermission>
			</RequireAuth>
		} />

		<Route path="/financial/installment-plans/add" element={
			<RequireAuth loginPath="/">
				<RequirePermission module="financial" operation="add">
					<InstallmentPlans_Add />
				</RequirePermission>
			</RequireAuth>
		} />

		<Route path="/financial/installment-plans/edit/:id" element={
			<RequireAuth loginPath="/">
				<RequirePermission module="financial" operation="edit">
					<InstallmentPlans_Edit />
				</RequirePermission>
			</RequireAuth>
		} />

		<Route path="/financial/records" element={
			<RequireAuth loginPath="/">
				<RequirePermission module="financial" operation="read">
					<FinancialRecords_List />
				</RequirePermission>
			</RequireAuth>
		} />

		<Route path="/financial/all-records" element={
			<RequireAuth loginPath="/">
				<RequirePermission module="financial" operation="read">
					<AllFinancialRecords_List />
				</RequirePermission>
			</RequireAuth>
		} />

		<Route path="/financial/all-records/:studentId" element={
			<RequireAuth loginPath="/">
				<RequirePermission module="financial" operation="read">
					<FinancialRecords_Profile />
				</RequirePermission>
			</RequireAuth>
		} />

		<Route path="/financial/records/:studentId" element={
			<RequireAuth loginPath="/">
				<RequirePermission module="financial" operation="read">
					<FinancialRecords_Profile />
				</RequirePermission>
			</RequireAuth>
		} />

		<Route path="/financial/records/me" element={
			<RequireAuth loginPath="/">
				<RequirePermission module="financial" operation="read">
					<StudentFinancialMyRecord />
				</RequirePermission>
			</RequireAuth>
		} />

		<Route path="/financial/records/me/summary" element={
			<RequireAuth loginPath="/">
				<RequirePermission module="financial" operation="read">
					<StudentFinancialMySummary />
				</RequirePermission>
			</RequireAuth>
		} />

		<Route path="/financial/discounts" element={
			<RequireAuth loginPath="/">
				<RequirePermission module="financial" operation="read">
					<Discounts_List />
				</RequirePermission>
			</RequireAuth>
		} />

		<Route path="/financial/discounts/add" element={
			<RequireAuth loginPath="/">
				<RequirePermission module="financial" operation="add">
					<Discounts_Add />
				</RequirePermission>
			</RequireAuth>
		} />

		<Route path="/financial/discounts/edit/:id" element={
			<RequireAuth loginPath="/">
				<RequirePermission module="financial" operation="edit">
					<Discounts_Edit />
				</RequirePermission>
			</RequireAuth>
		} />

		<Route path="/financial/bus" element={
			<RequireAuth loginPath="/">
				<RequirePermission module="financial" operation="read">
					<Bus_List />
				</RequirePermission>
			</RequireAuth>
		} />

		<Route path="/financial/bus/:studentId" element={
			<RequireAuth loginPath="/">
				<RequirePermission module="financial" operation="read">
					<Bus_Profile />
				</RequirePermission>
			</RequireAuth>
		} />

		<Route path="/financial/records/:studentId/bus" element={
			<RequireAuth loginPath="/">
				<RequirePermission module="financial" operation="read">
					<Bus_Profile />
				</RequirePermission>
			</RequireAuth>
		} />

		<Route path="/financial/trips" element={
			<RequireAuth loginPath="/">
				<RequirePermission module="financial" operation="read">
					<ModuleTrips_List />
				</RequirePermission>
			</RequireAuth>
		} />

		<Route path="/financial/trips/add" element={
			<RequireAuth loginPath="/">
				<RequirePermission module="financial" operation="add">
					<ModuleTrips_Add />
				</RequirePermission>
			</RequireAuth>
		} />

		<Route path="/financial/trips/:tripTemplateId" element={
			<RequireAuth loginPath="/">
				<RequirePermission module="financial" operation="read">
					<ModuleTrips_Profile />
				</RequirePermission>
			</RequireAuth>
		} />

		<Route path="/financial/records/:studentId/trips" element={
			<RequireAuth loginPath="/">
				<RequirePermission module="financial" operation="read">
					<Trips_List />
				</RequirePermission>
			</RequireAuth>
		} />

		<Route path="/financial/records/:studentId/trips/add" element={
			<RequireAuth loginPath="/">
				<RequirePermission module="financial" operation="add">
					<Trips_Add />
				</RequirePermission>
			</RequireAuth>
		} />

		<Route path="/financial/records/:studentId/trips/:tripId" element={
			<RequireAuth loginPath="/">
				<RequirePermission module="financial" operation="read">
					<Trips_Profile />
				</RequirePermission>
			</RequireAuth>
		} />
		<Route path="/financial/additional-fees" element={
			<RequireAuth loginPath="/">
				<RequirePermission module="financial" operation="read">
					<AdditionalFees_List />
				</RequirePermission>
			</RequireAuth>
		} />

		<Route path="/financial/additional-fees/add" element={
			<RequireAuth loginPath="/">
				<RequirePermission module="financial" operation="add">
					<AdditionalFees_Add />
				</RequirePermission>
			</RequireAuth>
		} />
	</>
);

