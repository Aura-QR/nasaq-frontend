import { Route } from "react-router-dom";
import { RequireAuth } from "react-auth-kit";
import RequirePermission from "@/components/RequirePermission";

import ExpenseCategories_List from "@/pages/Expenses/Categories/List";
import ExpenseCategories_Add from "@/pages/Expenses/Categories/Add";
import ExpenseCategories_Edit from "@/pages/Expenses/Categories/Edit";

import Expenses_List from "@/pages/Expenses/List";
import Expenses_Add from "@/pages/Expenses/Add";
import Expenses_Edit from "@/pages/Expenses/Edit";

export const expensesRoutes = (
	<>
		<Route path="/expenses/categories" element={
			<RequireAuth loginPath="/">
				<RequirePermission module="financial" operation="read">
					<ExpenseCategories_List />
				</RequirePermission>
			</RequireAuth>
		} />

		<Route path="/expenses/categories/add" element={
			<RequireAuth loginPath="/">
				<RequirePermission module="financial" operation="add">
					<ExpenseCategories_Add />
				</RequirePermission>
			</RequireAuth>
		} />

		<Route path="/expenses/categories/edit/:id" element={
			<RequireAuth loginPath="/">
				<RequirePermission module="financial" operation="edit">
					<ExpenseCategories_Edit />
				</RequirePermission>
			</RequireAuth>
		} />

		<Route path="/expenses" element={
			<RequireAuth loginPath="/">
				<RequirePermission module="financial" operation="read">
					<Expenses_List />
				</RequirePermission>
			</RequireAuth>
		} />

		<Route path="/expenses/add" element={
			<RequireAuth loginPath="/">
				<RequirePermission module="financial" operation="add">
					<Expenses_Add />
				</RequirePermission>
			</RequireAuth>
		} />

		<Route path="/expenses/edit/:id" element={
			<RequireAuth loginPath="/">
				<RequirePermission module="financial" operation="edit">
					<Expenses_Edit />
				</RequirePermission>
			</RequireAuth>
		} />
	</>
);
