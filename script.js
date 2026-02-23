let seconds = 0;
let timer = null;
let running = false;
let activeTask = null;

/* GOOGLE SCRIPT URL */
const scriptURL = "https://script.google.com/macros/s/AKfycbyVnWQ6kfoszV4Bij-KA0tsWgfeLhU6D6rcr61SCXeZyxYXxfikvLwz067o1nMLcAF_ow/exec";

/* GET ELEMENTS */
const taskForm = document.getElementById("taskForm");
const timerDisplay = document.getElementById("timer");
const statusText = document.getElementById("status");
const message = document.getElementById("message");
const stopBtn = document.getElementById("stopBtn");
const historyList = document.getElementById("historyList");
const themeToggle = document.getElementById("themeToggle");

/* FORM FIELDS */
const userId = document.getElementById("userId");
const userName = document.getElementById("userName");
const date = document.getElementById("date");
const taskName = document.getElementById("taskName");
const taskLink = document.getElementById("taskLink");
const comments = document.getElementById("comments");

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
  document.querySelectorAll("#taskForm input, #taskForm textarea, #taskForm button")
    .forEach(el => el.disabled = lock);
}

/* SET TASK → START TIMER */
taskForm.addEventListener("submit", e => {
  e.preventDefault();

  if(running){
    message.textContent = "Task already running ❗";
    return;
  }

  if(!userId.value || !userName.value || !date.value || !taskName.value){
    message.textContent = "Fill all required fields ❗";
    return;
  }

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

/* STOP → SAVE */
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

    formData.append("userId", activeTask.userId);
    formData.append("userName", activeTask.userName);
    formData.append("date", activeTask.date);
    formData.append("taskName", activeTask.taskName);
    formData.append("taskLink", activeTask.taskLink);
    formData.append("comments", activeTask.comments);
    formData.append("startTime", activeTask.startTime);
    formData.append("endTime", activeTask.endTime);
    formData.append("duration", activeTask.duration);

    await fetch(scriptURL, {
      method: "POST",
      body: formData,
      mode: "no-cors"   // 🔥 REQUIRED FOR APPS SCRIPT
    });

    addToHistory(activeTask);
    message.textContent = "Task saved ✅";

  }catch(error){
    console.error(error);
    message.textContent = "Error saving task ❌";
  }

  taskForm.reset();
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

/* DARK MODE */
if(localStorage.getItem("theme") === "dark"){
  document.body.classList.add("dark");
  themeToggle.textContent = "☀️";
}

themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark");

  if(document.body.classList.contains("dark")){
    localStorage.setItem("theme","dark");
    themeToggle.textContent = "☀️";
  }else{
    localStorage.setItem("theme","light");
    themeToggle.textContent = "🌙";
  }
});