// // ExploreFreelancer.jsx
// import React, { useEffect, useMemo, useState } from "react";
// import {
//   collection,
//   doc,
//   onSnapshot,
//   orderBy,
//   query,
//   updateDoc,
//   arrayUnion,
//   arrayRemove,
// } from "firebase/firestore";
// import { getAuth } from "firebase/auth";
// import { db } from "../../firbase/Firebase"; // ✅ assume initialized

// import search from "../../assets/search .png";
// import eye from "../../assets/eye.png";
// import clock from "../../assets/clock.png";
// import saved from "../../assets/save.png";
// import save from "../../assets/save2.png";
// import backarrow from "../../assets/backarrow.png";


// /* =========================
//    ENUMS
// ========================= */
// const JobSortOption = {
//   BEST_MATCH: "bestMatch",
//   NEWEST: "newest",
//   AVAILABILITY: "availability",
// };

// /* =========================
//    DEFAULT FILTERS
// ========================= */
// const defaultFilters = {
//   searchQuery: "",
//   categories: [],
//   skills: [],
//   postingTime: "",
//   budgetRange: [0, 100000],
//   sortOption: JobSortOption.BEST_MATCH,
// };

// /* =========================
//    HELPERS
// ========================= */
// const formatCurrency = (amount = 0) => {
//   if (amount >= 100000) return `${(amount / 100000).toFixed(1)}L`;
//   if (amount >= 1000) return `${(amount / 1000).toFixed(1)}K`;
//   return amount;
// };





// const timeAgo = (date) => {
//   if (!date) return "";
//   const diff = Date.now() - date.getTime();
//   const mins = Math.floor(diff / 60000);
//   if (mins < 1) return "Just now";
//   if (mins < 60) return `${mins}m ago`;
//   const hrs = Math.floor(mins / 60);
//   if (hrs < 24) return `${hrs}h ago`;
//   return `${Math.floor(hrs / 24)}d ago`;
// };

// const matchScore = (job, userSkills) => {
//   let score = 0;
//   job.skills?.forEach((s) => userSkills.includes(s) && (score += 3));
//   userSkills.includes(job.category) && (score += 2);
//   if ((Date.now() - job.createdAt.getTime()) / 86400000 <= 3) score += 1;
//   return score;
// };

// /* =========================
//    MAIN COMPONENT
// ========================= */
// export default function JobSearchScreen() {
//   const auth = getAuth();
//   const uid = auth.currentUser?.uid;

//   const [collapsed, setCollapsed] = useState(
//     localStorage.getItem("sidebar-collapsed") === "true"
//   );


//   const [selectedTab, setSelectedTab] = useState(0);
//   const [filters, setFilters] = useState(defaultFilters);

//   const [jobs, setJobs] = useState([]);
//   const [savedJobs, setSavedJobs] = useState([]);
//   const [userSkills, setUserSkills] = useState([]);

//   /* =========================
//      JOB STREAMS
//   ========================= */
//   useEffect(() => {
//     const qJobs = query(collection(db, "jobs"), orderBy("created_at", "desc"));
//     const qFast = query(
//       collection(db, "jobs_24h"),
//       orderBy("created_at", "desc")
//     );

//     const unsubJobs = onSnapshot(qJobs, (snap) => {
//       const data = snap.docs.map((d) => ({
//         id: d.id,
//         source: "jobs",
//         is24h: false,
//         views: d.data().views || 0,
//         ...d.data(),
//         createdAt: d.data().created_at?.toDate?.() || new Date(),
//       }));

//       setJobs((prev) => [
//         ...prev.filter((j) => j.source !== "jobs"),
//         ...data,
//       ]);
//     });

//     const unsubFast = onSnapshot(qFast, (snap) => {
//       const data = snap.docs.map((d) => ({
//         id: d.id,
//         source: "jobs_24h",
//         is24h: true,
//         views: d.data().views || 0,
//         ...d.data(),
//         createdAt: d.data().created_at?.toDate?.() || new Date(),
//       }));

//       setJobs((prev) => [
//         ...prev.filter((j) => j.source !== "jobs_24h"),
//         ...data,
//       ]);
//     });

//     return () => {
//       unsubJobs();
//       unsubFast();
//     };
//   }, []);

