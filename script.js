/* Water Sort Puzzle - Vanilla JS
 Features:
 - Levels (sets of colors & number of tubes)
 - Capacity adjustable
 - Click/tap source then target to pour
 - Undo, Shuffle, Reset, New Game
 - Win detection
*/
(() => {
 // --- Config / Levels ---
 const LEVELS = [
 { name: "Easy 1", colors: 3, extraEmpty: 2 },
 { name: "Easy 2", colors: 4, extraEmpty: 2 },
 { name: "Medium 1", colors: 5, extraEmpty: 2 },
 { name: "Medium 2", colors: 6, extraEmpty: 3 },
 { name: "Hard 1", colors: 7, extraEmpty: 3 },
 { name: "Expert", colors: 8, extraEmpty: 4 }
 ];
 const PALETTE = ["c1","c2","c3","c4","c5","c6","c7","c8","c9","c10"];
 // --- State ---
 let capacity = 4;
 let tubes = []; // array of arrays: bottom->top (index 0 bottom)
 let initialTubes = null;
 let selected = null;
 let undoStack = [];
 let levelIndex = 0;
 // --- DOM ---
 const gameArea = document.getElementById("gameArea");
 const messageEl = document.getElementById("message");
 const newBtn = document.getElementById("newBtn");
 const shuffleBtn = document.getElementById("shuffleBtn");
 const undoBtn = document.getElementById("undoBtn");
 const resetBtn = document.getElementById("resetBtn");
 const levelSelect = document.getElementById("levelSelect");
 const capacityInput = document.getElementById("capacityInput");
 // populate level select
 LEVELS.forEach((l,i) => {
 const opt = document.createElement("option");
 opt.value = i;
 opt.textContent = l.name + ` (${l.colors} colors)`;
 levelSelect.appendChild(opt);
 });
 // --- Helpers ---
 function cloneTubes(arr){
 return arr.map(t => t.slice());
 }
 function setMessage(text, isWin=false){
 messageEl.textContent = text || "";
 messageEl.classList.toggle("win", !!isWin);
 }
 function countTopSame(arr, idx){
 const t = arr[idx];
 if (!t.length) return 0;
 const top = t[t.length-1];
 let count = 0;
 for (let i=t.length-1;i>=0;i--){
 if (t[i] === top) count++;
 else break;
 }
 return count;
 }
 function canPour(fromIdx, toIdx){
 if (fromIdx === toIdx) return false;
 const from = tubes[fromIdx], to = tubes[toIdx];
 if (!from.length) return false;
 const color = from[from.length-1];
 if (!to.length) return to.length < capacity;
 const topTo = to[to.length-1];
 if (topTo !== color) return false;
 return to.length < capacity;
 }
 function isSolved(){
 return tubes.every(t => {
 return t.length === 0 || (t.length === capacity && t.every(c => c === t[0]));
 });
 }
 function render(){
 gameArea.innerHTML = "";
 const total = tubes.length;
 tubes.forEach((tube, idx) => {
 const tdiv = document.createElement("div");
 tdiv.className = "tube";
 tdiv.dataset.idx = idx;
 if (selected === idx) tdiv.classList.add("selected");
 const neck = document.createElement("div");
 neck.className = "neck";
 tdiv.appendChild(neck);
 const stack = document.createElement("div");
 stack.className = "stack";
 // segment height adjusts with capacity
 const segHeight = Math.max(24, Math.floor((200 - 12) / capacity) - 4);
 // build from bottom to top visually but stack displays column-reverse
 // We'll fill empty segments visibly as empty when less than capacity
 const filled = tube.length;
 for (let i=0;i<filled;i++){
 const seg = document.createElement("div");
 seg.className = `segment ${tube[i]}`;
 seg.style.height = segHeight + "px";
 stack.appendChild(seg);
 }
 // show empty placeholders for remaining capacity
 for (let i=0;i<capacity-filled;i++){
 const seg = document.createElement("div");
 seg.className = `segment empty`;
 seg.style.height = segHeight + "px";
 stack.appendChild(seg);
 }
 tdiv.appendChild(stack);
 // click handlers
 tdiv.addEventListener("click", () => onTubeClick(idx));
 // allow tapping on mobile with touchstart too (immediate)
 tdiv.addEventListener("touchstart", (e) => {
 e.preventDefault();
 onTubeClick(idx);
 }, {passive:false});
 gameArea.appendChild(tdiv);
 });
 // update buttons
 undoBtn.disabled = undoStack.length === 0;
 setMessage(isSolved() ? "■ You solved it! Great job!" : "");
 if (isSolved()) {
 // small visual effect: add glow to all tubes
 document.querySelectorAll(".tube").forEach(t => t.classList.add("selected"));
 }
 }
 // --- Game logic: pour ---
 function pour(fromIdx, toIdx){
 if (!canPour(fromIdx,toIdx)) return false;
 const from = tubes[fromIdx];
 const to = tubes[toIdx];
 const color = from[from.length-1];
 // how many contiguous same color on top of source
 let count = 0;
 for (let i=from.length-1;i>=0;i--){
 if (from[i] === color) count++;
 else break;
 }
 const space = capacity - to.length;
 const amount = Math.min(count, space);
 const moved = [];
 for (let i=0;i<amount;i++){
 moved.push(from.pop());
 }
 // push in same order to maintain stack (bottom->top)
 for (let i=moved.length-1;i>=0;i--){
 to.push(moved[i]);
 }
 // record undo
 undoStack.push({ from: fromIdx, to: toIdx, count: amount });
 selected = null;
 render();
 return true;
 }
 function undo(){
 if (!undoStack.length) return;
 const last = undoStack.pop();
 const { from, to, count } = last;
 // reverse move: move 'count' from 'to' back to 'from'
 const moved = [];
 for (let i=0;i<count;i++){
 moved.push(tubes[to].pop());
 }
 for (let i=moved.length-1;i>=0;i--){
 tubes[from].push(moved[i]);
 }
 render();
 }
 // --- Shuffle/Generate ---
 function shuffleColors(arr){
 // Fisher-Yates
 for (let i = arr.length - 1; i > 0; i--) {
 const j = Math.floor(Math.random() * (i + 1));
 [arr[i], arr[j]] = [arr[j], arr[i]];
 }
 }
 function createLevel(levelIdx){
 levelIndex = levelIdx;
 const level = LEVELS[levelIdx];
 const colorsCount = level.colors;
 const emptyCount = level.extraEmpty;
 const totalTubes = colorsCount + emptyCount;
 const pool = [];
 // create color pool: each color repeats 'capacity' times
 for (let colorId=0;colorId<colorsCount;colorId++){
 const className = PALETTE[colorId % PALETTE.length];
 for (let k=0;k<capacity;k++){
 pool.push(className);
 }
 }
 // shuffle pool and distribute into tubes
 shuffleColors(pool);
 const result = [];
 for (let i=0;i<totalTubes;i++){
 result.push([]);
 }
 // fill tubes sequentially bottom to top
 let tubeIndex = 0;
 for (let i=0;i<pool.length;i++){
 result[tubeIndex].push(pool[i]);
 if (result[tubeIndex].length === capacity) tubeIndex++;
 }
 // last tubes remain empty
 tubes = result;
 initialTubes = cloneTubes(tubes);
 undoStack = [];
 selected = null;
 render();
 }
 // --- Shuffle function (maintain solvability heuristic) ---
 function shuffleGame(){
 // We'll shuffle by performing many valid random moves from a solved-ish distribution
 // Strategy: take current tubes, perform random legal pour moves many times
 // This avoids creating impossible puzzles in most practical cases.
 const moves = 200 + Math.floor(Math.random()*150);
 for (let i=0;i<moves;i++){
 const from = Math.floor(Math.random()*tubes.length);
 const to = Math.floor(Math.random()*tubes.length);
 if (canPour(from,to)){
 // perform without recording undo (clear undo after)
 const fromArr = tubes[from], toArr = tubes[to];
 const color = fromArr[fromArr.length-1];
 let count = 0;
 for (let j=fromArr.length-1;j>=0;j--){
 if (fromArr[j] === color) count++; else break;
 }
 const amount = Math.min(count, capacity - toArr.length);
 for (let k=0;k<amount;k++){
 toArr.push(fromArr.pop());
 }
 }
 }
 undoStack = [];
 selected = null;
 // small final shuffle: random swap between tubes preserving contents
 shuffleColors(tubes);
 render();
 }
 // --- UI Handlers ---
 function onTubeClick(idx){
 if (isSolved()) return;
 if (selected === null){
 // select only if has liquid
 if (tubes[idx].length === 0) {
 // selecting empty tube is allowed (you can pick empty to target pour from earlier selection
 selected = idx;
 render();
 return;
 }
 selected = idx;
 render();
 return;
 }
 // if a tube is already selected and clicked same -> deselect
 if (selected === idx){
 selected = null;
 render();
 return;
 }
 // attempt pour from selected -> idx
 const did = pour(selected, idx);
 if (!did){
 // if invalid, but the clicked tube has liquid, switch selection to that tube
 if (tubes[idx].length > 0){
 selected = idx;
 } else {
 // invalid move, keep selection
 flashInvalid(idx);
 }
 } else {
 // successful pour
 if (isSolved()){
 setMessage("■ You solved it! Great job!", true);
 } else {
 setMessage("");
 }
 }
 render();
 }
 function flashInvalid(idx){
 const el = document.querySelector(`.tube[data-idx="${idx}"]`);
 if (!el) return;
 el.style.transform = "translateY(-4px) rotate(-2deg)";
 setTimeout(()=> el.style.transform = "", 140);
 }
 // --- Events ---
 newBtn.addEventListener("click", () => {
 const li = parseInt(levelSelect.value,10);
 createLevel(li);
 });
 shuffleBtn.addEventListener("click", () => {
 shuffleGame();
 });
 undoBtn.addEventListener("click", () => {
 undo();
 });
 resetBtn.addEventListener("click", () => {
 if (initialTubes) tubes = cloneTubes(initialTubes);
 undoStack = [];
 selected = null;
 render();
 });
 levelSelect.addEventListener("change", (e) => {
 // create immediately on level change
 createLevel(parseInt(e.target.value,10));
 });
 capacityInput.addEventListener("change", (e) => {
 let v = parseInt(e.target.value,10);
 if (!v || v < 3) v = 3;
 if (v > 6) v = 6;
 capacity = v;
 capacityInput.value = capacity;
 // recreate current level with new capacity
 createLevel(parseInt(levelSelect.value,10));
 });
 // keyboard undo (Ctrl+Z or 'u')
 document.addEventListener("keydown", (e) => {
 if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') undo();
 if (e.key.toLowerCase() === 'u') undo();
 });
 // --- initialize ---
 function init(){
 capacity = parseInt(capacityInput.value,10) || 4;
 levelSelect.value = 0;
 createLevel(0);
 }
 init();
})();