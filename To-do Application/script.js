(function () {
  "use strict";

  const STORAGE_KEY = "todos-vanilla-app";
  const FALLBACK_QUOTE = "\u201CThe secret of getting ahead is getting started.\u201D \u2014 Mark Twain";

  const todoInput = document.getElementById("todo-input");
  const addButton = document.getElementById("add-button");
  const todoList = document.getElementById("todo-list");
  const itemsCount = document.getElementById("items-count");
  const filterButtons = document.getElementById("filter-buttons");
  const clearCompletedButton = document.getElementById("clear-completed");
  const quoteBanner = document.getElementById("quote-banner");
  const appFooter = document.getElementById("app-footer");

  let todos = [];
  let currentFilter = "all";

  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
  }

  function saveToStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  }

  function loadFromStorage() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        todos = JSON.parse(stored);
      } catch {
        todos = [];
      }
    }
  }

  function getFilteredTodos() {
    if (currentFilter === "active") {
      return todos.filter(function (todo) { return !todo.completed; });
    }
    if (currentFilter === "completed") {
      return todos.filter(function (todo) { return todo.completed; });
    }
    return todos;
  }

  function getActiveCount() {
    return todos.filter(function (todo) { return !todo.completed; }).length;
  }

  function hasCompletedTodos() {
    return todos.some(function (todo) { return todo.completed; });
  }

  function updateFooter() {
    const activeCount = getActiveCount();
    const suffix = activeCount === 1 ? "item left" : "items left";
    itemsCount.textContent = activeCount + " " + suffix;

    clearCompletedButton.style.visibility = hasCompletedTodos() ? "visible" : "hidden";

    if (todos.length > 0) {
      appFooter.classList.add("visible");
    } else {
      appFooter.classList.remove("visible");
    }
  }

  function createTodoElement(todo) {
    const li = document.createElement("li");
    li.className = "todo-item";
    li.dataset.id = todo.id;
    if (todo.completed) {
      li.classList.add("completed");
    }

    const checkbox = document.createElement("span");
    checkbox.className = "todo-checkbox";
    checkbox.setAttribute("role", "checkbox");
    checkbox.setAttribute("aria-checked", todo.completed.toString());
    checkbox.textContent = "\u2713";

    const textSpan = document.createElement("span");
    textSpan.className = "todo-text";
    textSpan.textContent = todo.text;

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "todo-delete";
    deleteBtn.setAttribute("aria-label", "Delete todo");
    deleteBtn.textContent = "\u00D7";

    li.appendChild(checkbox);
    li.appendChild(textSpan);
    li.appendChild(deleteBtn);

    return li;
  }

  function renderTodos() {
    todoList.textContent = "";
    const filtered = getFilteredTodos();
    const fragment = document.createDocumentFragment();

    filtered.forEach(function (todo) {
      fragment.appendChild(createTodoElement(todo));
    });

    todoList.appendChild(fragment);
    updateFooter();
  }

  function addTodo() {
    const text = todoInput.value.trim();
    if (!text) return;

    const todo = {
      id: generateId(),
      text: text,
      completed: false,
      createdAt: Date.now()
    };

    todos.push(todo);
    todoInput.value = "";
    saveToStorage();

    if (currentFilter !== "completed") {
      const element = createTodoElement(todo);
      element.classList.add("adding");
      todoList.appendChild(element);
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          element.classList.remove("adding");
        });
      });
    }

    updateFooter();
  }

  function findTodoById(id) {
    return todos.find(function (todo) { return todo.id === id; });
  }

  function toggleTodo(id) {
    const todo = findTodoById(id);
    if (!todo) return;

    todo.completed = !todo.completed;
    saveToStorage();
    renderTodos();
  }

  function deleteTodo(id) {
    const listItem = todoList.querySelector('[data-id="' + id + '"]');
    if (listItem) {
      listItem.classList.add("removing");
      listItem.addEventListener("transitionend", function () {
        todos = todos.filter(function (todo) { return todo.id !== id; });
        saveToStorage();
        renderTodos();
      }, { once: true });
    } else {
      todos = todos.filter(function (todo) { return todo.id !== id; });
      saveToStorage();
      renderTodos();
    }
  }

  function startEditing(id) {
    const todo = findTodoById(id);
    if (!todo) return;

    const listItem = todoList.querySelector('[data-id="' + id + '"]');
    if (!listItem) return;

    const textSpan = listItem.querySelector(".todo-text");
    if (!textSpan) return;

    const input = document.createElement("input");
    input.type = "text";
    input.className = "todo-edit-input";
    input.value = todo.text;

    textSpan.replaceWith(input);
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);

    function finishEditing() {
      const newText = input.value.trim();
      if (newText && newText !== todo.text) {
        todo.text = newText;
        saveToStorage();
      }
      if (!newText) {
        deleteTodo(id);
        return;
      }
      renderTodos();
    }

    input.addEventListener("blur", finishEditing, { once: true });
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        input.blur();
      }
      if (e.key === "Escape") {
        input.value = todo.text;
        input.blur();
      }
    });
  }

  function setFilter(filter) {
    currentFilter = filter;
    const buttons = filterButtons.querySelectorAll(".filter-button");
    buttons.forEach(function (btn) {
      btn.classList.toggle("active", btn.dataset.filter === filter);
    });
    renderTodos();
  }

  function clearCompleted() {
    todos = todos.filter(function (todo) { return !todo.completed; });
    saveToStorage();
    renderTodos();
  }

  async function fetchQuote() {
    try {
      const response = await fetch("https://api.quotable.io/random");
      if (!response.ok) throw new Error("API error");
      const data = await response.json();
      quoteBanner.textContent = "\u201C" + data.content + "\u201D \u2014 " + data.author;
    } catch {
      quoteBanner.textContent = FALLBACK_QUOTE;
    }
    quoteBanner.classList.add("visible");
  }

  todoList.addEventListener("click", function (e) {
    const listItem = e.target.closest(".todo-item");
    if (!listItem) return;
    const id = listItem.dataset.id;

    if (e.target.classList.contains("todo-delete")) {
      deleteTodo(id);
      return;
    }

    if (e.target.classList.contains("todo-checkbox")) {
      toggleTodo(id);
    }
  });

  todoList.addEventListener("dblclick", function (e) {
    const listItem = e.target.closest(".todo-item");
    if (!listItem) return;

    if (e.target.classList.contains("todo-text")) {
      startEditing(listItem.dataset.id);
    }
  });

  addButton.addEventListener("click", addTodo);

  todoInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      addTodo();
    }
  });

  filterButtons.addEventListener("click", function (e) {
    if (e.target.classList.contains("filter-button")) {
      setFilter(e.target.dataset.filter);
    }
  });

  clearCompletedButton.addEventListener("click", clearCompleted);

  loadFromStorage();
  renderTodos();
  fetchQuote();
})();