//   /* =========================
//      USER DATA
//   ========================= */
//   useEffect(() => {
//     if (!uid) return;
//     return onSnapshot(doc(db, "users", uid), (snap) => {
//       const data = snap.data() || {};
//       setSavedJobs(data.favoriteJobs || []);
//       setUserSkills(data.skills || []);
//     });
//   }, [uid]);

//   useEffect(() => {
//     function handleToggle(e) {
//       setCollapsed(e.detail);
//     }
//     window.addEventListener("sidebar-toggle", handleToggle);
//     return () => window.removeEventListener("sidebar-toggle", handleToggle);
//   }, []);


//   /* =========================
//      FILTER + SORT
//   ========================= */
//   const filteredJobs = useMemo(() => {
//     let list = jobs.filter((job) => {
//       if (selectedTab === 0 && job.source !== "jobs") return false;
//       if (selectedTab === 1 && job.source !== "jobs_24h") return false;
//       if (selectedTab === 2 && !savedJobs.includes(job.id)) return false;

//       if (
//         filters.searchQuery &&
//         !(
//           job.title?.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
//           job.description
//             ?.toLowerCase()
//             .includes(filters.searchQuery.toLowerCase())
//         )
//       ) {
//         return false;
//       }

//       return true;
//     });


//     const sorted = [...list];

//     if (filters.sortOption === JobSortOption.NEWEST) {
//       sorted.sort((a, b) => b.createdAt - a.createdAt);
//     }

//     if (filters.sortOption === JobSortOption.AVAILABILITY) {
//       sorted.sort((a, b) => a.views - b.views);
//     }

//     if (filters.sortOption === JobSortOption.BEST_MATCH) {
//       sorted.sort(
//         (a, b) => matchScore(b, userSkills) - matchScore(a, userSkills)
//       );
//     }

//     return sorted;
//   }, [jobs, filters, selectedTab, savedJobs, userSkills]);

//   /* =========================
//      ACTIONS
//   ========================= */
//   const toggleSave = async (jobId) => {
//     if (!uid) return;
//     const ref = doc(db, "users", uid);

//     await updateDoc(ref, {
//       favoriteJobs: savedJobs.includes(jobId)
//         ? arrayRemove(jobId)
//         : arrayUnion(jobId),
//     });
//   };

//   /* =========================
//      UI
//   ========================= */
//   return (
//     <div
//       className="freelance-wrapper"
//       style={{
//         marginLeft: collapsed ? "-110px" : "90px",
//         transition: "margin-left 0.25s ease",
//         overflowX: "hidden",        // 🔥 ADD THIS
//         maxWidth: "100vw",          // 🔥 ADD THIS
//       }}
//     >
//       <div className="job-search">
//         <h2>Browse Projects</h2>

//         {/* SEARCH */}
//         <input
//           placeholder="Search job"
//           style={{
//             width: "95%",
//             maxWidth: "100%",
//             overflowX: "hidden",        // 🔥 ADD
//           }}
//           value={filters.searchQuery}
//           onChange={(e) =>
//             setFilters({ ...filters, searchQuery: e.target.value })
//           }
//         />

//         <p style={{ fontSize: "30px", fontWeight: "300px" }}>filter</p>

//         {/* SORT */}
//         <div className="sort">
//           {Object.values(JobSortOption).map((opt) => (
//             <button
//               key={opt}
//               className={filters.sortOption === opt ? "active" : ""}
//               onClick={() => setFilters({ ...filters, sortOption: opt })}
//             >
//               {opt}
//             </button>
//           ))}
//         </div>

//         {/* TABS */}
//         <div
//           style={{
//             display: "flex",
//             justifyContent: "center",
//             alignItems: "center",
//             gap: 10,

//             padding: 10,
//             margin: "12px 36px",
//             marginLeft: "10px",
//             borderRadius: 20,
//             // background: "linear-gradient(90deg, #F1EAFF 0%, #FFF7DB 100%)",
//             boxShadow: "0 8px 20px rgba(0,0,0,0.12)",
//           }}
//         >
//           {["Work", "24 Hours", "Saved"].map((t, i) => {
//             const isActive = selectedTab === i;

//             return (
//               <button
//                 key={i}
//                 onClick={() => setSelectedTab(i)}
//                 style={{
//                   border: "none",
//                   outline: "none",
//                   cursor: "pointer",

