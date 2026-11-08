import { useEffect, useState } from "react";

function ProjectList() {
    const [projects, setProjects] = useState([]);
    const [message, setMessage] = useState("");

    useEffect(() => {
        async function loadProjects() {
            try {
                const response = await fetch("http://localhost:9000/projects");
                const data = await response.json();

                if (response.ok) {
                    setProjects(data);
                } else {
                    setMessage(data.message);
                }
            } catch {
                setMessage("Could not connect to the server. Is it running?");
            }
        }

        loadProjects();
    }, []);

    return (
        <div>
            <h2>Projects</h2>

            {message && <p className="message error">{message}</p>}

            {message === "" && projects.length === 0 && <p>No projects have been created yet.</p>}

            {projects.map((project) => (
                <div className="card" key={project._id}>
                    <h3>{project.name}</h3>
                    <p>{project.description}</p>
                    <p>
                        <strong>Status:</strong> {project.status}
                    </p>
                    <p>
                        <strong>Project Lead:</strong> {project.project_lead_name}
                    </p>
                </div>
            ))}
        </div>
    );
}

export default ProjectList;
