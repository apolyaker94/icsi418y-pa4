import { useEffect, useState } from "react";

const EMPTY_FORM = {
    title: "",
    description: "",
    priority: "",
    status: "To Do",
    assigned_user_id: ""
};

function Backlog() {
    const [projects, setProjects] = useState([]);
    const [projectId, setProjectId] = useState("");
    const [members, setMembers] = useState([]);
    const [stories, setStories] = useState([]);
    const [form, setForm] = useState(EMPTY_FORM);
    const [editingId, setEditingId] = useState(null);
    const [message, setMessage] = useState("");
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        async function loadProjects() {
            try {
                const response = await fetch("http://localhost:9000/projects");
                const data = await response.json();

                if (response.ok) {
                    setProjects(data);
                } else {
                    setSuccess(false);
                    setMessage("Could not load the projects.");
                }
            } catch {
                setSuccess(false);
                setMessage("Could not connect to the server. Is it running?");
            }
        }

        loadProjects();
    }, []);

    async function loadProjectData(id) {
        try {
            const memberResponse = await fetch("http://localhost:9000/projects/" + id + "/members");
            const memberData = await memberResponse.json();
            const storyResponse = await fetch("http://localhost:9000/projects/" + id + "/stories");
            const storyData = await storyResponse.json();

            if (memberResponse.ok && storyResponse.ok) {
                setMembers(memberData);
                setStories(storyData);
            } else {
                setSuccess(false);
                setMessage(memberData.message || storyData.message);
            }
        } catch {
            setSuccess(false);
            setMessage("Could not connect to the server. Is it running?");
        }
    }

    function handleProjectChange(event) {
        const id = event.target.value;

        setProjectId(id);
        setMembers([]);
        setStories([]);
        setForm(EMPTY_FORM);
        setEditingId(null);
        setMessage("");

        if (id !== "") {
            loadProjectData(id);
        }
    }

    function handleChange(event) {
        setForm({ ...form, [event.target.name]: event.target.value });
    }

    function handleEdit(story) {
        setEditingId(story._id);
        setMessage("");
        setForm({
            title: story.title,
            description: story.description,
            priority: story.priority,
            status: story.status,
            assigned_user_id: story.assigned_user_id === null ? "" : story.assigned_user_id
        });
    }

    function handleCancel() {
        setEditingId(null);
        setForm(EMPTY_FORM);
        setMessage("");
    }

    async function handleSubmit(event) {
        event.preventDefault();

        if (form.title.trim() === "" || form.description.trim() === "" || form.priority === "") {
            setSuccess(false);
            setMessage("Title, description, and priority are required.");
            return;
        }

        const editing = editingId !== null;
        const url = "http://localhost:9000/projects/" + projectId + "/stories" + (editing ? "/" + editingId : "");

        try {
            const response = await fetch(url, {
                method: editing ? "PUT" : "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(form)
            });

            const data = await response.json();

            setSuccess(response.ok);
            setMessage(data.message);

            if (response.ok) {
                setForm(EMPTY_FORM);
                setEditingId(null);
            }

            loadProjectData(projectId);
        } catch {
            setSuccess(false);
            setMessage("Could not connect to the server. Is it running?");
        }
    }

    async function handleDelete(story) {
        if (!window.confirm("Delete the story \"" + story.title + "\"?")) {
            return;
        }

        try {
            const response = await fetch("http://localhost:9000/projects/" + projectId + "/stories/" + story._id, {
                method: "DELETE"
            });

            const data = await response.json();

            setSuccess(response.ok);
            setMessage(data.message);

            if (editingId === story._id) {
                setEditingId(null);
                setForm(EMPTY_FORM);
            }

            loadProjectData(projectId);
        } catch {
            setSuccess(false);
            setMessage("Could not connect to the server. Is it running?");
        }
    }

    return (
        <div>
            <form onSubmit={handleSubmit}>
                <h2>Project Backlog</h2>

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

                {projectId !== "" && (
                    <div>
                        <h3>{editingId === null ? "New Story" : "Edit Story"}</h3>

                        <label>
                            Title
                            <input type="text" name="title" value={form.title} onChange={handleChange} />
                        </label>

                        <label>
                            Description
                            <textarea
                                name="description"
                                placeholder="As a [type of user], I want [goal], so that [benefit]."
                                value={form.description}
                                onChange={handleChange}
                            />
                        </label>

                        <label>
                            Priority
                            <select name="priority" value={form.priority} onChange={handleChange}>
                                <option value="">Select a priority</option>
                                <option value="High">High</option>
                                <option value="Medium">Medium</option>
                                <option value="Low">Low</option>
                            </select>
                        </label>

                        {editingId !== null && (
                            <label>
                                Status
                                <select name="status" value={form.status} onChange={handleChange}>
                                    <option value="To Do">To Do</option>
                                    <option value="In Progress">In Progress</option>
                                    <option value="Done">Done</option>
                                </select>
                            </label>
                        )}

                        <label>
                            Assigned Member
                            <select name="assigned_user_id" value={form.assigned_user_id} onChange={handleChange}>
                                <option value="">Unassigned</option>
                                {members.map((member) => (
                                    <option key={member._id} value={member._id}>
                                        {member.name}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <button type="submit">{editingId === null ? "Add Story" : "Save Changes"}</button>
                        {editingId !== null && (
                            <button type="button" onClick={handleCancel}>
                                Cancel
                            </button>
                        )}
                    </div>
                )}

                {message && <p className={success ? "message success" : "message error"}>{message}</p>}
            </form>

            {projectId !== "" && (
                <div>
                    {stories.length === 0 && <p>This project has no stories yet.</p>}

                    {stories.map((story) => (
                        <div className="card" key={story._id}>
                            <h3>{story.title}</h3>
                            <p>{story.description}</p>
                            <p>
                                <strong>Priority:</strong> {story.priority}
                            </p>
                            <p>
                                <strong>Status:</strong> {story.status}
                            </p>
                            <p>
                                <strong>Assigned:</strong> {story.assigned_user_name}
                            </p>
                            <button onClick={() => handleEdit(story)}>Edit</button>
                            <button onClick={() => handleDelete(story)}>Delete</button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default Backlog;
