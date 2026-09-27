import { useState, useEffect, useRef } from "react";
import { useParams, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import {
  Assignment,
  CalendarToday,
  CloudUpload,
  Download,
  HourglassEmpty,
  Star,
  InsertDriveFile,
  Close,
  Subject,
  PictureAsPdf,
} from "@mui/icons-material";
import Container from "@/components/Container/Container";
import Back from "@/components/Back/Back";
import Loading from "@/components/Loading";
import { fetchProjectSubmission, submitProject } from "@/APIs/student";

const SubmissionPage = () => {
  const { projectId } = useParams();
  const { state } = useLocation();
  const project = state?.project;
  const subjectName = state?.subjectName;

  const [submission, setSubmission] = useState(null);
  const [loadingSubmission, setLoadingSubmission] = useState(true);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchSub = async () => {
      setLoadingSubmission(true);
      const res = await fetchProjectSubmission(projectId);
      if (res?.status) {
        setSubmission(res.data);
      } else {
        setSubmission(null);
      }
      setLoadingSubmission(false);
    };
    fetchSub();
  }, [projectId]);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles((prev) => [...prev, ...files]);
    // Reset input so same file can be re-selected if removed
    e.target.value = "";
  };

  const removeFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleFileDownload = async (url, filename) => {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error();
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = filename || "file";
      a.click();
      URL.revokeObjectURL(objectUrl);
    } catch {
      // Fallback: open in new tab
      window.open(url, "_blank", "noreferrer");
    }
  };

  const handleSubmit = async () => {
    if (selectedFiles.length === 0) {
      toast.error("يرجى اختيار ملف واحد على الأقل");
      return;
    }
    setSubmitting(true);
    const res = await submitProject(projectId, selectedFiles);
    if (res?.status) {
      toast.success("تم تسليم المشروع بنجاح");
      setSubmission(res.data);
      setSelectedFiles([]);
    } else {
      toast.error(res || "حدث خطأ أثناء تسليم المشروع");
    }
    setSubmitting(false);
  };


  const isGraded =
    submission?.achievedGrade !== null && submission?.achievedGrade !== undefined;
  const isSubmitted = Array.isArray(submission?.files) && submission.files.length > 0;
  const hasProjectFiles = Array.isArray(project?.files) && project.files.length > 0;

  const pageTitle = project?.title || "تسليم المشروع";

  return (
    <Container noSidebar={true}>
      <Back title={pageTitle} />

      {loadingSubmission ? (
        <Loading />
      ) : (
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
          {/* ── Left column ──────────────────────────────── */}
          <div className="space-y-5">
          {/* ── Project Info ─────────────────────────────── */}
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-6">
            <div className="flex items-start gap-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: "#EEF5FF" }}
              >
                <Assignment className="text-2xl" style={{ color: "#318dce" }} />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-bold text-[#1E293B] leading-snug">
                  {pageTitle}
                </h2>

                {subjectName && (
                  <span
                    className="inline-flex items-center gap-1 mt-1 text-xs font-semibold"
                    style={{ color: "#318dce" }}
                  >
                    <Subject className="text-sm" />
                    {subjectName}
                  </span>
                )}

                {project?.description && (
                  <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                    {project.description}
                  </p>
                )}

                {project?.dueDate && (
                  <div className="flex items-center gap-1.5 mt-3 text-xs text-gray-500">
                    <CalendarToday className="text-sm" style={{ color: "#318dce" }} />
                    <span>
                      <span className="font-semibold text-gray-600">موعد التسليم: </span>
                      {new Date(project.dueDate).toLocaleDateString("ar-EG", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Download Project Files ────────────────────── */}
          {hasProjectFiles && (
            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-6">
              <h3 className="text-sm font-bold text-[#1E293B] mb-3">
                ملفات المشروع ({project.files.length})
              </h3>
              <div className="space-y-3">
                {project.files.map((file, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleFileDownload(file.url, file.filename)}
                    className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 hover:border-[#318dce] hover:bg-[#EEF5FF] transition-all duration-200 group text-right w-full"
                  >
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: "#EEF5FF" }}
                    >
                      <PictureAsPdf className="text-base" style={{ color: "#318dce" }} />
                    </div>
                    <span className="text-xs font-semibold text-gray-700 truncate flex-1 group-hover:text-[#318dce]">
                      {file.filename || `ملف ${i + 1}`}
                    </span>
                    <Download className="text-sm text-gray-300 group-hover:text-[#318dce] flex-shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}
          </div>

          {/* ── Right column ─────────────────────────────── */}
          <div>
          {/* ── Graded ───────────────────────────────────── */}
          {isGraded ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 shadow-sm p-6">
              <div className="flex items-center gap-3 mb-5">
                <Star className="text-2xl text-emerald-600" />
                <h3 className="text-base font-bold text-emerald-700">تم تقييم مشروعك</h3>
              </div>

              <div className="flex items-end gap-3">
                <div className="text-center">
                  <p className="text-5xl font-black text-emerald-700 leading-none">
                    {submission.achievedGrade}
                  </p>
                  <p className="text-xs text-emerald-600 mt-1.5">درجتك</p>
                </div>

                {submission.maxGrade !== null && submission.maxGrade !== undefined && (
                  <>
                    <span className="text-3xl text-gray-300 mb-1">/</span>
                    <div className="text-center">
                      <p className="text-5xl font-black text-gray-500 leading-none">
                        {submission.maxGrade}
                      </p>
                      <p className="text-xs text-gray-400 mt-1.5">الدرجة الكاملة</p>
                    </div>
                  </>
                )}
              </div>

              {submission.gradedAt && (
                <p className="text-xs text-emerald-500 mt-4">
                  تاريخ التقييم:{" "}
                  {new Date(submission.gradedAt).toLocaleDateString("ar-EG", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              )}
            </div>

          ) : isSubmitted ? (
            /* ── Submitted, awaiting grade ──────────────── */
            <div className="rounded-2xl border border-amber-200 bg-amber-50 shadow-sm p-6">
              <div className="flex items-center gap-3">
                <HourglassEmpty className="text-2xl text-amber-600" />
                <div>
                  <h3 className="text-base font-bold text-amber-700">تم تسليم المشروع</h3>
                  <p className="text-sm text-amber-600 mt-0.5">بانتظار التصحيح من المعلم</p>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                {submission.files.map((file, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 text-sm text-gray-600 bg-white rounded-lg px-3 py-2 border border-amber-100"
                  >
                    <InsertDriveFile className="text-sm text-amber-500" />
                    <span className="truncate">
                      {file?.originalName || file?.filename || `ملف ${i + 1}`}
                    </span>
                  </div>
                ))}
              </div>
            </div>

          ) : (
            /* ── Not submitted yet ───────────────────────── */
            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-6">
              <h3 className="text-sm font-bold text-[#1E293B] mb-4">تسليم المشروع</h3>

              {/* Drop zone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center cursor-pointer hover:border-[#318dce] hover:bg-[#EEF5FF] transition-all duration-200"
              >
                <CloudUpload className="text-4xl text-gray-300 mb-2" />
                <p className="text-sm font-semibold text-gray-500">اضغط لاختيار الملفات</p>
                <p className="text-xs text-gray-400 mt-1">يمكنك رفع أكثر من ملف</p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleFileChange}
              />

              {/* Selected files list */}
              {selectedFiles.length > 0 && (
                <div className="mt-4 space-y-2">
                  {selectedFiles.map((file, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 border border-gray-100"
                    >
                      <div className="flex items-center gap-2 text-sm text-gray-700 min-w-0">
                        <InsertDriveFile className="text-sm flex-shrink-0" style={{ color: "#318dce" }} />
                        <span className="truncate">{file.name}</span>
                        <span className="text-xs text-gray-400 flex-shrink-0">
                          ({(file.size / 1024).toFixed(1)} KB)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(i)}
                        className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0 mr-2"
                      >
                        <Close className="text-sm" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Submit button */}
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting || selectedFiles.length === 0}
                className="mt-5 w-full rounded-xl py-3 text-sm font-bold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90"
                style={{ backgroundColor: "#318dce" }}
              >
                {submitting ? "جارٍ الإرسال..." : "تسليم المشروع"}
              </button>
            </div>
          )}
          </div>
        </div>
      )}
    </Container>
  );
};

export default SubmissionPage;
