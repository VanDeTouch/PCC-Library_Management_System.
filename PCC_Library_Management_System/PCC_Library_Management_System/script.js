const $ = (selector) => document.querySelector(selector);
const workspace = $("#workspace");
const loginScreen = $("#loginScreen");
const app = $("#app");
const bookDialog = $("#bookDialog");
const confirmDialog = $("#confirmDialog");
let books = [];
let borrowed = [
  {student:"Andrea Santos", bookId:"BK-002", borrowed:"2026-10-02", due:"2026-10-16", status:"Borrowed"},
  {student:"Mark Reyes", bookId:"BK-005", borrowed:"2026-09-18", due:"2026-10-02", status:"Overdue"},
  {student:"Nicole Cruz", bookId:"BK-008", borrowed:"2026-10-04", due:"2026-10-18", status:"Borrowed"},
  {student:"John Miguel", bookId:"BK-004", borrowed:"2026-09-20", due:"2026-10-04", status:"Overdue"},
  {student:"Paolo Garcia", bookId:"BK-001", borrowed:"2026-10-06", due:"2026-10-20", status:"Borrowed"}
];
let activePage = "dashboard";
let pendingDelete = null;

async function initialize(){
  try {
    const saved = localStorage.getItem("pccLibraryBooks");
    if(saved) books = JSON.parse(saved);
    else {
      const response = await fetch("books.json");
      if(!response.ok) throw new Error("Could not load books.json");
      books = await response.json();
      persistBooks();
    }
  } catch(error) {
    books = [
      {id:"BK-001",title:"The Great Gatsby",author:"F. Scott Fitzgerald",category:"Literature",year:1925,status:"Available"},
      {id:"BK-002",title:"Harry Potter and the Sorcerer's Stone",author:"J.K. Rowling",category:"Fiction",year:1997,status:"Borrowed"},
      {id:"BK-003",title:"The Hobbit",author:"J.R.R. Tolkien",category:"Fiction",year:1937,status:"Available"},
      {id:"BK-004",title:"Clean Code",author:"Robert C. Martin",category:"Programming",year:2008,status:"Available"},
      {id:"BK-005",title:"Introduction to Algorithms",author:"Thomas H. Cormen",category:"Education",year:2009,status:"Borrowed"},
      {id:"BK-006",title:"A Brief History of Time",author:"Stephen Hawking",category:"Science",year:1988,status:"Available"},
      {id:"BK-007",title:"Noli Me Tangere",author:"José Rizal",category:"Literature",year:1887,status:"Available"},
      {id:"BK-008",title:"The Little Prince",author:"Antoine de Saint-Exupéry",category:"Fiction",year:1943,status:"Borrowed"}
    ];
  }
  $("#loginForm").addEventListener("submit", login);
  $("#logoutBtn").addEventListener("click", logout);
  $("#navigation").addEventListener("click", e => {
    const button = e.target.closest("[data-page]");
    if(button) showPage(button.dataset.page);
  });
  $("#menuToggle").addEventListener("click", () => app.classList.toggle("mobile-open"));
  $("#closeDialog").addEventListener("click", closeBookDialog);
  $("#cancelDialog").addEventListener("click", closeBookDialog);
  $("#bookForm").addEventListener("submit", saveBook);
  $("#keepBook").addEventListener("click", () => confirmDialog.close());
  $("#confirmDelete").addEventListener("click", deleteBook);
}
function login(event){
  event.preventDefault();
  const user = $("#username").value.trim();
  const pass = $("#password").value;
  if(user.toLowerCase() !== "admin" || pass !== "admin"){
    $("#loginError").textContent = "For this demo, use username admin and password admin.";
    return;
  }
  $("#loginError").textContent = "";
  loginScreen.classList.add("hidden"); app.classList.remove("hidden");
  showPage("dashboard");
}
function logout(){app.classList.add("hidden");loginScreen.classList.remove("hidden");$("#password").value="";}
function persistBooks(){localStorage.setItem("pccLibraryBooks",JSON.stringify(books));}
function showPage(page){
  activePage = page;
  app.classList.remove("mobile-open");
  document.querySelectorAll(".nav-item").forEach(b=>b.classList.toggle("active",b.dataset.page===page));
  const labels={dashboard:"Dashboard",books:"Books",borrowed:"Borrowed Books",members:"Students",reports:"Reports",settings:"Settings"};
  $("#breadcrumb").textContent=labels[page]||"Dashboard";
  if(page==="dashboard") renderDashboard();
  else if(page==="books") renderBooks();
  else if(page==="borrowed") renderBorrowed();
  else if(page==="reports") renderReports();
  else if(page==="members") renderMembers();
  else renderSettings();
}
function heading(title,subtitle,action=""){
  return `<div class="page-heading"><div><h1>${title}</h1><p class="muted">${subtitle}</p></div><div class="date-label">${action}</div></div>`;
}
function statusPill(status){const cls=status.toLowerCase().replace(/\s/g,"-");return `<span class="status ${cls}">${status}</span>`;}
function renderDashboard(){
  const available=books.filter(b=>b.status==="Available").length;
  const borrowedCount=books.filter(b=>b.status==="Borrowed").length;
  const total=books.length;
  const recent=borrowed.slice(0,5);
  workspace.innerHTML=heading("Dashboard","Good morning, Admin! Here's your library overview.","Monday, October 6, 2026")+`
    <div class="stats">
      <article class="stat blue"><div class="stat-head"><span>Total Books</span><span class="stat-icon">▤</span></div><div class="number">${total.toLocaleString()}</div></article>
      <article class="stat green"><div class="stat-head"><span>Available Books</span><span class="stat-icon">✓</span></div><div class="number">${available.toLocaleString()}</div></article>
      <article class="stat orange"><div class="stat-head"><span>Borrowed Books</span><span class="stat-icon">▣</span></div><div class="number">${borrowedCount.toLocaleString()}</div></article>
      <article class="stat purple"><div class="stat-head"><span>Overdue Books</span><span class="stat-icon">◷</span></div><div class="number">${borrowed.filter(b=>b.status==="Overdue").length}</div></article>
    </div>
    <div class="activity-grid">
      <section class="panel"><h2>Recent Borrowing Activity</h2><div class="table-wrap"><table><thead><tr><th>Student</th><th>Book ID</th><th>Due Date</th><th>Status</th></tr></thead><tbody>${recent.map(b=>`<tr><td>${escapeHTML(b.student)}</td><td>${b.bookId}</td><td>${b.due}</td><td>${statusPill(b.status)}</td></tr>`).join("")}</tbody></table></div><div class="panel-foot">Latest borrowing records</div></section>
      <section class="panel"><h2>Monthly Borrowing Activity</h2><div class="mini-bars">${[["May",55,86],["Jun",70,112],["Jul",61,96],["Aug",82,132],["Sep",95,151],["Oct",74,118]].map(([m,h,v])=>`<div class="bar-column"><strong>${v}</strong><div class="bar" style="height:${h}%"></div><span>${m}</span></div>`).join("")}</div><div class="legend"><span><i style="background:#ff9b35"></i>Books borrowed</span><span><i style="background:#37ac83"></i>Books returned</span></div></section>
    </div>`;
}
function renderBooks(){
  workspace.innerHTML=heading("Books Management","Manage, search, and update library book records.")+`
  <div class="toolbar"><div class="search-controls"><input id="bookSearch" placeholder="Search title, author, or book ID..." aria-label="Search books"><select id="categoryFilter" aria-label="Filter category"><option value="">All categories</option>${[...new Set(books.map(b=>b.category))].sort().map(c=>`<option>${escapeHTML(c)}</option>`).join("")}</select><select id="statusFilter" aria-label="Filter status"><option value="">All statuses</option><option>Available</option><option>Borrowed</option></select></div><button class="primary" id="addBookBtn">＋ Add New Book</button></div>
  <section class="panel table-panel"><div class="table-title"><h2>Book Records <span class="muted">(${books.length})</span></h2></div><div class="table-wrap"><table><thead><tr><th>Book ID</th><th>Title</th><th>Author</th><th>Category</th><th>Year</th><th>Status</th><th>Actions</th></tr></thead><tbody id="booksRows"></tbody></table></div></section>`;
  $("#bookSearch").addEventListener("input",filterBooks);$("#categoryFilter").addEventListener("change",filterBooks);$("#statusFilter").addEventListener("change",filterBooks);
  $("#addBookBtn").addEventListener("click",()=>openBookDialog());
  filterBooks();
}
function filterBooks(){
  const query=$("#bookSearch").value.toLowerCase(),cat=$("#categoryFilter").value,status=$("#statusFilter").value;
  const list=books.filter(b=>(`${b.id} ${b.title} ${b.author}`.toLowerCase().includes(query))&&(!cat||b.category===cat)&&(!status||b.status===status));
  $("#booksRows").innerHTML=list.length?list.map(b=>`<tr><td>${b.id}</td><td>${escapeHTML(b.title)}</td><td>${escapeHTML(b.author)}</td><td>${escapeHTML(b.category)}</td><td>${b.year}</td><td>${statusPill(b.status)}</td><td><div class="actions"><button class="small-btn" data-action="view" data-id="${b.id}">View</button><button class="small-btn" data-action="edit" data-id="${b.id}">Edit</button><button class="small-btn" data-action="delete" data-id="${b.id}">Delete</button></div></td></tr>`).join(""):`<tr><td colspan="7" class="empty-state">No books match your search.</td></tr>`;
  $("#booksRows").querySelectorAll("button").forEach(btn=>btn.addEventListener("click",()=>rowAction(btn.dataset.action,btn.dataset.id)));
}
function rowAction(action,id){
  const book=books.find(b=>b.id===id);if(!book)return;
  if(action==="edit")openBookDialog(book);
  if(action==="delete"){pendingDelete=id;confirmDialog.showModal();}
  if(action==="view"){
    workspace.innerHTML=heading("Book Details","Full information about the selected book.")+`<section class="panel" style="max-width:700px"><h2>${escapeHTML(book.title)}</h2><div class="simple-list">${detail("Book ID",book.id)}${detail("Author",escapeHTML(book.author))}${detail("Category",escapeHTML(book.category))}${detail("Publication year",book.year)}${detail("Status",statusPill(book.status))}</div><div class="dialog-actions"><button class="secondary" id="backBooks">Back to Books</button><button class="primary" id="detailEdit">Edit Book</button></div></section>`;
    $("#backBooks").onclick=()=>showPage("books");$("#detailEdit").onclick=()=>openBookDialog(book);
  }
}
function detail(label,value){return `<div class="simple-row"><span class="muted">${label}</span><strong>${value}</strong></div>`;}
function openBookDialog(book=null){
  $("#bookForm").reset();$("#bookId").value=book?book.id:"";
  $("#dialogTitle").textContent=book?"Edit Book":"Add New Book";$("#saveBookBtn").textContent=book?"Update Book":"Add Book";
  if(book){$("#title").value=book.title;$("#author").value=book.author;$("#category").value=book.category;$("#year").value=book.year;$("#status").value=book.status;}
  bookDialog.showModal();
}
function closeBookDialog(){bookDialog.close();}
function saveBook(event){
  event.preventDefault();
  const id=$("#bookId").value;
  const record={id:id||nextId(),title:$("#title").value.trim(),author:$("#author").value.trim(),category:$("#category").value,year:Number($("#year").value),status:$("#status").value};
  if(!record.title||!record.author||!Number.isFinite(record.year)){showToast("Please complete all required fields.");return;}
  if(id){books=books.map(b=>b.id===id?record:b);showToast("Book record updated.");}
  else{books.unshift(record);showToast("New book added successfully.");}
  persistBooks();closeBookDialog();showPage(activePage==="dashboard"?"books":activePage);
}
function nextId(){const max=books.reduce((n,b)=>Math.max(n,Number((b.id.match(/\d+/)||["0"])[0])),0);return "BK-"+String(max+1).padStart(3,"0");}
function deleteBook(){
  if(!pendingDelete)return;books=books.filter(b=>b.id!==pendingDelete);persistBooks();pendingDelete=null;confirmDialog.close();showPage("books");showToast("Book deleted.");
}
function renderBorrowed(){
  workspace.innerHTML=heading("Borrowed Books","Monitor current loans, due dates, and overdue records.")+`
  <section class="panel"><div class="toolbar"><div><h2>Borrowing Records</h2><p class="muted">Sample records for interface demonstration.</p></div><select id="borrowFilter" aria-label="Filter borrowing status"><option value="">All statuses</option><option>Borrowed</option><option>Overdue</option><option>Returned</option></select></div><div class="table-wrap"><table><thead><tr><th>Student</th><th>Book</th><th>Borrow Date</th><th>Due Date</th><th>Status</th><th>Action</th></tr></thead><tbody id="borrowRows"></tbody></table></div></section>`;
  const draw=()=>{const filter=$("#borrowFilter").value;const list=borrowed.filter(b=>!filter||b.status===filter);$("#borrowRows").innerHTML=list.map(b=>`<tr><td>${escapeHTML(b.student)}</td><td>${escapeHTML(books.find(x=>x.id===b.bookId)?.title||b.bookId)}</td><td>${b.borrowed}</td><td>${b.due}</td><td>${statusPill(b.status)}</td><td>${b.status!=="Returned"?`<button class="small-btn" data-return="${b.bookId}" data-student="${escapeHTML(b.student)}">Mark Returned</button>`:"—"}</td></tr>`).join("")||`<tr><td colspan="6" class="empty-state">No borrowing records.</td></tr>`;$("#borrowRows").querySelectorAll("[data-return]").forEach(btn=>btn.onclick=()=>{const loan=borrowed.find(x=>x.bookId===btn.dataset.return&&x.student===btn.dataset.student);if(loan)loan.status="Returned";const book=books.find(x=>x.id===btn.dataset.return);if(book)book.status="Available";persistBooks();draw();showToast("Return recorded.");});};
  $("#borrowFilter").onchange=draw;draw();
}
function renderReports(){
  const available=books.filter(b=>b.status==="Available").length,loaned=books.filter(b=>b.status==="Borrowed").length;
  const categories={};books.forEach(b=>categories[b.category]=(categories[b.category]||0)+1);
  workspace.innerHTML=heading("Reports","Library collection and circulation summary.")+`
  <div class="report-kpis"><div class="report-kpi"><span class="muted">Total Books</span><strong>${books.length}</strong></div><div class="report-kpi"><span class="muted">Available Books</span><strong>${available}</strong></div><div class="report-kpi"><span class="muted">Borrowed Books</span><strong>${loaned}</strong></div></div>
  <div class="report-grid"><section class="panel"><h2>Books by Category</h2><div class="simple-list">${Object.entries(categories).sort((a,b)=>b[1]-a[1]).map(([name,count])=>`<div><div class="simple-row"><span>${escapeHTML(name)}</span><strong>${count}</strong></div><div style="height:6px;background:#edf1f5;border-radius:4px;overflow:hidden"><div style="height:100%;width:${Math.max(4,count/books.length*100)}%;background:#ff9b35"></div></div></div>`).join("")}</div></section>
  <section class="panel"><h2>Borrowing Status</h2><div class="simple-list">${detail("Borrowed",borrowed.filter(b=>b.status==="Borrowed").length)}${detail("Overdue",borrowed.filter(b=>b.status==="Overdue").length)}${detail("Returned",borrowed.filter(b=>b.status==="Returned").length)}${detail("Collection categories",Object.keys(categories).length)}</div><button class="secondary" id="exportBtn">Export Book Records (JSON)</button></section></div>`;
  $("#exportBtn").onclick=()=>{const blob=new Blob([JSON.stringify(books,null,2)],{type:"application/json"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="pcc-library-books.json";a.click();URL.revokeObjectURL(url);showToast("Book records exported.");};
}
function renderMembers(){
  const students=[...new Set(borrowed.map(b=>b.student))];
  workspace.innerHTML=heading("Students","Students currently represented in sample borrowing records.")+`<section class="panel"><h2>Student List</h2><div class="table-wrap"><table><thead><tr><th>Student</th><th>Books on Loan</th><th>Overdue Items</th></tr></thead><tbody>${students.map(s=>{const loans=borrowed.filter(b=>b.student===s);return `<tr><td>${escapeHTML(s)}</td><td>${loans.filter(b=>b.status==="Borrowed"||b.status==="Overdue").length}</td><td>${loans.filter(b=>b.status==="Overdue").length}</td></tr>`}).join("")}</tbody></table></div><p class="muted">Student records are demonstration data; this prototype does not authenticate or store real student accounts.</p></section>`;
}
function renderSettings(){
  workspace.innerHTML=heading("Settings","Basic information about this prototype.")+`<section class="panel" style="max-width:720px"><h2>System Information</h2><div class="simple-list">${detail("Institution","Pasig Catholic College")}${detail("Department","College Department Library")}${detail("Interface","HTML, CSS, JavaScript, JSON")}${detail("Record storage","Browser localStorage")}${detail("Demo login","admin / admin")}</div><p class="muted">This front-end prototype stores changes in the browser used to open it. It does not connect to a shared database or provide production-grade user authentication.</p></section>`;
}
function escapeHTML(value){return String(value??"").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));}
let toastTimer;
function showToast(message){const el=$("#toast");el.textContent=message;el.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove("show"),2600);}
initialize();