//                   padding: "9px 42px",
//                   borderRadius: 999,

//                   fontSize: 14,
//                   fontWeight: 500,

//                   background: isActive ? "#fff" : "transparent",
//                   color: "#000",

//                   boxShadow: isActive
//                     ? "0 6px 20px 0 rgba(0, 0, 0, 0.19)"
//                     : "none",

//                   transition: "all 0.25s ease",
//                 }}
//               >
//                 {t}
//               </button>
//             );
//           })}
//         </div>


//         {/* JOB LIST */}
//         <div className="jobs" style={{
//           width: "95%",
//           maxWidth: "100%",
//           overflowX: "hidden",        // 🔥 ADD
//         }}>

//           {filteredJobs.length === 0 && (
//             <p style={{ opacity: 0.6 }}>No jobs found</p>
//           )}

//           {filteredJobs.map((job) => (
//             <div
//               key={job.id}
//               style={{
//                 marginTop: "20px",
//                 background: "#FFFFFF",
//                 borderRadius: 20,
//                 padding: 22,
//                 marginBottom: 18,

//                 boxShadow: "0 0px 6px rgba(0,0,0,0.15)",
//                 position: "relative",

//                 width: "100%",            // 🔥 FIX
//                 boxSizing: "border-box",  // 🔥 KEEP
//               }}
//             >


//               {/* TOP ROW */}
//               <div
//                 style={{
//                   display: "flex",
//                   justifyContent: "space-between",
//                   alignItems: "flex-start",
//                 }}
//               >
//                 {/* LEFT */}
//                 <div>
//                   <div
//                     style={{
//                       fontSize: 18,
//                       fontWeight: 500,
//                       color: "#000",
//                     }}
//                   >
//                     {/* {job.company || "Zuntra digital PVT"} */}
//                   </div>

//                   <div
//                     style={{
//                       fontSize: 15,
//                       fontWeight: 400,
//                       marginTop: 6,
//                       color: "#222",
//                     }}
//                   >
//                     {job.title}
//                   </div>
//                 </div>

//                 {/* RIGHT */}
//                 <div
//                   style={{
//                     display: "flex",
//                     alignItems: "center",
//                     gap: 16,
//                   }}
//                 >
//                   <div
//                     style={{
//                       fontSize: 15,
//                       fontWeight: 500,
//                       color: "#000",
//                       whiteSpace: "nowrap",
//                     }}
//                   >
//                     ₹ {formatCurrency(job.budget)} /per day
//                   </div>

//                   <button
//                     onClick={() => toggleSave(job.id)}
//                     style={{
//                       background: "transparent",
//                       border: "none",
//                       cursor: "pointer",
//                       padding: 0,
//                     }}
//                   >
//                     <img
//                       src={savedJobs.includes(job.id) ? saved : save}
//                       alt="save"
//                       style={{ width: 20 }}
//                     />
//                   </button>
//                 </div>
//               </div>


//               {/* SKILLS */}
//               <div style={{ marginTop: 14 }}>
//                 <div
//                   style={{
//                     fontSize: 13,
//                     color: "#555",
//                     marginBottom: 6,
//                   }}
//                 >
//                   Skills Required
//                 </div>

//                 <div
//                   style={{
//                     display: "flex",
//                     gap: 8,
//                     flexWrap: "wrap",
//                   }}
//                 >
//                   {job.skills?.slice(0, 3).map((s) => (
//                     <span
//                       key={s}
//                       style={{
//                         background: "#FFF3A0",
//                         padding: "6px 12px",
//                         borderRadius: 999,
//                         fontSize: 12,
//                         fontWeight: 500,
//                         color: "#000",
//                       }}
//                     >
//                       {s}
//                     </span>
//                   ))}

//                   {job.skills?.length > 3 && (
//                     <span
//                       style={{
//                         background: "#FFF3A0",
//                         padding: "6px 12px",
//                         borderRadius: 999,
//                         fontSize: 12,
//                         fontWeight: 500,
//                         color: "#000",
//                       }}
//                     >
//                       4+
//                     </span>
//                   )}
//                 </div>
//               </div>

