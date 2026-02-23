let seconds = 0;
let timer = null;
let running = false;
let activeTask = null;

const scriptURL = "https://script.google.com/macros/s/AKfycbzGxw0nGPwcWGlvKknlOwMOvsiu9Oc7IACxYHloTlnZaRqjrE84ZkwSF0ENk2L0lbFe_g/exec";

/* ELEMENTS */
const taskForm = document.getElementById("taskForm");
const timerDisplay = document.getElementById("timer");
const statusText = document.getElementById("status");
const message = document.getElementById("message");
const stopBtn = document.getElementById("stopBtn");
const historyList = document.getElementById("historyList");

const userId = document.getElementById("userId");
const userName = document.getElementById("userName");
const date = document.getElementById("date");
const taskName = document.getElementById("taskName");
const taskLink = document.getElementById("taskLink");
const comments = document.getElementById("comments");

/* AUTO DATE */
date.valueAsDate = new Date();

/* LOAD SAVED USER */
if (localStorage.getItem("aa_user")) {
  const user = JSON.parse(localStorage.getItem("aa_user"));
  userId.value = user.userId;
  userName.value = user.userName;
  userId.disabled = true;
  userName.disabled = true;
}

/* TIME FORMAT */
function formatTime(sec){
  const h = String(Math.floor(sec/3600)).padStart(2,"0");
  const m = String(Math.floor((sec%3600)/60)).padStart(2,"0");
  const s = String(sec%60).padStart(2,"0");
  return `${h}:${m}:${s}`;
}

function getCurrentTime(){
  return new Date().toLocaleTimeString();
}

function lockForm(lock){
  taskName.disabled = lock;
  taskLink.disabled = lock;
  comments.disabled = lock;
  taskForm.querySelector("button").disabled = lock;
}

/* START TASK */
taskForm.addEventListener("submit", e => {
  e.preventDefault();

  if(running){
    message.textContent = "Task already running ❗";
    return;
  }

  if(!userId.value || !userName.value || !taskName.value){
    message.textContent = "Fill required fields ❗";
    return;
  }

  /* SAVE USER ONCE */
  localStorage.setItem("aa_user", JSON.stringify({
    userId: userId.value,
    userName: userName.value
  }));

  activeTask = {
    userId: userId.value,
    userName: userName.value,
    date: date.value,
    taskName: taskName.value,
    taskLink: taskLink.value,
    comments: comments.value,
    startTime: getCurrentTime()
  };

  seconds = 0;
  timerDisplay.textContent = "00:00:00";

  running = true;
  statusText.textContent = "Running";
  lockForm(true);

  timer = setInterval(() => {
    seconds++;
    timerDisplay.textContent = formatTime(seconds);
  }, 1000);

  message.textContent = "Task started ▶";
});

/* STOP TASK */
stopBtn.addEventListener("click", async () => {
  if(!running){
    message.textContent = "No task running ❗";
    return;
  }

  clearInterval(timer);
  running = false;
  statusText.textContent = "Stopped";

  activeTask.endTime = getCurrentTime();
  activeTask.duration = formatTime(seconds);

  try{
    const formData = new URLSearchParams();
    for (const key in activeTask) {
      formData.append(key, activeTask[key]);
    }

    await fetch(scriptURL, {
      method: "POST",
      body: formData
    });

    addToHistory(activeTask);
    message.textContent = "Task saved ✅";

  }catch{
    message.textContent = "Error saving task ❌";
  }

  taskName.value = "";
  taskLink.value = "";
  comments.value = "";

  lockForm(false);
  timerDisplay.textContent = "00:00:00";
  seconds = 0;
  activeTask = null;
});

/* HISTORY */
function addToHistory(task){
  if(historyList.textContent === "No tasks tracked yet"){
    historyList.textContent = "";
  }

  const div = document.createElement("div");
  div.className = "task-item";
  div.innerHTML = `
    <strong>${task.date}</strong> | ${task.userName}<br>
    ${task.taskName}<br>
    Total: ${task.duration}<br>
    ${task.taskLink ? `🔗 <a href="${task.taskLink}" target="_blank">Open Link</a><br>` : ""}
    ${task.comments ? `📝 ${task.comments}` : ""}
  `;
  historyList.prepend(div);
}

