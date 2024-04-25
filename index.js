// Imports and Initial Setup
import { getTasks, createNewTask, patchTask, deleteTask } from './utils/taskFunctions.js';
import { initialData } from './initialData.js';

// Function to save updated task details to localStorage
function saveUpdatedTaskToLocalStorage(updatedTask) {
  // Retrieve existing tasks from localStorage
  const tasks = JSON.parse(localStorage.getItem('tasks')) || [];

  // Find the index of the task to update
  const taskIndex = tasks.findIndex(task => task.id === updatedTask.id);

  // If the task exists, update it; otherwise, add it as a new task
  if (taskIndex !== -1) {
    tasks[taskIndex] = updatedTask;
  } else {
    tasks.push(updatedTask);
  }

  // Save the updated tasks back to localStorage
  localStorage.setItem('tasks', JSON.stringify(tasks));
}

// Function checks if local storage already has data, if not it loads initialData to localStorage
function initializeData() {
  if (!localStorage.getItem('tasks')) {
    localStorage.setItem('tasks', JSON.stringify(initialData)); 
    localStorage.setItem('showSideBar', 'true');
  } else {
    console.log('Data already exists in localStorage');
    console.log('Tasks:', JSON.parse(localStorage.getItem('tasks')));
  }
}

initializeData();

// DOM Elements
const elements = {
  // Navigation Sidebar elements
  sideBar: document.querySelector('.side-bar'),
  logo: document.getElementById('logo'),
  boardsNavLinks: document.getElementById('boards-nav-links-div'),
  toggleSwitch: document.getElementById('switch'),
  hideSideBarBtn: document.getElementById('hide-side-bar-btn'),
  showSideBarBtn: document.getElementById('show-side-bar-btn'),

  // Main Layout elements
  layout: document.getElementById('layout'),
  header: document.getElementById('header'),
  headerBoardName: document.getElementById('header-board-name'),
  addNewTaskBtn: document.getElementById('add-new-task-btn'),
  editBoardBtn: document.getElementById('edit-board-btn'),
  deleteBoardBtn: document.getElementById('deleteBoardBtn'),

  // Task Columns elements
  todoColumn: document.querySelector('[data-status="todo"]'),
  doingColumn: document.querySelector('[data-status="doing"]'),
  doneColumn: document.querySelector('[data-status="done"]'),

  // New Task Modal elements
  newTaskModalWindow: document.getElementById('new-task-modal-window'),
  titleInput: document.getElementById('title-input'),
  descInput: document.getElementById('desc-input'),
  selectStatus: document.getElementById('select-status'),
  createTaskBtn: document.getElementById('create-task-btn'),
  cancelAddTaskBtn: document.getElementById('cancel-add-task-btn'),

  // Edit Task Modal elements
  editTaskModalWindow: document.querySelector('.edit-task-modal-window'),
  editTaskTitleInput: document.getElementById('edit-task-title-input'),
  editTaskDescInput: document.getElementById('edit-task-desc-input'),
  editSelectStatus: document.getElementById('edit-select-status'),
  saveTaskChangesBtn: document.getElementById('save-task-changes-btn'),
  cancelEditBtn: document.getElementById('cancel-edit-btn'),
  deleteTaskBtn: document.getElementById('delete-task-btn'),

  // Filter Div
  filterDiv: document.getElementById('filterDiv')
};

let activeBoard = "";

// Extracts unique board names from tasks
function fetchAndDisplayBoardsAndTasks() {
  const tasks = getTasks();
  const boards = [...new Set(tasks.map(task => task.board).filter(Boolean))];
  displayBoards(boards);
  if (boards.length > 0) {
    const localStorageBoard = JSON.parse(localStorage.getItem("activeBoard"));
    activeBoard = localStorageBoard ? localStorageBoard :  boards[0]; 
    elements.headerBoardName.textContent = activeBoard;
    styleActiveBoard(activeBoard);
    refreshTasksUI();
  }
}

// Creates different boards in the DOM
function displayBoards(boards) {
  const boardsContainer = document.getElementById("boards-nav-links-div");
  boardsContainer.innerHTML = ''; // Clears the container
  boards.forEach(board => {
    const boardElement = document.createElement("button");
    boardElement.textContent = board;
    boardElement.classList.add("board-btn");
    boardElement.addEventListener('click', () =>  { 
      elements.headerBoardName.textContent = board;
      filterAndDisplayTasksByBoard(board);
      activeBoard = board; //assigns active board
      localStorage.setItem("activeBoard", JSON.stringify(activeBoard));
      styleActiveBoard(activeBoard);
    });
    boardsContainer.appendChild(boardElement);

    // Create columns for each status if they don't exist
    const columnDivs = [elements.todoColumn, elements.doingColumn, elements.doneColumn];
    columnDivs.forEach(column => {
      const status = column.getAttribute("data-status");
      if (!document.querySelector(`[data-status="${status}"]`)) {
        const newColumn = document.createElement("div");
        newColumn.classList.add("column");
        newColumn.setAttribute("data-status", status);
        newColumn.innerHTML = `<div class="column-head-div">
                                  <span class="dot" id="${status}-dot"></span>
                                  <h4 class="columnHeader">${status.toUpperCase()}</h4>
                                </div>`;
        boardsContainer.appendChild(newColumn);
      }
    });
  });
}