//               {/* DESCRIPTION */}
//               <p
//                 style={{
//                   marginTop: 14,
//                   fontSize: 14,
//                   color: "#444",
//                   lineHeight: 1.6,
//                 }}
//               >
//                 {job.description}
//               </p>

//               {/* FOOTER */}
//               <div
//                 style={{
//                   marginTop: 16,
//                   display: "flex",
//                   justifyContent: "space-between",
//                   alignItems: "center",
//                   fontSize: 12,
//                   color: "#666",
//                 }}
//               >
//                 <div
//                   style={{
//                     display: "flex",
//                     gap: 16,
//                     alignItems: "center",
//                   }}
//                 >
//                   <span><img src={eye} alt="eye" style={{ width: "14px" }} /> {job.views} Impression</span>
//                   <span><img src={clock} style={{ width: "14px", marginTop: "10px" }} alt="clock" /> {timeAgo(job.createdAt)}</span>
//                 </div>


//               </div>
//             </div>
//           ))}
//         </div>


//       </div>
//     </div>
//   );
// }




















// import React, { useEffect, useState } from "react";

// /* ======================================================
//    JOB FILTER MODEL (Flutter JobFilter equivalent)
// ====================================================== */
// export class JobFilter {
//   constructor({
//     categories = [],
//     services = [],
//     skills = [],
//     minPrice = null,
//     maxPrice = null,
//     deliveryTime = "",
//     minDays = null,
//     maxDays = null,
//   } = {}) {
//     this.categories = categories;
//     this.services = services;
//     this.skills = skills;
//     this.minPrice = minPrice;
//     this.maxPrice = maxPrice;
//     this.deliveryTime = deliveryTime; // "24h" | "7d" | "custom"
//     this.minDays = minDays;
//     this.maxDays = maxDays;
//   }
// }

// /* ======================================================
//    FILTER SCREEN
// ====================================================== */
// export default function FilterScreen({
//   initialFilter = new JobFilter(),
//   onApply,
//   onClose,
// }) {
//   /* ---------------- CLONE FILTER (IMPORTANT) ---------------- */
//   const [filter, setFilter] = useState(() =>
//     new JobFilter({
//       categories: [...initialFilter.categories],
//       services: [...initialFilter.services],
//       skills: [...initialFilter.skills],
//       minPrice: initialFilter.minPrice,
//       maxPrice: initialFilter.maxPrice,
//       deliveryTime: initialFilter.deliveryTime,
//       minDays: initialFilter.minDays,
//       maxDays: initialFilter.maxDays,
//     })
//   );

//   /* ---------------- INPUT STATES ---------------- */
//   const [minPrice, setMinPrice] = useState(filter.minPrice ?? "");
//   const [maxPrice, setMaxPrice] = useState(filter.maxPrice ?? "");
//   const [minDays, setMinDays] = useState(filter.minDays ?? "");
//   const [maxDays, setMaxDays] = useState(filter.maxDays ?? "");

//   /* ---------------- DATA ---------------- */
//   const categories = [
//     "Graphics & Design",
//     "Programming & Tech",
//     "Digital Marketing",
//     "Writing & Translation",
//     "Video & Animation",
//     "Music & Audio",
//     "AI Services",
//     "Data",
//     "Business",
//     "Finance",
//     "Photography",
//     "Lifestyle",
//     "Consulting",
//     "Personal Growth & Hobbies",
//   ];

//   const services = [
//     "Graphic Design",
//     "UI UX",
//     "Web Development",
//     "App Development",
//     "Game Development",
//     "SEO",
//     "Social Media Marketing",
//     "Content Writing",
//     "Video Editing",
//     "Voice Over",
//   ];

//   const skills = [
//     "Figma",
//     "React",
//     "Python",
//     "SQL",
//     "Photoshop",
//     "Illustrator",
//     "JavaScript",
//     "Flutter",
//     "Node.js",
//     "MongoDB",
//   ];

//   /* ---------------- HELPERS ---------------- */
//   const toggleListValue = (key, value) => {
//     setFilter((prev) => {
//       const exists = prev[key].includes(value);
//       return {
//         ...prev,
//         [key]: exists
//           ? prev[key].filter((v) => v !== value)
//           : [...prev[key], value],
//       };
//     });
//   };

