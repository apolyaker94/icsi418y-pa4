# Projects

Andrew Polyakov
ICSI 418Y - Programming Assignment 4

## Description

This builds on the PA3 projects app by adding user stories and a backlog for
each project. The frontend is React (made with Vite) with six tabs: Login,
Sign Up, New Project, Projects, Members, and Backlog. The backend is an Express
server that talks to a MongoDB Atlas database.

- **New Project** creates a project with a name, description, status (Planning,
  Active, or Completed), and a Project Lead picked from the registered users.
  The Project Lead is automatically added as a member.
- **Projects** lists every project with its description, status, and the name of
  its Project Lead.
- **Members** lets you pick a project, see who is in it, add a registered user,
  and remove any member except the Project Lead.
- **Backlog** lets you pick a project and see its user stories (title,
  description, priority, status, and assigned member). You can add, edit, and
  delete stories. New stories always start as To Do. When editing, the status
  can be changed to In Progress or Done (and back). The assigned member
  dropdown only lists the members of the selected project, plus Unassigned.
  Deleting a story asks for confirmation first.

A member cannot be removed from a project while they still have any story
assigned in that project, including Done stories. Stories assigned in a
different project do not block the removal.

Every result (story saved, invalid assignment, member still has stories, missing
fields, server not running, etc.) shows up as a message in the page so you never
have to open the console.

## Database

- `users`: `f_name`, `l_name`, `username`, `password`
- `projects`: `name`, `description`, `status`, `project_lead_id`
- `projectMemberships`: `project_id`, `user_id`
- `userStories`: `project_id`, `title`, `description`, `priority`, `status`,
  `assigned_user_id`

`project_lead_id`, `project_id`, `user_id`, and `assigned_user_id` are stored as
ObjectId references to the documents they point at. `assigned_user_id` is `null`
for an unassigned story. A unique index on `project_id` and `user_id` in
`projectMemberships` stops a user from being added to the same project twice.
The `project_id` of a story is set when it is created and is never changed by an
edit.

## Routes

```
POST   /signup                          create an account
POST   /login                           log in
GET    /users                           all users (without passwords)
POST   /projects                        create a project and add the lead as a member
GET    /projects                        all projects with the lead's name
GET    /projects/:projectId/members     members of a project
POST   /projects/:projectId/members     add a user to a project
DELETE /projects/:projectId/members/:userId   remove a non-lead member
GET    /projects/:projectId/stories     stories of a project with the assigned member's name
POST   /projects/:projectId/stories     create a story (status is always To Do)
PUT    /projects/:projectId/stories/:storyId   edit a story
DELETE /projects/:projectId/stories/:storyId   delete a story
```

## Running it

You need two terminals.

Backend:

```
cd server
npm install
node server.js
```

Frontend:

```
cd client
npm install
npm run dev
```

Then open http://localhost:5173. The backend runs on port 9000.

## .env

The server reads the MongoDB connection string from `server/.env`, which is not
committed. Copy `server/.env.example` to `server/.env` and fill in your Atlas
connection string

## Files

```
client/src/App.jsx                       tabs that switch between the pages
client/src/components/Login.jsx          login form
client/src/components/Signup.jsx         signup form
client/src/components/CreateProject.jsx  new project form
client/src/components/ProjectList.jsx    list of projects
client/src/components/Memberships.jsx    view, add, and remove project members
client/src/components/Backlog.jsx        project backlog: view, add, edit, delete stories
client/src/index.css                     styling
server/server.js                         express routes + mongodb
```