// Filters tasks corresponding to the board name and displays them on the DOM.
function filterAndDisplayTasksByBoard(boardName) {
  const tasks = getTasks(); // Fetch tasks from a simulated local storage function
  const filteredTasks = tasks.filter(task => task.board === boardName);

  const columnDivs = [elements.todoColumn, elements.doingColumn, elements.doneColumn];
  columnDivs.forEach(column => {
    const status = column.getAttribute("data-status");
    // Reset column content while preserving the column title
    column.innerHTML = `<div class="column-head-div">
                          <span class="dot" id="${status}-dot"></span>
                          <h4 class="columnHeader">${status.toUpperCase()}</h4>
                        </div>`;

    const tasksContainer = document.createElement("div");
    column.appendChild(tasksContainer);

    filteredTasks.filter(task => task.status === status).forEach(task => { 
      const taskElement = document.createElement("div");
      taskElement.classList.add("task-div");
      taskElement.textContent = task.title;
      taskElement.setAttribute('data-task-id', task.id);

      // Add click event listener to the task element
      taskElement.addEventListener('click', () => { 
        openEditTaskModal(task); // Open edit task modal when task is clicked
      });

      tasksContainer.appendChild(taskElement);
    });
  });
}

// Refreshes the UI to reflect changes
function refreshTasksUI() {
  filterAndDisplayTasksByBoard(activeBoard);
}

// Styles the active board by adding an active class
function styleActiveBoard(boardName) {
  document.querySelectorAll('.board-btn').forEach(btn => {
    if (btn.textContent === boardName) {
      btn.classList.add('active'); 
    } else {
      btn.classList.remove('active');
    }
  });
}

// Adds task to the UI
function addTaskToUI(task) {
  const column = document.querySelector(`.column[data-status="${task.status}"]`);
  if (!column) {
    console.error(`Column not found for status: ${task.status}`);
    return;
  }

  let tasksContainer = column.querySelector('.tasks-container');
  if (!tasksContainer) {
    console.warn(`Tasks container not found for status: ${task.status}, creating one.`);
    tasksContainer = document.createElement('div');
    tasksContainer.className = 'tasks-container';
    column.appendChild(tasksContainer);
  }

  const taskElement = document.createElement('div');
  taskElement.className = 'task-div';
  taskElement.textContent = task.title;
  taskElement.setAttribute('data-task-id', task.id);

  tasksContainer.appendChild(taskElement);
}

// Sets up event listeners for various UI interactions
function setupEventListeners() {
  // Event listeners for cancel buttons
  const cancelEditBtn = document.getElementById('cancel-edit-btn');
  cancelEditBtn.addEventListener('click', () => toggleModal(false, elements.editTaskModalWindow));
  const cancelAddTaskBtn = document.getElementById('cancel-add-task-btn');
  cancelAddTaskBtn.addEventListener('click', () => {
    toggleModal(false);
    elements.filterDiv.style.display = 'none';
  });

  // Event listener for clicking outside the modal to close it
  elements.filterDiv.addEventListener('click', () => {
    toggleModal(false);
    elements.filterDiv.style.display = 'none';
  });

  // Event listeners for sidebar and theme switch
  elements.hideSideBarBtn.addEventListener('click', () => toggleSidebar(false));
  elements.showSideBarBtn.addEventListener('click', () => toggleSidebar(true));
  elements.toggleSwitch.addEventListener('change', toggleTheme);

  // Event listener for showing the Add New Task Modal
  elements.addNewTaskBtn.addEventListener('click', () => {
    toggleModal(true);
    elements.filterDiv.style.display = 'block';
  });

  // Event listener for adding new task form submission
  elements.newTaskModalWindow.addEventListener('submit', event => {
    addTask(event);
  });

  // Event listener for saving task changes
  elements.saveTaskChangesBtn.addEventListener('click', () => {
    saveTaskChanges();
  });

  // Event listener for deleting task
  elements.deleteTaskBtn.addEventListener('click', () => {
    const taskId = elements.editTaskModalWindow.getAttribute('data-task-id');
    deleteTask(taskId);
    toggleModal(false, elements.editTaskModalWindow);
    refreshTasksUI();
  });
}

// Toggles the display of modals
function toggleModal(show, modal = elements.newTaskModalWindow) {
  modal.style.display = show ? 'block' : 'none'; 
}