//   const yellowInput = {
//     width: "100%",
//     padding: "12px",
//     background: "#FFFFBD",
//     border: "none",
//     borderRadius: 4,
//     fontSize: 14,
//   };

//   /* ---------------- APPLY FILTERS ---------------- */
//   const applyFilters = () => {
//     const minP = minPrice !== "" ? parseInt(minPrice) : null;
//     const maxP = maxPrice !== "" ? parseInt(maxPrice) : null;

//     if (minP !== null && maxP !== null && minP > maxP) {
//       alert("Min price cannot be greater than max price");
//       return;
//     }

//     const minD = minDays !== "" ? parseInt(minDays) : null;
//     const maxD = maxDays !== "" ? parseInt(maxDays) : null;

//     if (minD !== null && maxD !== null && minD > maxD) {
//       alert("Min days cannot be greater than max days");
//       return;
//     }

//     const finalFilter = new JobFilter({
//       ...filter,
//       minPrice: minP,
//       maxPrice: maxP,
//       minDays: minD,
//       maxDays: maxD,
//     });

//     onApply && onApply(finalFilter);
//   };

//   /* ======================================================
//      UI
//   ====================================================== */
//   return (
//     <div style={styles.page}>
//       {/* HEADER */}
//       <div style={styles.header}>
//         <button style={styles.backBtn} onClick={onClose}>
//           ←
//         </button>
//         <h2 style={styles.title}>Filters</h2>
//       </div>

//       {/* ---------------- Categories ---------------- */}
//       <Section title="Categories" seeAll>
//         <ChipWrap>
//           {categories.map((c) => (
//             <Chip
//               key={c}
//               text={c}
//               selected={filter.categories.includes(c)}
//               onClick={() => toggleListValue("categories", c)}
//             />
//           ))}
//         </ChipWrap>
//       </Section>

//       {/* ---------------- Services ---------------- */}
//       <Section title="Service" seeAll>
//         <ChipWrap>
//           {services.map((s) => (
//             <Chip
//               key={s}
//               text={s}
//               selected={filter.services.includes(s)}
//               onClick={() => toggleListValue("services", s)}
//             />
//           ))}
//         </ChipWrap>
//       </Section>

//       {/* ---------------- Skills ---------------- */}
//       <Section title="Skills & Tools">
//         <ChipWrap>
//           {skills.map((s) => (
//             <SkillChip
//               key={s}
//               text={s}
//               selected={filter.skills.includes(s)}
//               onRemove={() => toggleListValue("skills", s)}
//             />
//           ))}
//         </ChipWrap>
//       </Section>

//       {/* ---------------- Price ---------------- */}
//       <Section>
//         <div style={{ display: "flex", gap: 12 }}>
//           <input
//             type="number"
//             placeholder="Min"
//             value={minPrice}
//             onChange={(e) => setMinPrice(e.target.value)}
//             style={yellowInput}
//           />
//           <input
//             type="number"
//             placeholder="Max"
//             value={maxPrice}
//             onChange={(e) => setMaxPrice(e.target.value)}
//             style={yellowInput}
//           />
//         </div>
//       </Section>

//       {/* ---------------- Delivery ---------------- */}
//       <Section title="Delivery Time">
//         <RadioRow
//           label="Up to 24 Hours"
//           checked={filter.deliveryTime === "24h"}
//           onClick={() =>
//             setFilter((p) => ({ ...p, deliveryTime: "24h" }))
//           }
//         />
//         <RadioRow
//           label="Up to 7 days"
//           checked={filter.deliveryTime === "7d"}
//           onClick={() =>
//             setFilter((p) => ({ ...p, deliveryTime: "7d" }))
//           }
//         />
//         <RadioRow
//           label="Custom Range"
//           checked={filter.deliveryTime === "custom"}
//           onClick={() =>
//             setFilter((p) => ({ ...p, deliveryTime: "custom" }))
//           }
//         />

//         {filter.deliveryTime === "custom" && (
//           <div style={{ display: "flex", gap: 16, marginTop: 12 }}>
//             <input
//               type="number"
//               placeholder="Min Days"
//               value={minDays}
//               onChange={(e) => setMinDays(e.target.value)}
//               style={yellowInput}
//             />
//             <input
//               type="number"
//               placeholder="Max Days"
//               value={maxDays}
//               onChange={(e) => setMaxDays(e.target.value)}
//               style={yellowInput}
//             />
//           </div>
//         )}
//       </Section>

