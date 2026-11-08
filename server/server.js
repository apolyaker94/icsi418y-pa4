require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { MongoClient, ObjectId } = require("mongodb");

const app = express();
const client = new MongoClient(process.env.MONGO_URI);

let users;
let projects;
let memberships;
let stories;

const STATUSES = ["Planning", "Active", "Completed"];
const PRIORITIES = ["High", "Medium", "Low"];
const STORY_STATUSES = ["To Do", "In Progress", "Done"];

app.use(express.json());
app.use(cors());

async function connectDatabase() {
    try {
        await client.connect();
        const db = client.db("pa2");
        users = db.collection("users");
        projects = db.collection("projects");
        memberships = db.collection("projectMemberships");
        stories = db.collection("userStories");
        await stories.createIndex({ project_id: 1 });
        await users.createIndex({ username: 1 }, { unique: true });
        await memberships.createIndex({ project_id: 1, user_id: 1 }, { unique: true });
        console.log("Connected to MongoDB");
    } catch (error) {
        console.error("Could not connect to MongoDB");
        console.error(error);
    }
}

function toObjectId(id) {
    if (typeof id !== "string" || !ObjectId.isValid(id)) {
        return null;
    }
    return new ObjectId(id);
}

function fullName(user) {
    return user.f_name + " " + user.l_name + " (" + user.username + ")";
}

app.get("/", (req, res) => {
    res.json({ message: "Server is running" });
});

app.post("/signup", async (req, res) => {
    const f_name = (req.body.f_name || "").trim();
    const l_name = (req.body.l_name || "").trim();
    const username = (req.body.username || "").trim();
    const password = req.body.password || "";

    if (f_name === "" || l_name === "" || username === "" || password === "") {
        return res.status(400).json({ message: "Please fill in all of the fields." });
    }

    try {
        const existing = await users.findOne({ username: username });

        if (existing !== null) {
            return res.status(409).json({ message: "That username is already taken." });
        }

        await users.insertOne({
            f_name: f_name,
            l_name: l_name,
            username: username,
            password: password
        });

        res.status(201).json({ message: "Account created! You can log in now." });
    } catch (error) {
        console.error(error);

        if (error.code === 11000) {
            return res.status(409).json({ message: "That username is already taken." });
        }

        res.status(500).json({ message: "Something went wrong on the server. Please try again." });
    }
});

