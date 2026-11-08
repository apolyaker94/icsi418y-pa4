import { useState } from "react";
import Signup from "./components/Signup.jsx";
import Login from "./components/Login.jsx";
import CreateProject from "./components/CreateProject.jsx";
import ProjectList from "./components/ProjectList.jsx";
import Memberships from "./components/Memberships.jsx";
import Backlog from "./components/Backlog.jsx";

function App() {
    const [page, setPage] = useState("login");

    return (
        <div className="container">
            <h1>PA4 - Backlog</h1>

            <div className="tabs">
                <button
                    className={page === "login" ? "active" : ""}
                    onClick={() => setPage("login")}
                >
                    Login
                </button>
                <button
                    className={page === "signup" ? "active" : ""}
                    onClick={() => setPage("signup")}
                >
                    Sign Up
                </button>
                <button
                    className={page === "create" ? "active" : ""}
                    onClick={() => setPage("create")}
                >
                    New Project
                </button>
                <button
                    className={page === "projects" ? "active" : ""}
                    onClick={() => setPage("projects")}
                >
                    Projects
                </button>
                <button
                    className={page === "members" ? "active" : ""}
                    onClick={() => setPage("members")}
                >
                    Members
                </button>
                <button
                    className={page === "backlog" ? "active" : ""}
                    onClick={() => setPage("backlog")}
                >
                    Backlog
                </button>
            </div>

            {page === "backlog" && <Backlog />}
            {page === "login" && <Login />}
            {page === "signup" && <Signup />}
            {page === "create" && <CreateProject />}
            {page === "projects" && <ProjectList />}
            {page === "members" && <Memberships />}
        </div>
    );
}

export default App;
