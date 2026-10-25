import { useState } from "react";
import ReactMarkdown from "react-markdown";
import "./App.css";

const suggestions = [
  "Tell me about my projects",
  "What are my technical skills?",
  "Does my profile match an AI Engineer role?",
]; 

function App() {
  const [active, setActive] = useState("Dashboard");
  const [darkMode, setDarkMode] = useState(false);
    // My Profile
  const [profile, setProfile] = useState({
    github: "",
    linkedin: "",
    portfolio: "",
  });

  const [profileSaved, setProfileSaved] = useState(false);
  const [file, setFile] = useState(null);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [resumeData, setResumeData] = useState(null);
const [jobRole, setJobRole] = useState("AI Engineer");
const [jobMatch, setJobMatch] = useState(null);
const [matching, setMatching] = useState(false);
const [matchError, setMatchError] = useState("");
const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Hi! I'm your AI Career Assistant. Ask me about the candidate's skills, education, projects, or experience. I'll answer using the available profile information.",
    },
  ]);
 
async function uploadResume(selectedFile) {
  if (!selectedFile) return;

  const formData = new FormData();
  formData.append("file", selectedFile);

  try {   
      setUploading(true);
      setUploadResult(null);

    const response = await fetch(
       "https://hiremeeporfolio.onrender.com/upload-resume", 
      {
        method: "POST",
        body: formData,
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || "Resume upload failed");
    }
    setResumeData(data.analysis||null);
setUploadResult(data);
setFile(selectedFile);

console.log("Resume API response:", data);
console.log("Extracted resume text:", data.resume_text);

    alert(data.message || "Resume uploaded successfully!");

    console.log("Upload response:", data);
  } catch (error) {
    console.error("Upload error:", error);
    alert("Upload failed: " + error.message);
  } 
  finally {
    setUploading(false);
}
}
  function navigate(label) {
    setActive(label);

   const targets = {
  Dashboard: "dashboard",
  "Upload Resume": "upload",
  "Resume Analysis": "analysis",
  "My Profile": "my-profile",
  "Job Matching": "job-matching",
  "AI Chat": "chat",
  About: "about",
};

    document.getElementById(targets[label])?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

   async function sendQuestion(text = question) {
  const value = text.trim();

  if (!value || loading) return;

  setMessages((old) => [...old, { role: "user", text: value }]);
  setQuestion("");
  setLoading(true);

  try {
      const response = await fetch("https://hiremeeporfolio.onrender.com/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: value }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || data.error || "Request failed");
    }

    setMessages((old) => [
      ...old,
      {
        role: "assistant",
        text: data.answer || "No answer was returned by the backend.",
      },
    ]);
  } catch (error) {
    setMessages((old) => [
      ...old,
      {
        role: "assistant",
        text: `AI service error: ${error.message}`,
      },
    ]);
  } finally {
    setLoading(false);
  }
}

async function matchJob() {
  if (!file) {
    setMatchError("Please upload your resume first.");
    return;
  }

  setMatching(true);
  setMatchError("");
  setJobMatch(null);

  try {
      const response = await fetch("https://hiremeeporfolio.onrender.com/match-job", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        job_role: jobRole,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || "Job matching failed.");
    }

    setJobMatch(data);
  } catch (error) {
    setMatchError(error.message);
  } finally {
    setMatching(false);
  }
}

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">✦</div>
          <div>
            <h1>Hire<span>Mee</span></h1>
            <p>AI Career Assistant</p>
          </div>
        </div>

        <div className="menu-label">WORKSPACE</div>
           <nav className="nav-menu">
  {[
    ["Dashboard", "▦"],
    ["Upload Resume", "⇧"],
    ["Resume Analysis", "▤"],
    ["My Profile", "👤"],
    ["Job Matching", "🎯"],
    ["AI Chat", "◉"],
    ["About", "ⓘ"],
  ].map(([label, icon]) => (
            <button
              key={label}
              className={`nav-item ${active === label ? "active" : ""}`}
              onClick={() => navigate(label)}
            >
              <span className="nav-icon">{icon}</span>
              {label}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="online-dot" />
          <div>
            <strong>AI Assistant</strong>
            <p>Ready to help</p>
          </div>
        </div>
      </aside>

      <main
  className={`main-area ${darkMode ? "dark-mode" : ""}`}
  id="dashboard"
>
        <header className="topbar">
          <div>
            <p className="eyebrow">YOUR PROFESSIONAL SPACE</p>
            <h2>AI Portfolio Dashboard</h2>
          </div>
          <div className="profile-chip">
            <div className="avatar">K</div>
            <div>
              <strong>Kamini</strong>
              <p>Candidate Profile</p>
            </div>
          </div>
          <button
      
  className="theme-toggle"
  onClick={() => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    document.body.classList.toggle("dark-mode", newMode);
  }}
>
  {darkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}
</button>
        </header>

        <div className="welcome">
          <div>
            <p className="eyebrow">WELCOME TO HIREMEE</p>
            <h2>Your career, <span>powered by AI.</span></h2>
            <p>
              Explore your profile and ask questions about your professional
              background.
            </p>
          </div>
          <div className="welcome-symbol">✧</div>
        </div>

        <section className="dashboard-grid">
          <div className="left-column">
            <section className="card upload-card" id="upload">
              <div className="section-heading">
                <div className="section-icon purple">⇧</div>
                <div>
                  <h3>Upload Your Resume</h3>
                  <p>Select a PDF to get started.</p>
                </div>
              </div>

              <label className="drop-zone">
                <input
                  type="file"
                  accept=".pdf,application/pdf"
                 onChange={(event) => {
                 const selectedFile = event.target.files?.[0] || null;
                  setFile(selectedFile);

                if (selectedFile) { 
                  uploadResume(selectedFile);
                }
               }}
                />
                <div className="upload-symbol">⇧</div>
                <strong>Choose your resume PDF</strong>
                <p>Click here to browse files · PDF only</p>
                <span className="choose-button">Choose PDF</span>
              </label>

              {file && (
                <div className="selected-file">
                  <span>📄 {file.name}</span>
                  <button onClick={() => setFile(null)}>Remove</button>
                </div>
              )}

              <p className="helper-text">
                {uploading && (
  <div className="upload-status">
    Resume upload ho raha hai...
  </div>
)}

{uploadResult && (
  <div className="upload-status success">
    <strong>{uploadResult.message}</strong>
    <p>File: {uploadResult.filename}</p>
  </div>
)}
                {uploading
    ? "Resume upload ho raha hai..."
    : uploadResult
    ? "Resume successfully uploaded and processed!"
    : file
    ? "File selected. Upload status pending."
    : "Please select your resume PDF to get started."}
              </p>
            </section>

            <section className="card summary-card" id="analysis">
              <div className="section-heading">
                <div className="section-icon purple">▤</div>
                <div>
                  <h3>Candidate Overview</h3>
                  <p>Your professional profile</p>
                </div>
              </div>

            <div className="info-row">
  <span>Name</span>
  <strong>
    {resumeData?.name || "Upload your resume"}
  </strong>
</div>

<div className="info-row">
  <span>Email</span>
  <strong>{resumeData?.email || "Not available"}</strong>
</div>

<div className="info-row">
  <span>Phone</span>
  <strong>{resumeData?.phone || "Not available"}</strong>
</div>
<div className="info-row">
  <span>CGPA</span>
  <strong>
    {resumeData?.CGPA ?? "Not available"}
  </strong>
</div>


<div className="info-row">
  <span>Total Experience</span>
  <strong>
    {resumeData?.total_experience_years != null
      ? `${resumeData.total_experience_years} years`
      : "Not available"}
  </strong>
</div>

<div className="info-row">
  <span>Resume Analysis</span>
  <strong className={resumeData ? "status-success" : "status-pending"}>
    {resumeData ? "Analyzed successfully" : "Not analyzed yet"}
  </strong>
</div>
            </section>
           
<section className="card skills-card">
  <div className="section-heading">
    <div className="section-icon purple">✧</div>
    <div>
      <h3>Skills &amp; Expertise</h3>
      <p>Skills extracted from your resume</p>
    </div>
  </div>

  {resumeData?.skills?.length > 0 ? (
    <div className="skills-list">
      {resumeData.skills.map((skill, index) => (
        <span className="skill-badge" key={`${skill}-${index}`}>
          {skill}
        </span>
      ))}
    </div>
  ) : (
    <div className="empty-state">
      <span>✦</span>
      <p>Upload your resume to discover your skills.</p>
    </div>
  )}
</section>

{/* JOB MATCHING SECTION - START */}
<section className="card job-matching-card" id="job-matching">
  <div className="section-heading">
    <div className="section-icon purple">🎯</div>

    <div>
      <h3>AI Job Matching</h3>
      <p>Check how well your resume matches a job role.</p>
    </div>
  </div>

  <div className="job-match-form">
    <label htmlFor="job-role">Select Job Role</label>

    <select
      id="job-role"
      value={jobRole}
      onChange={(event) => {
        setJobRole(event.target.value);
        setJobMatch(null);
        setMatchError("");
      }}
    >
      <option value="AI Engineer">AI Engineer</option>
      <option value="Python Developer">Python Developer</option>
      <option value="Data Analyst">Data Analyst</option>
    </select>

    <button
      type="button"
      className="match-button"
      onClick={matchJob}
      disabled={matching || uploading || !file}
    >
      {matching ? "Analyzing Resume..." : "Match My Resume"}
    </button>
  </div>

  {!file && (
    <p className="match-message">
      Please upload your resume first.
    </p>
  )}

  {matchError && (
    <p className="match-error">{matchError}</p>
  )}

  {jobMatch && (
    <div className="job-match-results">
      <h4>Matching Results</h4>

      <p>
        Selected Role: <strong>{jobRole}</strong>
      </p>

     <div className="match-score">
  <h2>{jobMatch.match_score}%</h2>
  <p>Resume Match Score</p>
</div>

<p>
  Selected Role: <strong>{jobMatch.job_role}</strong>
</p>

<div className="matched-skills">
  <h4>✅ Matched Skills</h4>
  {jobMatch.matched_skills?.map((skill, index) => (
    <span className="skill-badge" key={index}>
      {skill}
    </span>
  ))}
</div>

<div className="missing-skills">
  <h4>📚 Skills to Improve</h4>
  {jobMatch.missing_skills?.map((skill, index) => (
    <span className="skill-badge missing" key={index}>
      {skill}
    </span>
  ))}
</div>

{jobMatch.suggestion && (
  <div className="match-suggestion">
    <strong>💡 Recommendation</strong>
    <p>{jobMatch.suggestion}</p>
  </div>
)}
    </div>
  )}
</section>
{/* JOB MATCHING SECTION - END */}

{/* NEECHЕ KA EXISTING CODE */}
</div>
          {/* MY PROFILE SECTION */}
<section className="card profile-card" id="my-profile">
  <div className="section-heading">
    <div className="section-icon purple">👤</div>
    <div>
      <h3>My Profile</h3>
      <p>Manage your professional profile and social links.</p>
    </div>
  </div>

  <form
    className="profile-form"
    onSubmit={(event) => {
      event.preventDefault();
      setProfileSaved(true);
    }}
  >
    <label htmlFor="github">GitHub Profile URL</label>
    <input
      id="github"
      type="url"
      placeholder="https://github.com/your-username"
      value={profile.github}
      onChange={(event) => {
        setProfile({ ...profile, github: event.target.value });
        setProfileSaved(false);
      }}
    />

    <label htmlFor="linkedin">LinkedIn Profile URL</label>
    <input
      id="linkedin"
      type="url"
      placeholder="https://www.linkedin.com/in/your-profile"
      value={profile.linkedin}
      onChange={(event) => {
        setProfile({ ...profile, linkedin: event.target.value });
        setProfileSaved(false);
      }}
    />

    <label htmlFor="portfolio">Portfolio Website (Optional)</label>
    <input
      id="portfolio"
      type="url"
      placeholder="https://your-portfolio.com"
      value={profile.portfolio}
      onChange={(event) => {
        setProfile({ ...profile, portfolio: event.target.value });
        setProfileSaved(false);
      }}
    />

    <button type="submit" className="match-button">
      Save Profile
    </button>

    {profileSaved && (
      <p className="status-success">
        Profile saved successfully!
      </p>
    )}
  </form>

  {profileSaved && (
    <div className="profile-links">
      <h4>Your Professional Links</h4>

      {profile.github && (
        <p>
          <strong>GitHub:</strong>{" "}
          <a href={profile.github} target="_blank" rel="noreferrer">
            View GitHub Profile ↗
          </a>
        </p>
      )}

      {profile.linkedin && (
        <p>
          <strong>LinkedIn:</strong>{" "}
          <a href={profile.linkedin} target="_blank" rel="noreferrer">
            View LinkedIn Profile ↗
          </a>
        </p>
      )}

      {profile.portfolio && (
        <p>
          <strong>Portfolio:</strong>{" "}
          <a href={profile.portfolio} target="_blank" rel="noreferrer">
            View Portfolio ↗
          </a>
        </p>
      )}
    </div>
  )}
</section>
          <section className="card chat-card" id="chat">
            <div className="chat-heading">
              <div className="section-icon white-icon">✧</div>
              <div>
                <h3>Ask AI About Your Profile</h3>
                <p>Ask about skills, projects, education, and experience.</p>
              </div>
              <span className="online-badge">● Online</span>
            </div>

            <div className="suggestions">
              {suggestions.map((item) => (
                <button
                  key={item}
                  onClick={() => sendQuestion(item)}
                  disabled={loading}
                >
                  {item} ↗
                </button>
              ))}
            </div>

            <div className="messages">
              {messages.map((message, index) => (
                < div 
                 className={`message ${message.role}`} key={index}>
                  {message.role === "assistant" && (
                    <div className="bot-avatar">✦</div>
                  )}
                  <div className="message-bubble">
                    {message.role === "assistant" ?(
                   <ReactMarkdown>
                 {message.text}
                 </ReactMarkdown>
                    ):(
                      message.text
                    )}
                    </div>
                  </div>
                
              ))}
              {loading && (
                <div className="typing">AI is thinking...</div>
              )}
            </div>

            <form
              className="chat-input"
              onSubmit={(event) => {
                event.preventDefault();
                sendQuestion();
              }}
            >
              <input
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                placeholder="Ask something about the candidate..."
                aria-label="Your question"
              />
              <button type="submit" disabled={loading || !question.trim()}>
                {loading ? "..." : "Send ↑"}
              </button>
            </form>
            <p className="chat-note">
              AI answers depend on information available in the backend profile.
            </p>
          </section>
        </section>

        <footer id="about">
          HireMee <span>•</span> AI Candidate Portfolio
        </footer>
      </main>
    </div>
  );
}

export default App;