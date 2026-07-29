import { Box, Paper, Stack, Typography } from "@mui/material";
import { AccountBalanceWalletRounded, FolderCopyOutlined, PaymentsRounded, SchoolRounded, SearchOffRounded, VisibilityRounded } from "@mui/icons-material";
import { useEffect, useMemo, useState } from "react";
import Container from "@/components/Container/Container";
import Table from "@/components/Table/Table";
import PaginationControls from "@/components/Pagination";
import ClassFilter from "@/components/Filters/ClassFilter";
import SearchFilter from "@/components/Filters/SearchFilter";
import SelectFilter from "@/components/Filters/SelectFilter";
import { EmptyState, FilterCard, FinancialHeader, SectionCard, StatCard, StatsGrid } from "@/components/financial/FinancialShell";
import Years from "@/utils/constants/Years";
import { translateGender } from "@/utils/helpers/translateGender";
import { formatMoney, mapFeeStatus } from "@/utils/financial/financialUtils";
import { useFinancialRecords } from "@/utils/hooks/apis/financials/useFinancialRecords";
import useDebounce from "@/utils/hooks/useDebounce";
import usePermissions from "@/utils/hooks/usePermissions";

const headers=["اسم الطالب","السنة الدراسية","الفصل","الرسوم الدراسية","حالة الباص","عدد الرحلات","المدفوع الكلي","المتبقي الكلي"];
const body=["studentName","academicYear","className","tuitionStatus","busStatus","tripsCount","totalPaid","remaining"];
const arr=v=>Array.isArray(v)?v:[];
const mapRecord=item=>{
 const student=item?.studentId||item?.student||{}, cls=item?.classId||item?.class||{}, tuition=item?.tuition||{}, bus=item?.bus||{}, trips=arr(item?.trips);
 const tuitionFee=Number(tuition?.discount?tuition?.netFee:tuition?.fee||0), tuitionPaid=Number(tuition?.totalPaid||0);
 const busFee=bus?.enrolled?Number(bus?.discount?bus?.netFee:bus?.fee||0):0, busPaid=bus?.enrolled?Number(bus?.totalPaid||0):0;
 const tripsFee=trips.reduce((s,t)=>s+Number(t?.discount?t?.netFee:t?.fee||0),0), tripsPaid=trips.reduce((s,t)=>s+Number(t?.totalPaid||0),0);
 const paid=tuitionPaid+busPaid+tripsPaid, remaining=Math.max(tuitionFee+busFee+tripsFee-paid,0);
 return { id:student?._id||student?.id, studentName:student?.name||"—", academicYear:item?.academicYear||cls?.academicYear||"—", className:cls?.roomNumber?`${cls.roomNumber} - ${translateGender(cls?.gender,"class")}`:"—", tuitionStatus:mapFeeStatus(tuition?.status), busStatus:bus?.enrolled?mapFeeStatus(bus?.status):"غير مشترك", tripsCount:`${trips.length} رحلة`, totalPaid:formatMoney(paid), remaining:formatMoney(remaining), paidRaw:paid, remainingRaw:remaining };
};

const AllFinancialRecordsListPage=()=>{
 const [page,setPage]=useState(1),[limit,setLimit]=useState(10),[studentName,setStudentName]=useState(""),[academicYear,setAcademicYear]=useState(""),[classId,setClassId]=useState("");
 const search=useDebounce(studentName,500), permissions=usePermissions("financial");
 const filters=useMemo(()=>({studentName:search.trim()||undefined,academicYear:academicYear||undefined,classId:classId||undefined,page,limit}),[search,academicYear,classId,page,limit]);
 const {financialRecords,loading,pagination}=useFinancialRecords(filters);
 useEffect(()=>setClassId(""),[academicYear]); useEffect(()=>setPage(1),[limit,search,academicYear,classId]);
 const rows=useMemo(()=>arr(financialRecords).map(mapRecord),[financialRecords]);
 const paid=rows.reduce((s,i)=>s+i.paidRaw,0), remaining=rows.reduce((s,i)=>s+i.remainingRaw,0), active=[studentName,academicYear,classId].some(Boolean);
 const reset=()=>{setStudentName("");setAcademicYear("");setClassId("");setPage(1)};
 return <Container><Box dir="rtl" sx={{pb:4,minWidth:0}}>
  <FinancialHeader title="السجلات المالية" description="راجع المصروفات الدراسية والباص والرحلات لكل طالب من مكان واحد." count={pagination?.totalDocs??rows.length}/>
  <StatsGrid><StatCard label="إجمالي السجلات" value={pagination?.totalDocs??rows.length} icon={<AccountBalanceWalletRounded/>}/><StatCard label="الظاهر في الصفحة" value={rows.length} icon={<VisibilityRounded/>}/><StatCard label="المدفوع في الصفحة" value={formatMoney(paid)} icon={<PaymentsRounded/>}/><StatCard label="المتبقي في الصفحة" value={formatMoney(remaining)} icon={<AccountBalanceWalletRounded/>}/></StatsGrid>
  <FilterCard description="ابحث باسم الطالب أو حدّد السنة والفصل." active={active} onReset={reset}><SearchFilter value={studentName} onChange={setStudentName} placeholder="ابحث باسم الطالب..."/><SelectFilter value={academicYear} onChange={setAcademicYear} label="السنة الدراسية" icon={SchoolRounded} allLabel="كل السنوات" options={Years.map(y=>({value:y,label:y}))}/><ClassFilter classId={classId} setClassId={setClassId} academicYear={academicYear}/></FilterCard>
  <SectionCard title="قائمة السجلات" description="افتح ملف الطالب لعرض التفاصيل المالية الكاملة.">
   {!loading&&rows.length===0?<EmptyState icon={<SearchOffRounded/>} title={active?"لا توجد سجلات مطابقة للفلاتر":"لا توجد سجلات مالية لعرضها"} description={active?"غيّر الفلاتر أو امسحها لعرض نتائج أخرى.":"ستظهر السجلات بعد إنشاء البيانات المالية للطلاب."} actionLabel={active?"مسح الفلاتر":undefined} onAction={active?reset:undefined}/>:<Box sx={{p:1}}><Table headers={headers} data={rows} loading={loading} profile={permissions?.read} body={body}/>{pagination&&rows.length>0&&<PaginationControls pagination={pagination} page={page} onPageChange={setPage} limit={limit} onLimitChange={setLimit} label="عدد السجلات"/>}<Stack direction="row" spacing={1} mt={1.5} color="text.secondary"><FolderCopyOutlined fontSize="small"/><Typography sx={{fontSize:10}}>اضغط على أي طالب لعرض ملفه المالي الكامل.</Typography></Stack></Box>}
  </SectionCard>
 </Box></Container>;
};
export default AllFinancialRecordsListPage;