//       {/* ---------------- Buttons ---------------- */}
//       <div style={styles.buttons}>
//         <button
//           style={{ ...styles.btn, background: "#D9C6FF" }}
//           onClick={() => onApply && onApply(new JobFilter())}
//         >
//           Clear All
//         </button>

//         <button
//           style={{ ...styles.btn, background: "#7C3CFF", color: "#fff" }}
//           onClick={applyFilters}
//         >
//           Apply Filters
//         </button>
//       </div>
//     </div>
//   );
// }

// /* ======================================================
//    REUSABLE UI
// ====================================================== */
// function Section({ title, seeAll, children }) {
//   return (
//     <div style={{ marginBottom: 20 }}>
//       {title && (
//         <div style={styles.sectionHeader}>
//           <h3 style={styles.sectionTitle}>{title}</h3>
//           {seeAll && (
//             <span style={{ color: "#7C3CFF", fontSize: 14 }}>
//               See All
//             </span>
//           )}
//         </div>
//       )}
//       {children}
//     </div>
//   );
// }

// function ChipWrap({ children }) {
//   return (
//     <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
//       {children}
//     </div>
//   );
// }

// function Chip({ text, selected, onClick }) {
//   return (
//     <div
//       onClick={onClick}
//       style={{
//         padding: "10px 14px",
//         borderRadius: 8,
//         background: selected ? "#FDFD96" : "#FFFFFFDC",
//         cursor: "pointer",
//         fontSize: 14,
//       }}
//     >
//       {text}
//     </div>
//   );
// }

// function SkillChip({ text, selected, onRemove }) {
//   return (
//     <div
//       onClick={onRemove}
//       style={{
//         padding: "10px 14px",
//         borderRadius: 8,
//         background: selected ? "#FDFD96" : "#FFFFFFDC",
//         display: "flex",
//         alignItems: "center",
//         gap: 6,
//         cursor: "pointer",
//         fontSize: 14,
//       }}
//     >
//       {text}
//       {selected && <span style={{ fontSize: 12 }}>✕</span>}
//     </div>
//   );
// }

// function RadioRow({ label, checked, onClick }) {
//   return (
//     <div
//       onClick={onClick}
//       style={{
//         display: "flex",
//         justifyContent: "space-between",
//         padding: "12px 0",
//         cursor: "pointer",
//       }}
//     >
//       <span>{label}</span>
//       <input type="radio" checked={checked} readOnly />
//     </div>
//   );
// }

// /* ======================================================
//    STYLES
// ====================================================== */
// const styles = {
//   page: {
//     background: "#fff",
//     minHeight: "100vh",
//     padding: 16,
//     fontFamily: "Rubik, sans-serif",
//   },
//   header: {
//     display: "flex",
//     alignItems: "center",
//     gap: 12,
//     marginBottom: 16,
//   },
//   backBtn: {
//     border: "none",
//     background: "transparent",
//     fontSize: 20,
//     cursor: "pointer",
//   },
//   title: {
//     fontSize: 22,
//     fontWeight: 400,
//   },
//   sectionHeader: {
//     display: "flex",
//     justifyContent: "space-between",
//     marginBottom: 10,
//   },
//   sectionTitle: {
//     fontSize: 20,
//     fontWeight: 400,
//   },
//   buttons: {
//     display: "flex",
//     gap: 14,
//     marginTop: 30,
//   },
//   btn: {
//     flex: 1,
//     height: 48,
//     borderRadius: 6,
//     border: "none",
//     fontSize: 16,
//     fontWeight: 500,
//     cursor: "pointer",
//   },
// };























import React, { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  deleteDoc,
  updateDoc,
  getDoc,
} from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { db } from "../../firbase/Firebase";

/* ======================================================
   FREELANCER NOTIFICATION POPUP – SINGLE PAGE (FIXED)
====================================================== */

