import React, { useState, useEffect, useCallback } from "react";
import TuitionPayments from "./TuitionPayments";
import { DormPayments } from "./DormPayments";
import { OtherPayments } from "./OtherPayments";
import { api } from "../../../Library/RequestMaker";
import { endpoints } from "../../../Library/Endpoints";

export const Payments = () => {
  const [tab, setTab] = useState("tuition");
  const [students, setStudents] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);

  const [hasMore, setHasMore] = useState(true);
  const [totalLoaded, setTotalLoaded] = useState(0);

  useEffect(() => {
    const fetchStudentsWithPayments = async () => {
      try {
        const res = await api.get(endpoints.GET_STUDENT_WITH_PAYMENTS);

        setStudents(res.data.students);
        setMeta(res.data.meta || null);
        console.log(
          "Fetched students with payments:",
          res.data.students[0].payments
        );
        setError("");
      } catch (fetchError) {
        console.error("Error fetching students with payments:", fetchError);
        setError("Failed to load students with payments.");
      } finally {
        setLoading(false);
      }
    };

    fetchStudentsWithPayments();
  }, []);

  return (
    <div className="min-h-screen">
      <div className="p-2 h-full">
        <div className="flex items-center justify-center gap-10 mb-">
          <button
            className={`px-4 py-2 rounded-md font-medium ${
              tab === "tuition"
                ? "bg-indigo-600 text-white"
                : "bg-white border border-indigo-600 text-indigo-600"
            }`}
            onClick={() => setTab("tuition")}
          >
            Tuition
          </button>
          <button
            className={`px-4 py-2 rounded-md font-medium ${
              tab === "dorm"
                ? "bg-indigo-600 text-white"
                : "bg-white border border-indigo-600 text-indigo-600"
            }`}
            onClick={() => setTab("dorm")}
          >
            Dorm
          </button>
          <button
            className={`px-4 py-2 rounded-md font-medium ${
              tab === "other"
                ? "bg-indigo-600 text-white"
                : "bg-white border border-indigo-600 text-indigo-600"
            }`}
            onClick={() => setTab("other")}
          >
            Other
          </button>
        </div>

        <div>
          {tab === "tuition" && (
            <TuitionPayments
              students={students}
              setStudents={setStudents}
              loading={loading}
              loadingMore={loadingMore}
              error={error}
              meta={meta}
              totalLoaded={totalLoaded}
              hasMore={hasMore}
            />
          )}
          {tab === "dorm" && (
            <DormPayments
              students={students}
              setStudents={setStudents}
              loading={loading}
              loadingMore={loadingMore}
              error={error}
              meta={meta}
              totalLoaded={totalLoaded}
              hasMore={hasMore}
            />
          )}
          {tab === "other" && (
            <OtherPayments
              students={students}
              setStudents={setStudents}
              loading={loading}
              loadingMore={loadingMore}
              error={error}
              meta={meta}
              totalLoaded={totalLoaded}
              hasMore={hasMore}
            />
          )}
        </div>
      </div>
    </div>
  );
};