app.post("/login", async (req, res) => {
    const username = (req.body.username || "").trim();
    const password = req.body.password || "";

    if (username === "" || password === "") {
        return res.status(400).json({ message: "Please enter both a username and a password." });
    }

    try {
        const user = await users.findOne({ username: username });

        if (user === null) {
            return res.status(401).json({ message: "No account with that username exists." });
        }

        if (user.password !== password) {
            return res.status(401).json({ message: "Incorrect password." });
        }

        res.status(200).json({ message: "Welcome back, " + user.f_name + "! You are logged in." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Something went wrong on the server. Please try again." });
    }
});

app.get("/users", async (req, res) => {
    try {
        const list = await users
            .find({}, { projection: { password: 0 } })
            .sort({ username: 1 })
            .toArray();

        res.status(200).json(list);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Something went wrong on the server. Please try again." });
    }
});

app.post("/projects", async (req, res) => {
    const name = (req.body.name || "").trim();
    const description = (req.body.description || "").trim();
    const status = (req.body.status || "").trim();
    const leadId = req.body.project_lead_id || "";

    if (name === "" || description === "" || status === "" || leadId === "") {
        return res.status(400).json({ message: "Please fill in all of the fields." });
    }

    if (!STATUSES.includes(status)) {
        return res.status(400).json({ message: "Status must be Planning, Active, or Completed." });
    }

    const project_lead_id = toObjectId(leadId);

    try {
        const lead = project_lead_id === null ? null : await users.findOne({ _id: project_lead_id });

        if (lead === null) {
            return res.status(404).json({ message: "The selected Project Lead does not exist." });
        }

        const created = await projects.insertOne({
            name: name,
            description: description,
            status: status,
            project_lead_id: project_lead_id
        });

        try {
            await memberships.insertOne({
                project_id: created.insertedId,
                user_id: project_lead_id
            });
        } catch (error) {
            await projects.deleteOne({ _id: created.insertedId });
            throw error;
        }

        res.status(201).json({ message: "Project created! " + fullName(lead) + " is the Project Lead." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Something went wrong on the server. Please try again." });
    }
});

app.get("/projects", async (req, res) => {
    try {
        const list = await projects.find({}).sort({ name: 1 }).toArray();
        const result = [];

        for (const project of list) {
            const lead = await users.findOne({ _id: project.project_lead_id });

            result.push({
                _id: project._id,
                name: project.name,
                description: project.description,
                status: project.status,
                project_lead_id: project.project_lead_id,
                project_lead_name: lead === null ? "Unknown user" : fullName(lead)
            });
        }

        res.status(200).json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Something went wrong on the server. Please try again." });
    }
});

app.get("/projects/:projectId/members", async (req, res) => {
    const projectId = toObjectId(req.params.projectId);

    try {
        const project = projectId === null ? null : await projects.findOne({ _id: projectId });

        if (project === null) {
            return res.status(404).json({ message: "That project does not exist." });
        }

        const links = await memberships.find({ project_id: projectId }).toArray();
        const members = [];

        for (const link of links) {
            const user = await users.findOne({ _id: link.user_id });

            if (user !== null) {
                members.push({
                    _id: user._id,
                    name: fullName(user),
                    is_lead: user._id.equals(project.project_lead_id)
                });
            }
        }

        members.sort((a, b) => b.is_lead - a.is_lead || a.name.localeCompare(b.name));

        res.status(200).json(members);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Something went wrong on the server. Please try again." });
    }
});

app.post("/projects/:projectId/members", async (req, res) => {
    const projectId = toObjectId(req.params.projectId);
    const userId = toObjectId(req.body.user_id);

    if (req.body.user_id === undefined || req.body.user_id === "") {
        return res.status(400).json({ message: "Please select a user to add." });
    }

    try {
        const project = projectId === null ? null : await projects.findOne({ _id: projectId });

        if (project === null) {
            return res.status(404).json({ message: "That project does not exist." });
        }

        const user = userId === null ? null : await users.findOne({ _id: userId });

        if (user === null) {
            return res.status(404).json({ message: "That user does not exist." });
        }

        const existing = await memberships.findOne({ project_id: projectId, user_id: userId });

        if (existing !== null) {
            return res.status(409).json({ message: fullName(user) + " is already a member of this project." });
        }

        await memberships.insertOne({
            project_id: projectId,
            user_id: userId
        });

        res.status(201).json({ message: fullName(user) + " was added to " + project.name + "." });
    } catch (error) {
        console.error(error);

        if (error.code === 11000) {
            return res.status(409).json({ message: "That user is already a member of this project." });
        }

        res.status(500).json({ message: "Something went wrong on the server. Please try again." });
    }
});

app.delete("/projects/:projectId/members/:userId", async (req, res) => {
    const projectId = toObjectId(req.params.projectId);
    const userId = toObjectId(req.params.userId);

    try {
        const project = projectId === null ? null : await projects.findOne({ _id: projectId });

        if (project === null) {
            return res.status(404).json({ message: "That project does not exist." });
        }

        const user = userId === null ? null : await users.findOne({ _id: userId });

        if (user === null) {
            return res.status(404).json({ message: "That user does not exist." });
        }

        if (project.project_lead_id.equals(userId)) {
            return res.status(400).json({ message: "The Project Lead cannot be removed from the project." });
        }

        // PA4: a member who still has stories in this project (any status) can't be removed.
        // Stories in other projects don't count because we filter by project_id.
        const assignedCount = await stories.countDocuments({
            project_id: projectId,
            assigned_user_id: userId
        });

        if (assignedCount > 0) {
            return res.status(409).json({
                message: fullName(user) + " still has " + assignedCount + " story(ies) assigned in this project. " +
                    "Reassign, unassign, or delete them before removing this member."
            });
        }

        const result = await memberships.deleteOne({ project_id: projectId, user_id: userId });

        if (result.deletedCount === 0) {
            return res.status(404).json({ message: fullName(user) + " is not a member of this project." });
        }

        res.status(200).json({ message: fullName(user) + " was removed from " + project.name + "." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Something went wrong on the server. Please try again." });
    }
});

// ---------- User stories (PA4) ----------

// Returns { userId } (null for Unassigned) or { status, message } if the assignment is not allowed.
async function checkAssignee(projectId, rawAssigneeId) {
    if (rawAssigneeId === "" || rawAssigneeId === null || rawAssigneeId === undefined) {
        return { userId: null };
    }

    const userId = toObjectId(rawAssigneeId);
    const user = userId === null ? null : await users.findOne({ _id: userId });

    if (user === null) {
        return { status: 404, message: "The assigned user does not exist." };
    }

    const link = await memberships.findOne({ project_id: projectId, user_id: userId });

    if (link === null) {
        return { status: 400, message: fullName(user) + " is not a member of this project." };
    }

    return { userId: userId };
}

// Validates the text/enum fields shared by create and edit.
function validateStoryFields(body, requireStatus) {
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const description = typeof body.description === "string" ? body.description.trim() : "";
    const priority = typeof body.priority === "string" ? body.priority.trim() : "";

    if (title === "" || description === "" || priority === "") {
        return { message: "Title, description, and priority are required." };
    }

    if (!PRIORITIES.includes(priority)) {
        return { message: "Priority must be High, Medium, or Low." };
    }

    let status = "To Do";

    if (requireStatus) {
        status = typeof body.status === "string" ? body.status.trim() : "";

        if (!STORY_STATUSES.includes(status)) {
            return { message: "Status must be To Do, In Progress, or Done." };
        }
    }

    return { title, description, priority, status };
}

async function storyWithName(story) {
    let assigned_user_name = "Unassigned";

    if (story.assigned_user_id !== null) {
        const user = await users.findOne({ _id: story.assigned_user_id });
        assigned_user_name = user === null ? "Unknown user" : fullName(user);
    }

    return { ...story, assigned_user_name };
}

app.get("/projects/:projectId/stories", async (req, res) => {
    const projectId = toObjectId(req.params.projectId);

    try {
        const project = projectId === null ? null : await projects.findOne({ _id: projectId });

        if (project === null) {
            return res.status(404).json({ message: "That project does not exist." });
        }

        const list = await stories.find({ project_id: projectId }).sort({ _id: 1 }).toArray();
        const result = [];

        for (const story of list) {
            result.push(await storyWithName(story));
        }

        res.status(200).json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Something went wrong on the server. Please try again." });
    }
});

app.post("/projects/:projectId/stories", async (req, res) => {
    const projectId = toObjectId(req.params.projectId);

    const fields = validateStoryFields(req.body, false);

    if (fields.message) {
        return res.status(400).json({ message: fields.message });
    }

    try {
        const project = projectId === null ? null : await projects.findOne({ _id: projectId });

        if (project === null) {
            return res.status(404).json({ message: "That project does not exist." });
        }

        const assignee = await checkAssignee(projectId, req.body.assigned_user_id);

        if (assignee.message) {
            return res.status(assignee.status).json({ message: assignee.message });
        }

        await stories.insertOne({
            project_id: projectId,
            title: fields.title,
            description: fields.description,
            priority: fields.priority,
            status: "To Do",
            assigned_user_id: assignee.userId
        });

        res.status(201).json({ message: "Story \"" + fields.title + "\" was added to " + project.name + "." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Something went wrong on the server. Please try again." });
    }
});

app.put("/projects/:projectId/stories/:storyId", async (req, res) => {
    const projectId = toObjectId(req.params.projectId);
    const storyId = toObjectId(req.params.storyId);

    const fields = validateStoryFields(req.body, true);

    if (fields.message) {
        return res.status(400).json({ message: fields.message });
    }

    try {
        const project = projectId === null ? null : await projects.findOne({ _id: projectId });

        if (project === null) {
            return res.status(404).json({ message: "That project does not exist." });
        }

        // Match on BOTH ids so a story can only be edited through the project that owns it.
        const existing = storyId === null ? null : await stories.findOne({ _id: storyId, project_id: projectId });

        if (existing === null) {
            return res.status(404).json({ message: "That story does not exist in this project." });
        }

        const assignee = await checkAssignee(projectId, req.body.assigned_user_id);

        if (assignee.message) {
            return res.status(assignee.status).json({ message: assignee.message });
        }

        // project_id is deliberately not in $set, so it can never change.
        await stories.updateOne(
            { _id: storyId, project_id: projectId },
            {
                $set: {
                    title: fields.title,
                    description: fields.description,
                    priority: fields.priority,
                    status: fields.status,
                    assigned_user_id: assignee.userId
                }
            }
        );

        res.status(200).json({ message: "Story \"" + fields.title + "\" was updated." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Something went wrong on the server. Please try again." });
    }
});

app.delete("/projects/:projectId/stories/:storyId", async (req, res) => {
    const projectId = toObjectId(req.params.projectId);
    const storyId = toObjectId(req.params.storyId);

    try {
        const project = projectId === null ? null : await projects.findOne({ _id: projectId });

        if (project === null) {
            return res.status(404).json({ message: "That project does not exist." });
        }

        const result = storyId === null ? { deletedCount: 0 } : await stories.deleteOne({ _id: storyId, project_id: projectId });

        if (result.deletedCount === 0) {
            return res.status(404).json({ message: "That story does not exist in this project." });
        }

        res.status(200).json({ message: "Story deleted." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Something went wrong on the server. Please try again." });
    }
});

connectDatabase();

app.listen(9000, () => {
    console.log("Server running on port 9000");
});
