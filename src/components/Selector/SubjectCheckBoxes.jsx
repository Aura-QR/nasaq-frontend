import { useSubjectsList } from "@/utils/hooks/apis/useSubjectsList";
import Checkboxes from "../Checkboxes";
import { Typography } from "@mui/material";

const SubjectCheckBoxes = ({
    selectedSubjects, 
    setSelectedSubjects,
    }) =>{

    // calling useSubjectsList hook to fetch subjects list
    const {subjects, loading} = useSubjectsList();

    if (loading) {
    return <Typography color="text.secondary">جاري تحميل المواد...</Typography>;
    }

    return (
    <Checkboxes
      items={subjects}
      selectedData={selectedSubjects}
      setSelectedData={setSelectedSubjects}
    />
  );
}
export default SubjectCheckBoxes;