/*************************************************************************************************************************************************
 * COMPLETE FUNCTION CODE
 * **********************************************************************************************************************************************/

// Function to add a task
function addTask(event) {
  event.preventDefault(); 

  // Assign user input to the task object
  const task = {
    title: elements.titleInput.value,
    description: elements.descInput.value,
    status: elements.selectStatus.value,
    board: activeBoard
  };
  const newTask = createNewTask(task);
  if (newTask) {
    addTaskToUI(newTask);
    toggleModal(false);
    elements.filterDiv.style.display = 'none';
    event.target.reset();
    refreshTasksUI();
  }
}

// Toggles the sidebar visibility
function toggleSidebar(show) {
  const sidebar = document.querySelector('.side-bar');
  if (show) {
    sidebar.style.display = 'block';
    svg.style.display = 'none';
  } else {
    sidebar.style.display = 'none';
    svg.style.display = 'block';
  }
}

// Toggles the theme
function toggleTheme() {
  const body = document.body;
  const logo = document.getElementById('logo');

  if (body.classList.contains('light-theme')) {
    body.classList.remove('light-theme');
    body.classList.add('dark-theme');
    localStorage.setItem('theme', 'dark');
    logo.style.filter = 'none';
  } else {
    body.classList.remove('dark-theme');
    body.classList.add('light-theme');
    localStorage.setItem('theme', 'light');
    logo.style.filter = 'invert(100%)';
  }
}

// Function to open the edit task modal
function openEditTaskModal(task) {
  // Set task details in modal inputs
  elements.editTaskTitleInput.value = task.title;
  elements.editTaskDescInput.value = task.description;
  elements.editSelectStatus.value = task.status;

  // Show the edit task modal
  toggleModal(true, elements.editTaskModalWindow);

  // Remove any previous event listener before adding a new one
  elements.saveTaskChangesBtn.removeEventListener('click', saveTaskChanges);
  
  // Pass the taskId to saveTaskChanges function
  elements.saveTaskChangesBtn.addEventListener('click', () => {
    saveTaskChanges(task.id);
  });

  // Add event listener to delete button to delete the task
  elements.deleteTaskBtn.addEventListener('click', () => {
    deleteTask(task.id);
    toggleModal(false, elements.editTaskModalWindow);
    refreshTasksUI();
  });
}

// Function to save task changes
function saveTaskChanges(taskId) {
  // Get new user inputs
  const updatedTitle = elements.editTaskTitleInput.value;
  const updatedDescription = elements.editTaskDescInput.value;
  const updatedStatus = elements.editSelectStatus.value;

  // Create an object with the updated task details
  const updatedTask = {
    id: taskId,
    title: updatedTitle,
    description: updatedDescription,
    status: updatedStatus
  };

  // Update task using a helper function
  patchTask(taskId, updatedTask); 

  // Update the task in the UI
  const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
  if (taskElement) {
    taskElement.textContent = updatedTask.title;
    taskElement.setAttribute('data-status', updatedTask.status);
  }

  // Close the modal
  toggleModal(false, elements.editTaskModalWindow);

  // Refresh the UI to reflect the changes
  refreshTasksUI();
}

/*************************************************************************************************************************************************/

// Initialize the app after the DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
  init(); // init is called after the DOM is fully loaded
});

// Initialization function
function init() {
  setupEventListeners();
  const showSidebar = localStorage.getItem('showSideBar') === 'false';
  toggleSidebar(showSidebar);
  const isLightTheme = localStorage.getItem('theme') === 'light';
  document.body.classList.toggle('light-theme', isLightTheme);
  fetchAndDisplayBoardsAndTasks(); // Initial display of boards and tasks
}

// Create an SVG element for sidebar toggle
const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
svg.setAttribute("width", "19");
svg.setAttribute("height", "19");

// Create a text element inside the SVG for the eye emoji
const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
text.setAttribute("x", "2");
text.setAttribute("y", "15");
text.setAttribute("font-size", "14");
text.setAttribute("fill", "#828FA3");
text.textContent = "👀";

// Append the text element to the SVG
svg.appendChild(text);

// Get the layout container
const layout = document.getElementById("layout");

// Append the SVG to the layout container
layout.appendChild(svg);

// Add an event listener to the SVG to toggle the sidebar when clicked
svg.addEventListener("click", function() {
  toggleSidebar(true); // Open the sidebar when clicked
  svg.style.display = "none";
});

// Selecting the "done" column
const doneColumn = document.querySelector('.column-div[data-status="done"]');

// Function to add a task to the "done" column
function addTaskToDoneColumn(task) {
  if (!doneColumn) {
    console.error('Column not found for status: done');
    return;
  }

  const taskElement = document.createElement('div');
  taskElement.classList.add('task-div');
  taskElement.textContent = task.title; // Modify as needed
  taskElement.setAttribute('data-task-id', task.id);

  doneColumn.appendChild(taskElement);
}
