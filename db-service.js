const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'db.json');

const readDB = () => {
    try {
        const data = fs.readFileSync(dbPath, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        return { tasks: [], personnel: [], logs: [] };
    }
};

const writeDB = (data) => {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
};

const DB = {
    // Tasks
    getTasks: () => readDB().tasks,
    addTask: (task) => {
        const db = readDB();
        const newTask = { ...task, id: Date.now().toString() };
        db.tasks.push(newTask);
        writeDB(db);
        return newTask;
    },
    updateTask: (id, taskData) => {
        const db = readDB();
        const index = db.tasks.findIndex(t => t.id === id || t._id === id); // Handle mongo _id for compatibility
        if (index !== -1) {
            db.tasks[index] = { ...db.tasks[index], ...taskData, updated_at: new Date().toISOString() };
            writeDB(db);
            return db.tasks[index];
        }
        return null;
    },
    deleteTask: (id) => {
        const db = readDB();
        const initialLen = db.tasks.length;
        db.tasks = db.tasks.filter(t => t.id !== id && t._id !== id);
        if (db.tasks.length !== initialLen) {
            writeDB(db);
            return true;
        }
        return false;
    },

    // Personal
    getPersonal: () => readDB().personal,
    addPersonal: (person) => {
        const db = readDB();
        const newPerson = { ...person, id: Date.now().toString() };
        if (!db.personal) db.personal = [];
        db.personal.push(newPerson);
        writeDB(db);
        return newPerson;
    },
    deletePersonal: (id) => {
        const db = readDB();
        if (!db.personal) db.personal = [];
        db.personal = db.personal.filter(p => p.id !== id && p._id !== id);
        writeDB(db);
        return true;
    },
    updatePersonal: (id, personData) => {
        const db = readDB();
        if (!db.personal) db.personal = [];
        const index = db.personal.findIndex(p => p.id === id || p._id === id);
        if (index !== -1) {
            db.personal[index] = { ...db.personal[index], ...personData };
            writeDB(db);
            return db.personal[index];
        }
        return null;
    },

    // Logs
    getLogs: () => readDB().logs,
    addLog: (log) => {
        const db = readDB();
        const newLog = { ...log, id: Date.now().toString(), timestamp: new Date().toISOString() };
        db.logs.unshift(newLog); // Newest first
        if (db.logs.length > 100) db.logs.pop(); // Keep only last 100
        writeDB(db);
        return newLog;
    },
    clearLogs: () => {
        const db = readDB();
        db.logs = [];
        writeDB(db);
    }
};

module.exports = DB;
