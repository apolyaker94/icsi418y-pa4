import { useEffect, useState } from "react";

function CreateProject() {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [status, setStatus] = useState("Planning");
    const [leadId, setLeadId] = useState("");
    const [users, setUsers] = useState([]);
    const [message, setMessage] = useState("");
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        async function loadUsers() {
            try {
                const response = await fetch("http://localhost:9000/users");
                const data = await response.json();

                if (response.ok) {
                    setUsers(data);
                } else {
                    setSuccess(false);
                    setMessage(data.message);
                }
            } catch {
                setSuccess(false);
                setMessage("Could not connect to the server. Is it running?");
            }
        }

        loadUsers();
    }, []);

    async function handleSubmit(event) {
        event.preventDefault();

        if (name.trim() === "" || description.trim() === "" || leadId === "") {
            setSuccess(false);
            setMessage("Please fill in all of the fields.");
            return;
        }

        try {
            const response = await fetch("http://localhost:9000/projects", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    name: name,
                    description: description,
                    status: status,
                    project_lead_id: leadId
                })
            });

            const data = await response.json();

            setSuccess(response.ok);
            setMessage(data.message);

            if (response.ok) {
                setName("");
                setDescription("");
                setStatus("Planning");
                setLeadId("");
            }
        } catch {
            setSuccess(false);
            setMessage("Could not connect to the server. Is it running?");
        }
    }

    return (
        <form onSubmit={handleSubmit}>
            <h2>New Project</h2>

            <label>
                Name
                <input
                    type="text"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                />
            </label>

            <label>
                Description
                <textarea
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                />
            </label>

            <label>
                Status
                <select value={status} onChange={(event) => setStatus(event.target.value)}>
                    <option value="Planning">Planning</option>
                    <option value="Active">Active</option>
                    <option value="Completed">Completed</option>
                </select>
            </label>

            <label>
                Project Lead
                <select value={leadId} onChange={(event) => setLeadId(event.target.value)}>
                    <option value="">Select a user</option>
                    {users.map((user) => (
                        <option key={user._id} value={user._id}>
                            {user.f_name} {user.l_name} ({user.username})
                        </option>
                    ))}
                </select>
            </label>

            <button type="submit">Create Project</button>

            {message && <p className={success ? "message success" : "message error"}>{message}</p>}
        </form>
    );
}

export default CreateProject;
