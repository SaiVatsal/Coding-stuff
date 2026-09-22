import json
import os

class PlannerManager:
    def __init__(self, tasks_file="tasks.json"):
        self.tasks_file = tasks_file
        self.tasks = self.load_tasks()

    def load_tasks(self):
        """Loads tasks from local JSON."""
        if os.path.exists(self.tasks_file):
            try:
                with open(self.tasks_file, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except json.JSONDecodeError:
                return []
        return []

    def save_tasks(self):
        """Saves current tasks into local JSON."""
        with open(self.tasks_file, 'w', encoding='utf-8') as f:
            json.dump(self.tasks, f, indent=4)

    def add_task(self, task_name: str):
        """Adds a new pending task."""
        task = {
            "id": len(self.tasks) + 1,
            "name": task_name,
            "status": "pending"
        }
        self.tasks.append(task)
        self.save_tasks()
        print(f"[Planner] Added task: {task_name}")
        return True, f"I have added {task_name} to your planner."

    def view_tasks(self):
        """Returns a formatted string of all pending tasks."""
        pending = [t for t in self.tasks if t["status"] == "pending"]
        if not pending:
            return True, "You currently have no pending tasks."
        
        response = "Here are your pending tasks: "
        for t in pending:
            response += f"Task {t['id']}, {t['name']}. "
            
        print(f"[Planner] Tasks requested. Found {len(pending)} pending.")
        return True, response

    def mark_complete(self, task_id: int = None, task_str: str = None):
        """Marks a task as complete by ID or matching string."""
        if task_id:
            for t in self.tasks:
                if t["id"] == task_id and t["status"] == "pending":
                    t["status"] = "completed"
                    self.save_tasks()
                    return True, f"Marked task {task_id} as complete."
        elif task_str:
            for t in self.tasks:
                if t["status"] == "pending" and task_str.lower() in t["name"].lower():
                    t["status"] = "completed"
                    self.save_tasks()
                    return True, f"Marked the task {t['name']} as complete."
                    
        return False, "I couldn't find a matching pending task to complete."

if __name__ == "__main__":
    pm = PlannerManager("test_tasks.json")
    pm.add_task("Buy groceries")
    pm.add_task("Finish AI project")
    _, view = pm.view_tasks()
    print(view)
    pm.mark_complete(task_str="groceries")
    _, view = pm.view_tasks()
    print(view)
    if os.path.exists("test_tasks.json"):
        os.remove("test_tasks.json")