export default function FreelancerNotificationPopup() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  /* ---------------- FETCH NOTIFICATIONS ---------------- */
  useEffect(() => {
    const auth = getAuth();

    // ✅ WAIT FOR AUTH READY
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        setLoading(false); // 🔥 prevent infinite loading
        return;
      }

      const q = query(
        collection(db, "accepted_jobs"),
        where("freelancerId", "==", user.uid)
      );

      const unsubscribeFirestore = onSnapshot(q, async (snap) => {
        try {
          const list = await Promise.all(
            snap.docs.map(async (d) => {
              const data = d.data();

              // 🔥 FETCH JOB TITLE
              let title = "New Job Accepted";
              if (data.jobId) {
                const jobSnap = await getDoc(
                  doc(db, "jobs", data.jobId)
                );
                if (jobSnap.exists()) {
                  title = jobSnap.data().title || title;
                }
              }

              return {
                id: d.id,
                title,
                acceptedAt: data.acceptedAt?.toDate() || new Date(),
                isRead: data.isRead || false,
              };
            })
          );

          setNotifications(
            list.sort((a, b) => b.acceptedAt - a.acceptedAt)
          );
        } catch (e) {
          console.error("Notification fetch error:", e);
        } finally {
          setLoading(false); // ✅ always stop loading
        }
      });

      return () => unsubscribeFirestore();
    });

    return () => unsubscribeAuth();
  }, []);

  /* ---------------- HELPERS ---------------- */
  const timeAgo = (date) => {
    const diff = Date.now() - date.getTime();
    const min = Math.floor(diff / 60000);
    if (min < 1) return "just now";
    if (min < 60) return `${min} min ago`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr} hr ago`;
    return `${Math.floor(hr / 24)} days ago`;
  };

  const markAsRead = async (id) => {
    await updateDoc(doc(db, "accepted_jobs", id), {
      isRead: true,
    });
  };

  const removeNotification = async (id) => {
    await deleteDoc(doc(db, "accepted_jobs", id));
  };

  /* ---------------- UI ---------------- */
  return (
    <div style={styles.overlay}>
      <div style={styles.popup}>
        {/* HEADER */}
        <div style={styles.header}>
          <h3 style={{ margin: 0 }}>Notifications</h3>
        </div>

        {/* BODY */}
        <div style={styles.body}>
          {/* LOADING */}
          {loading && <p style={{ textAlign: "center" }}>Loading…</p>}

          {/* EMPTY */}
          {!loading && notifications.length === 0 && (
            <div style={styles.empty}>
              <p style={{ fontWeight: 600 }}>No notifications yet</p>
              <p style={{ opacity: 0.6 }}>
                You're all caught up 🎉
              </p>
            </div>
          )}

          {/* LIST */}
          {!loading &&
            notifications.map((n) => (
              <div
                key={n.id}
                style={{
                  ...styles.card,
                  background: n.isRead
                    ? "#F7F7F7"
                    : "#FFFDE7",
                }}
                onClick={() => markAsRead(n.id)}
              >
                <div>
                  <p style={styles.title}>{n.title}</p>
                  <p style={styles.time}>
                    {timeAgo(n.acceptedAt)}
                  </p>
                </div>

                <button
                  style={styles.close}
                  onClick={(e) => {
                    e.stopPropagation();
                    removeNotification(n.id);
                  }}
                >
                  ✕
                </button>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

/* ======================================================
   STYLES (INLINE – NO CSS FILE)
====================================================== */

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
  },
  popup: {
    width: "92%",
    maxWidth: 420,
    background: "#FFFFFF",
    borderRadius: 22,
    overflow: "hidden",
    boxShadow: "0 15px 40px rgba(0,0,0,0.25)",
  },
  header: {
    padding: 18,
    background: "#FFF59D",
    textAlign: "center",
    fontWeight: 600,
  },
  body: {
    padding: 16,
    maxHeight: "60vh",
    overflowY: "auto",
  },
  card: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
    borderRadius: 14,
    marginBottom: 12,
    cursor: "pointer",
    border: "1px solid #EEE",
  },
  title: {
    margin: 0,
    fontSize: 14,
    fontWeight: 600,
  },
  time: {
    margin: 0,
    fontSize: 12,
    opacity: 0.6,
  },
  close: {
    border: "none",
    background: "#FFCDD2",
    borderRadius: "50%",
    width: 28,
    height: 28,
    cursor: "pointer",
  },
  empty: {
    textAlign: "center",
    padding: 40,
  },
};
