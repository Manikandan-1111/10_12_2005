// ExploreFreelancer.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { db } from "../../firbase/Firebase"; // ✅ assume initialized

import search from "../../assets/search .png";
import eye from "../../assets/eye.png";
import clock from "../../assets/clock.png";
import saved from "../../assets/save.png";
import save from "../../assets/save2.png";
import backarrow from "../../assets/backarrow.png";


/* =========================
   ENUMS
========================= */
const JobSortOption = {
  BEST_MATCH: "bestMatch",
  NEWEST: "newest",
  AVAILABILITY: "availability",
};

/* =========================
   DEFAULT FILTERS
========================= */
const defaultFilters = {
  searchQuery: "",
  categories: [],
  skills: [],
  postingTime: "",
  budgetRange: [0, 100000],
  sortOption: JobSortOption.BEST_MATCH,
};

/* =========================
   HELPERS
========================= */
const formatCurrency = (amount = 0) => {
  if (amount >= 100000) return `${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `${(amount / 1000).toFixed(1)}K`;
  return amount;
};





const timeAgo = (date) => {
  if (!date) return "";
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

const matchScore = (job, userSkills) => {
  let score = 0;
  job.skills?.forEach((s) => userSkills.includes(s) && (score += 3));
  userSkills.includes(job.category) && (score += 2);
  if ((Date.now() - job.createdAt.getTime()) / 86400000 <= 3) score += 1;
  return score;
};

/* =========================
   MAIN COMPONENT
========================= */
export default function JobSearchScreen() {
  const auth = getAuth();
  const uid = auth.currentUser?.uid;

  const [collapsed, setCollapsed] = useState(
    localStorage.getItem("sidebar-collapsed") === "true"
  );


  const [selectedTab, setSelectedTab] = useState(0); 
  const [filters, setFilters] = useState(defaultFilters);

  const [jobs, setJobs] = useState([]);
  const [savedJobs, setSavedJobs] = useState([]);
  const [userSkills, setUserSkills] = useState([]);

  /* =========================
     JOB STREAMS
  ========================= */
  useEffect(() => {
    const qJobs = query(collection(db, "jobs"), orderBy("created_at", "desc"));
    const qFast = query(
      collection(db, "jobs_24h"),
      orderBy("created_at", "desc")
    );

    const unsubJobs = onSnapshot(qJobs, (snap) => {
      const data = snap.docs.map((d) => ({
        id: d.id,
        source: "jobs",
        is24h: false,
        views: d.data().views || 0,
        ...d.data(),
        createdAt: d.data().created_at?.toDate?.() || new Date(),
      }));

      setJobs((prev) => [
        ...prev.filter((j) => j.source !== "jobs"),
        ...data,
      ]);
    });

    const unsubFast = onSnapshot(qFast, (snap) => {
      const data = snap.docs.map((d) => ({
        id: d.id,
        source: "jobs_24h",
        is24h: true,
        views: d.data().views || 0,
        ...d.data(),
        createdAt: d.data().created_at?.toDate?.() || new Date(),
      }));

      setJobs((prev) => [
        ...prev.filter((j) => j.source !== "jobs_24h"),
        ...data,
      ]);
    });

    return () => {
      unsubJobs();
      unsubFast();
    };
  }, []);

  /* =========================
     USER DATA
  ========================= */
  useEffect(() => {
    if (!uid) return;
    return onSnapshot(doc(db, "users", uid), (snap) => {
      const data = snap.data() || {};
      setSavedJobs(data.favoriteJobs || []);
      setUserSkills(data.skills || []);
    });
  }, [uid]);

  useEffect(() => {
    function handleToggle(e) {
      setCollapsed(e.detail);
    }
    window.addEventListener("sidebar-toggle", handleToggle);
    return () => window.removeEventListener("sidebar-toggle", handleToggle);
  }, []);


  /* =========================
     FILTER + SORT
  ========================= */
  const filteredJobs = useMemo(() => {
    let list = jobs.filter((job) => {
      if (selectedTab === 0 && job.source !== "jobs") return false;
      if (selectedTab === 1 && job.source !== "jobs_24h") return false;
      if (selectedTab === 2 && !savedJobs.includes(job.id)) return false;

      if (
        filters.searchQuery &&
        !(
          job.title?.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
          job.description
            ?.toLowerCase()
            .includes(filters.searchQuery.toLowerCase())
        )
      ) {
        return false;
      }

      return true;
    });


    const sorted = [...list];

    if (filters.sortOption === JobSortOption.NEWEST) {
      sorted.sort((a, b) => b.createdAt - a.createdAt);
    }

    if (filters.sortOption === JobSortOption.AVAILABILITY) {
      sorted.sort((a, b) => a.views - b.views);
    }

    if (filters.sortOption === JobSortOption.BEST_MATCH) {
      sorted.sort(
        (a, b) => matchScore(b, userSkills) - matchScore(a, userSkills)
      );
    }

    return sorted;
  }, [jobs, filters, selectedTab, savedJobs, userSkills]);

  /* =========================
     ACTIONS
  ========================= */
  const toggleSave = async (jobId) => {
    if (!uid) return;
    const ref = doc(db, "users", uid);

    await updateDoc(ref, {
      favoriteJobs: savedJobs.includes(jobId)
        ? arrayRemove(jobId)
        : arrayUnion(jobId),
    });
  };

  /* =========================
     UI
  ========================= */
  return (
    <div
      className="freelance-wrapper"
      style={{
        marginLeft: collapsed ? "-110px" : "90px",
        transition: "margin-left 0.25s ease",
      }}
    >
      <div className="job-search">
        <h2>Browse Projects</h2>

        {/* SEARCH */}
        <input
          placeholder="Search jobs..."
          value={filters.searchQuery}
          onChange={(e) =>
            setFilters({ ...filters, searchQuery: e.target.value })
          }
        />
        <p style={{ fontSize: "30px", fontWeight: "300px" }}>filter</p>

        {/* SORT */}
        <div className="sort">
          {Object.values(JobSortOption).map((opt) => (
            <button
              key={opt}
              className={filters.sortOption === opt ? "active" : ""}
              onClick={() => setFilters({ ...filters, sortOption: opt })}
            >
              {opt}
            </button>
          ))}
        </div>

        {/* TABS */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 10,

            padding: 10,
            margin: "12px 36px",
            marginLeft:"10px",
            borderRadius: 20,
            // background: "linear-gradient(90deg, #F1EAFF 0%, #FFF7DB 100%)",
            boxShadow: "0 8px 20px rgba(0,0,0,0.12)",
          }}
        >
          {["Work", "24 Hours", "Saved"].map((t, i) => {
            const isActive = selectedTab === i;

            return (
              <button
                key={i}
                onClick={() => setSelectedTab(i)}
                style={{
                  border: "none",
                  outline: "none",
                  cursor: "pointer",

                  padding: "9px 42px",
                  borderRadius: 999,

                  fontSize: 14,
                  fontWeight: 500,

                  background: isActive ? "#fff" : "transparent",
                  color: "#000",

                  boxShadow: isActive
                    ? "0 6px 20px 0 rgba(0, 0, 0, 0.19)"
                    : "none",

                  transition: "all 0.25s ease",
                }}
              >
                {t}
              </button>
            );
          })}
        </div>


        {/* JOB LIST */}
        <div className="jobs" style={{ overflow: "visible" }}>

          {filteredJobs.length === 0 && (
            <p style={{ opacity: 0.6 }}>No jobs found</p>
          )}

          {filteredJobs.map((job) => (
            <div
              key={job.id}
              style={{
                marginTop: "20px",
                background: "#FFFFFF",
                borderRadius: 20,
                padding: 22,
                marginBottom: 18,

                boxShadow: "0 0px 6px rgba(0,0,0,0.15)",
                position: "relative",

                width: "98%",            // 🔥 FIX
                boxSizing: "border-box",  // 🔥 KEEP
              }}
            >


              {/* TOP ROW */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                {/* LEFT */}
                <div>
                  <div
                    style={{
                      fontSize: 18,
                      fontWeight: 500,
                      color: "#000",
                    }}
                  >
                    {job.company || "Zuntra digital PVT"}
                  </div>

                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: 400,
                      marginTop: 6,
                      color: "#222",
                    }}
                  >
                    {job.title}
                  </div>
                </div>

                {/* RIGHT */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                  }}
                >
                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: 500,
                      color: "#000",
                      whiteSpace: "nowrap",
                    }}
                  >
                    ₹ {formatCurrency(job.budget)} /per day
                  </div>

                  <button
                    onClick={() => toggleSave(job.id)}
                    style={{
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      padding: 0,
                    }}
                  >
                    <img
                      src={savedJobs.includes(job.id) ? saved : save}
                      alt="save"
                      style={{ width: 20 }}
                    />
                  </button>
                </div>
              </div>


              {/* SKILLS */}
              <div style={{ marginTop: 14 }}>
                <div
                  style={{
                    fontSize: 13,
                    color: "#555",
                    marginBottom: 6,
                  }}
                >
                  Skills Required
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    flexWrap: "wrap",
                  }}
                >
                  {job.skills?.slice(0, 3).map((s) => (
                    <span
                      key={s}
                      style={{
                        background: "#FFF3A0",
                        padding: "6px 12px",
                        borderRadius: 999,
                        fontSize: 12,
                        fontWeight: 500,
                        color: "#000",
                      }}
                    >
                      {s}
                    </span>
                  ))}

                  {job.skills?.length > 3 && (
                    <span
                      style={{
                        background: "#FFF3A0",
                        padding: "6px 12px",
                        borderRadius: 999,
                        fontSize: 12,
                        fontWeight: 500,
                        color: "#000",
                      }}
                    >
                      4+
                    </span>
                  )}
                </div>
              </div>

              {/* DESCRIPTION */}
              <p
                style={{
                  marginTop: 14,
                  fontSize: 14,
                  color: "#444",
                  lineHeight: 1.6,
                }}
              >
                {job.description}
              </p>

              {/* FOOTER */}
              <div
                style={{
                  marginTop: 16,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  fontSize: 12,
                  color: "#666",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    gap: 16,
                    alignItems: "center",
                  }}
                >
                  <span><img src={eye} alt="eye" style={{ width: "14px" }} /> {job.views} Impression</span>
                  <span><img src={clock} style={{ width: "14px", marginTop: "10px" }} alt="clock" /> {timeAgo(job.createdAt)}</span>
                </div>


              </div>
            </div>
          ))}
        </div>


      </div>
    </div>
  );
}

