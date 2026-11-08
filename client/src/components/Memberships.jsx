import { useEffect, useState } from "react";

function Memberships() {
    const [projects, setProjects] = useState([]);
    const [users, setUsers] = useState([]);
    const [projectId, setProjectId] = useState("");
    const [members, setMembers] = useState([]);
    const [userId, setUserId] = useState("");
    const [message, setMessage] = useState("");
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        async function loadData() {
            try {
                const projectResponse = await fetch("http://localhost:9000/projects");
                const projectData = await projectResponse.json();
                const userResponse = await fetch("http://localhost:9000/users");
                const userData = await userResponse.json();

                if (projectResponse.ok && userResponse.ok) {
                    setProjects(projectData);
                    setUsers(userData);
                } else {
                    setSuccess(false);
                    setMessage("Could not load the projects and users.");
                }
            } catch {
                setSuccess(false);
                setMessage("Could not connect to the server. Is it running?");
            }
        }

        loadData();
    }, []);

    async function loadMembers(id) {
        if (id === "") {
            setMembers([]);
            return;
        }

        try {
            const response = await fetch("http://localhost:9000/projects/" + id + "/members");
            const data = await response.json();

            if (response.ok) {
                setMembers(data);
            } else {
                setMembers([]);
                setSuccess(false);
                setMessage(data.message);
            }
        } catch {
            setSuccess(false);
            setMessage("Could not connect to the server. Is it running?");
        }
    }

    function handleProjectChange(event) {
        setProjectId(event.target.value);
        setMessage("");
        loadMembers(event.target.value);
    }

    async function handleAdd(event) {
        event.preventDefault();

        if (projectId === "") {
            setSuccess(false);
            setMessage("Please select a project first.");
            return;
        }

        if (userId === "") {
            setSuccess(false);
            setMessage("Please select a user to add.");
            return;
        }

        try {
            const response = await fetch("http://localhost:9000/projects/" + projectId + "/members", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    user_id: userId
                })
            });

            const data = await response.json();

            setSuccess(response.ok);
            setMessage(data.message);

            if (response.ok) {
                setUserId("");
            }

            loadMembers(projectId);
        } catch {
            setSuccess(false);
            setMessage("Could not connect to the server. Is it running?");
        }
    }

    async function handleRemove(id) {
        try {
            const response = await fetch("http://localhost:9000/projects/" + projectId + "/members/" + id, {
                method: "DELETE"
            });

            const data = await response.json();

            setSuccess(response.ok);
            setMessage(data.message);

            loadMembers(projectId);
        } catch {
            setSuccess(false);
            setMessage("Could not connect to the server. Is it running?");
        }
    }

    return (
        <div>
            <form onSubmit={handleAdd}>
                <h2>Project Members</h2>

                <label>
                    Project
                    <select value={projectId} onChange={handleProjectChange}>
                        <option value="">Select a project</option>
                        {projects.map((project) => (
                            <option key={project._id} value={project._id}>
                                {project.name}
                            </option>
                        ))}
                    </select>
                </label>

                <label>
                    Add a user
                    <select value={userId} onChange={(event) => setUserId(event.target.value)}>
                        <option value="">Select a user</option>
                        {users.map((user) => (
                            <option key={user._id} value={user._id}>
                                {user.f_name} {user.l_name} ({user.username})
                            </option>
                        ))}
                    </select>
                </label>

                <button type="submit">Add Member</button>

                {message && <p className={success ? "message success" : "message error"}>{message}</p>}
            </form>

            {projectId !== "" && (
                <div className="card">
                    <h3>Current Members</h3>

                    {members.length === 0 && <p>This project has no members.</p>}

                    {members.map((member) => (
                        <div className="member" key={member._id}>
                            <span>
                                {member.name}
                                {member.is_lead && " - Project Lead"}
                            </span>
                            {!member.is_lead && (
                                <button onClick={() => handleRemove(member._id)}>Remove</button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default Memberships;
