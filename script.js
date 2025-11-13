document.addEventListener('DOMContentLoaded', () => {
    // --- ELEMENTOS DO DOM ---
    const robot = document.getElementById('robot');
    const mapGrid = document.getElementById('map-grid');
    // Tabuleiros e Slots
    const mainBoardSlots = document.querySelectorAll('#main-board .slot');
    const functionBoardSlots = document.querySelectorAll('#function-board .slot');
    // Botões de Ação
    const runBtn = document.getElementById('run-button');
    const resetBtn = document.getElementById('reset-button');
    // Botões de Comando
    const addForwardBtn = document.getElementById('add-forward');
    const addLeftBtn = document.getElementById('add-left');
    const addRightBtn = document.getElementById('add-right');
    const addFunctionBtn = document.getElementById('add-function');
    const addFwdFuncBtn = document.getElementById('add-fwd-func');
    const addLeftFuncBtn = document.getElementById('add-left-func');
    const addRightFuncBtn = document.getElementById('add-right-func');

    const allCommandButtons = [addForwardBtn, addLeftBtn, addRightBtn, addFunctionBtn, addFwdFuncBtn, addLeftFuncBtn, addRightFuncBtn];

    // --- CONFIGURAÇÕES E ESTADO INICIAL ---
    const GRID_SIZE = 6;
    const BORDER_OFFSET_RATIO = 80 / 2025;
    const ROBOT_SCALE_FACTOR = 0.7;
    const MOVE_DELAY_MS = 850; 

    let robotState = { x: 0, y: 0, dir: 2 };
    let commandQueue = [];
    let functionQueue = [];

    // --- FUNÇÕES DE RENDERIZAÇÃO E UI ---

    function renderBoard(slots, queue) {
        slots.forEach((slot, index) => {
            slot.innerHTML = ''; // Limpa o slot
            if (index < queue.length) {
                const command = queue[index];
                const block = document.createElement('div');
                block.classList.add('instruction-block');
                if (command === 'forward') block.style.backgroundColor = 'var(--color-forward)';
                else if (command === 'left') block.style.backgroundColor = 'var(--color-left)';
                else if (command === 'right') block.style.backgroundColor = 'var(--color-right)';
                else if (command === 'function') block.style.backgroundColor = 'var(--color-function)';
                slot.appendChild(block);
            }
        });
    }

    function updateRobotPosition() {
        const mapContainerWidth = mapGrid.clientWidth;
        const borderOffset = mapContainerWidth * BORDER_OFFSET_RATIO;
        const gridAreaWidth = mapContainerWidth - (2 * borderOffset);
        const cellSize = gridAreaWidth / GRID_SIZE;
        const centeringOffset = (cellSize * (1 - ROBOT_SCALE_FACTOR)) / 2;
        const finalLeft = borderOffset + (robotState.x * cellSize) + centeringOffset;
        const finalTop = borderOffset + (robotState.y * cellSize) + centeringOffset;
        robot.style.setProperty('--current-rotation', `${robotState.dir * 90}deg`);
        robot.style.left = `${finalLeft}px`;
        robot.style.top = `${finalTop}px`;
        robot.style.transform = `rotate(${robotState.dir * 90}deg)`;
    }
    
    function toggleButtons(enabled) {
        runBtn.disabled = !enabled;
        allCommandButtons.forEach(btn => btn.disabled = !enabled);
    }

    // --- LÓGICA DA SIMULAÇÃO ---

    function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

    async function handleInvalidMove() {
        robot.classList.add('shake-animation');
        await sleep(500);
        robot.classList.remove('shake-animation');
        await sleep(200);
        resetSimulation();
    }

    function moveForward() {
        let newX = robotState.x, newY = robotState.y;
        if (robotState.dir === 0) newY--;
        else if (robotState.dir === 1) newX++;
        else if (robotState.dir === 2) newY++;
        else if (robotState.dir === 3) newX--;
        if (newX >= 0 && newX < GRID_SIZE && newY >= 0 && newY < GRID_SIZE) {
            robotState.x = newX;
            robotState.y = newY;
            return true;
        }
        return false;
    }

    async function executeSingleCommand(command) {
        let moveOk = true;
        switch (command) {
            case 'forward':
                if (!moveForward()) {
                    await handleInvalidMove();
                    moveOk = false;
                }
                break;
            case 'left':
                robotState.dir = (robotState.dir - 1 + 4) % 4;
                break;
            case 'right':
                robotState.dir = (robotState.dir + 1) % 4;
                break;
        }
        if (moveOk) {
            updateRobotPosition();
            await sleep(MOVE_DELAY_MS);
        }
        return moveOk;
    }

    async function runSimulation() {
        toggleButtons(false);
        runBtn.disabled = true;
        resetBtn.disabled = true;
        let simulationAborted = false;
        for (const command of commandQueue) {
            let executionOk;
            if (command === 'function') {
                for (const funcCommand of functionQueue) {
                    executionOk = await executeSingleCommand(funcCommand);
                    if (!executionOk) { simulationAborted = true; break; }
                }
            } else {
                executionOk = await executeSingleCommand(command);
            }
            if (!executionOk || simulationAborted) { simulationAborted = true; break; }
        }
        if (!simulationAborted) { resetBtn.disabled = false; }
    }

    function resetSimulation() {
        commandQueue = [];
        functionQueue = [];
        renderBoard(mainBoardSlots, commandQueue);
        renderBoard(functionBoardSlots, functionQueue);
        robotState = { x: 0, y: 0, dir: 2 };
        updateRobotPosition();
        toggleButtons(true);
        resetBtn.disabled = false;
    }

    // --- EVENT LISTENERS ---
    addForwardBtn.addEventListener('click', () => { if (commandQueue.length < 12) { commandQueue.push('forward'); renderBoard(mainBoardSlots, commandQueue); } });
    addLeftBtn.addEventListener('click', () => { if (commandQueue.length < 12) { commandQueue.push('left'); renderBoard(mainBoardSlots, commandQueue); } });
    addRightBtn.addEventListener('click', () => { if (commandQueue.length < 12) { commandQueue.push('right'); renderBoard(mainBoardSlots, commandQueue); } });
    addFunctionBtn.addEventListener('click', () => { if (commandQueue.length < 12) { commandQueue.push('function'); renderBoard(mainBoardSlots, commandQueue); } });
    
    addFwdFuncBtn.addEventListener('click', () => { if (functionQueue.length < 4) { functionQueue.push('forward'); renderBoard(functionBoardSlots, functionQueue); } });
    addLeftFuncBtn.addEventListener('click', () => { if (functionQueue.length < 4) { functionQueue.push('left'); renderBoard(functionBoardSlots, functionQueue); } });
    addRightFuncBtn.addEventListener('click', () => { if (functionQueue.length < 4) { functionQueue.push('right'); renderBoard(functionBoardSlots, functionQueue); } });

    runBtn.addEventListener('click', runSimulation);
    resetBtn.addEventListener('click', resetSimulation);
    window.addEventListener('resize', updateRobotPosition);

    // --- INICIALIZAÇÃO ---
    resetSimulation();
});