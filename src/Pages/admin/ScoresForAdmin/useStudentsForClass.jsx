import { useEffect, useState, useCallback } from "react";
import { api } from "../../../Library/RequestMaker.jsx";
import { endpoints } from "../../../Library/Endpoints.jsx";

/**
 * Hook: useStudentsForClass
 * Accepts a `classInfo` object and fetches students for that class.
 * Returns: { students, loading, error, refresh }
 */
function useStudentsForClass(classInfo) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchStudents = useCallback(async () => {
    if (!classInfo) return;
    const classPair =
      classInfo.grade && classInfo.class
        ? `${classInfo.grade}-${classInfo.class}`
        : null;
    if (!classPair) return;

    setLoading(true);
    setError(null);
    try {
      const filter = encodeURIComponent(
        JSON.stringify({ class_pairs: [classPair] })
      );
      const url = `${endpoints.GET_STUDENTS_OF_A_CLASS}&filter=${filter}&include_group=1`;
      const response = await api.get(url);
      const studentsData = response.data?.students || response.data?.data || [];
      setStudents(studentsData);
    } catch (err) {
      setError(err);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  }, [classInfo]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  return { students, loading, error, refresh: fetchStudents };
}

export default useStudentsForClass;
