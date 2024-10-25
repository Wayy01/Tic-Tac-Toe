class TicTacToe {
    constructor() {
        this.board = document.getElementById('board');
        this.cells = document.querySelectorAll('.cell');
        this.restartButton = document.getElementById('restartButton');
        this.playAI = document.getElementById('playAI');
        this.scoreX = document.getElementById('scoreX');
        this.scoreO = document.getElementById('scoreO');
        this.message = document.getElementById('message');
        this.modal = document.getElementById('restartModal');
        this.confirmRestart = document.getElementById('confirmRestart');
        this.cancelRestart = document.getElementById('cancelRestart');
        this.themeToggle = document.getElementById('themeToggle');

        this.currentPlayer = 'X';
        this.gameActive = true;
        this.gameState = ['', '', '', '', '', '', '', '', ''];
        this.scores = { X: 0, O: 0 };
        this.winningConditions = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8],
            [0, 3, 6], [1, 4, 7], [2, 5, 8],
            [0, 4, 8], [2, 4, 6]
        ];

        this.difficultySelect = document.createElement('select');
        this.difficultySelect.innerHTML = `
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
            <option value="impossible">Impossible</option>
        `;
        this.difficultySelect.className = 'difficulty-select';
        
        // Insert difficulty select after AI toggle
        const aiToggle = document.querySelector('.ai-toggle');
        aiToggle.parentNode.insertBefore(this.difficultySelect, aiToggle.nextSibling);

        this.initializeGame();
        this.initializeTheme();
    }

    initializeGame() {
        this.cells.forEach(cell => {
            cell.addEventListener('click', (e) => this.handleCellClick(e));
        });
        this.restartButton.addEventListener('click', () => this.showRestartModal());
        this.confirmRestart.addEventListener('click', () => this.restartGame());
        this.cancelRestart.addEventListener('click', () => this.hideModal());
        window.addEventListener('click', (e) => {
            if (e.target === this.modal) this.hideModal();
        });
    }

    initializeTheme() {
        // Check for saved theme preference or default to 'light'
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        
        this.themeToggle.addEventListener('click', () => this.toggleTheme());
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        
        // Add animation class
        document.documentElement.classList.add('theme-transition');
        setTimeout(() => {
            document.documentElement.classList.remove('theme-transition');
        }, 300);
    }

    handleCellClick(event) {
        const cell = event.target;
        const index = parseInt(cell.getAttribute('data-index'));

        if (this.gameState[index] !== '' || !this.gameActive) return;

        this.gameState[index] = this.currentPlayer;
        cell.textContent = this.currentPlayer;
        cell.classList.add('filled');

        if (this.checkWin()) {
            this.handleWin();
            return;
        }

        if (this.checkDraw()) {
            this.handleDraw();
            return;
        }

        this.currentPlayer = this.currentPlayer === 'X' ? 'O' : 'X';
        this.message.textContent = `Player ${this.currentPlayer}'s turn`;

        if (this.playAI.checked && this.currentPlayer === 'O') {
            setTimeout(() => this.makeAIMove(), 500);
        }
    }

    makeAIMove() {
        if (!this.gameActive) return;

        let move;
        const difficulty = this.difficultySelect.value;

        switch(difficulty) {
            case 'easy':
                move = this.getRandomMove();
                break;
            case 'medium':
                // 70% optimal, 30% random
                move = Math.random() < 0.7 ? this.getStrategicMove() : this.getRandomMove();
                break;
            case 'hard':
                // 90% optimal, 10% strategic
                move = Math.random() < 0.9 ? this.getBestMove() : this.getStrategicMove();
                break;
            case 'impossible':
                move = this.getBestMove();
                break;
            default:
                move = this.getRandomMove();
        }

        setTimeout(() => {
            this.makeMove(move);
        }, 500);
    }

    makeMove(position) {
        this.gameState[position] = this.currentPlayer;
        this.cells[position].textContent = this.currentPlayer;
        this.cells[position].classList.add('filled');

        if (this.checkWin()) {
            this.handleWin();
            return;
        }

        if (this.checkDraw()) {
            this.handleDraw();
            return;
        }

        this.currentPlayer = this.currentPlayer === 'X' ? 'O' : 'X';
        this.message.textContent = `Player ${this.currentPlayer}'s turn`;
    }

    getBestMove() {
        // First move optimization
        if (this.gameState.every(cell => cell === '')) {
            const corners = [0, 2, 6, 8];
            return corners[Math.floor(Math.random() * corners.length)];
        }

        let bestScore = -Infinity;
        let bestMove = null;
        let alpha = -Infinity;
        let beta = Infinity;

        for (let i = 0; i < 9; i++) {
            if (this.gameState[i] === '') {
                this.gameState[i] = 'O';
                let score = this.minimax(this.gameState, 0, false, alpha, beta);
                this.gameState[i] = '';

                if (score > bestScore) {
                    bestScore = score;
                    bestMove = i;
                }
                alpha = Math.max(alpha, bestScore);
            }
        }

        return bestMove;
    }

    minimax(board, depth, isMaximizing, alpha, beta) {
        // Terminal states checking
        const result = this.checkGameState();
        if (result !== null) {
            return result;
        }

        if (isMaximizing) {
            let maxScore = -Infinity;
            for (let i = 0; i < 9; i++) {
                if (board[i] === '') {
                    board[i] = 'O';
                    let score = this.minimax(board, depth + 1, false, alpha, beta);
                    board[i] = '';
                    maxScore = Math.max(score, maxScore);
                    alpha = Math.max(alpha, score);
                    if (beta <= alpha) break; // Alpha-Beta pruning
                }
            }
            return maxScore;
        } else {
            let minScore = Infinity;
            for (let i = 0; i < 9; i++) {
                if (board[i] === '') {
                    board[i] = 'X';
                    let score = this.minimax(board, depth + 1, true, alpha, beta);
                    board[i] = '';
                    minScore = Math.min(score, minScore);
                    beta = Math.min(beta, score);
                    if (beta <= alpha) break; // Alpha-Beta pruning
                }
            }
            return minScore;
        }
    }

    checkGameState() {
        // Check for winner
        if (this.checkWinningCondition('O')) return 10;
        if (this.checkWinningCondition('X')) return -10;
        
        // Check for draw
        if (!this.gameState.includes('')) return 0;
        
        return null;
    }

    getStrategicMove() {
        // Priority 1: Win if possible
        const winMove = this.findWinningMove('O');
        if (winMove !== null) return winMove;

        // Priority 2: Block opponent's win
        const blockMove = this.findWinningMove('X');
        if (blockMove !== null) return blockMove;

        // Priority 3: Take center
        if (this.gameState[4] === '') return 4;

        // Priority 4: Create fork opportunity
        const forkMove = this.findForkMove('O');
        if (forkMove !== null) return forkMove;

        // Priority 5: Block opponent's fork
        const blockForkMove = this.findForkMove('X');
        if (blockForkMove !== null) return blockForkMove;

        // Priority 6: Take opposite corner
        const oppositeCornerMove = this.findOppositeCorner();
        if (oppositeCornerMove !== null) return oppositeCornerMove;

        // Priority 7: Take any corner
        const cornerMove = this.findEmptyCorner();
        if (cornerMove !== null) return cornerMove;

        // Priority 8: Take any side
        return this.findEmptySide();
    }

    findForkMove(player) {
        const corners = [0, 2, 6, 8];
        const sides = [1, 3, 5, 7];

        // Check for fork opportunities
        for (let i = 0; i < 9; i++) {
            if (this.gameState[i] === '') {
                this.gameState[i] = player;
                let winningMoves = 0;
                
                // Count potential winning moves after this move
                for (let j = 0; j < 9; j++) {
                    if (this.gameState[j] === '') {
                        this.gameState[j] = player;
                        if (this.checkWinningCondition(player)) winningMoves++;
                        this.gameState[j] = '';
                    }
                }
                
                this.gameState[i] = '';
                if (winningMoves >= 2) return i;
            }
        }
        
        return null;
    }

    findOppositeCorner() {
        const oppositeCorners = [[0, 8], [2, 6]];
        for (let [corner1, corner2] of oppositeCorners) {
            if (this.gameState[corner1] === 'X' && this.gameState[corner2] === '') return corner2;
            if (this.gameState[corner2] === 'X' && this.gameState[corner1] === '') return corner1;
        }
        return null;
    }

    findEmptyCorner() {
        const corners = [0, 2, 6, 8];
        const emptyCorners = corners.filter(corner => this.gameState[corner] === '');
        return emptyCorners.length > 0 ? emptyCorners[Math.floor(Math.random() * emptyCorners.length)] : null;
    }

    findEmptySide() {
        const sides = [1, 3, 5, 7];
        const emptySides = sides.filter(side => this.gameState[side] === '');
        return emptySides.length > 0 ? emptySides[Math.floor(Math.random() * emptySides.length)] : null;
    }

    findWinningMove(player) {
        // Check each cell
        for (let i = 0; i < 9; i++) {
            if (this.gameState[i] === '') {
                // Try the move
                this.gameState[i] = player;
                // Check if this move would win
                if (this.checkWinningCondition(player)) {
                    // Undo the move and return this position
                    this.gameState[i] = '';
                    return i;
                }
                // Undo the move
                this.gameState[i] = '';
            }
        }
        return null;
    }

    checkWinningCondition(player) {
        return this.winningConditions.some(condition => {
            return condition.every(index => this.gameState[index] === player);
        });
    }

    getRandomMove() {
        const availableMoves = this.gameState
            .map((cell, index) => cell === '' ? index : null)
            .filter(cell => cell !== null);
        return availableMoves[Math.floor(Math.random() * availableMoves.length)];
    }

    checkWin() {
        for (let condition of this.winningConditions) {
            if (condition.every(index => this.gameState[index] === this.currentPlayer)) {
                condition.forEach(index => this.cells[index].classList.add('winner'));
                this.drawWinningLine(condition);
                return true;
            }
        }
        return false;
    }

    drawWinningLine(condition) {
        const [a, b, c] = condition;
        const line = document.createElement('div');
        line.classList.add('winning-line');
        
        const cellSize = this.cells[0].offsetWidth;
        const gap = 10; // Gap between cells
        const boardRect = this.board.getBoundingClientRect();
        const firstCellRect = this.cells[a].getBoundingClientRect();
        
        // Determine line type and position
        if (a % 3 === 0 && b % 3 === 1) { // Horizontal
            line.classList.add('horizontal');
            const y = (Math.floor(a / 3) * (cellSize + gap)) + (cellSize / 2);
            line.style.width = `${(cellSize * 3) + (gap * 2)}px`;
            line.style.top = `${y}px`;
            line.style.left = '0';
        } 
        else if (a - b === -3) { // Vertical
            line.classList.add('vertical');
            const x = ((a % 3) * (cellSize + gap)) + (cellSize / 2);
            line.style.height = `${(cellSize * 3) + (gap * 2)}px`;
            line.style.left = `${x}px`;
            line.style.top = '0';
        }
        else { // Diagonal
            line.classList.add('diagonal');
            line.style.width = `${Math.sqrt(2) * ((cellSize * 3) + (gap * 2))}px`;
            line.style.top = `${(cellSize * 1.5) + gap}px`;
            line.style.left = `${-gap}px`;
            
            if (a === 0) { // Top-left to bottom-right
                line.style.transform = 'rotate(45deg)';
                line.style.transformOrigin = 'left center';
            } else { // Top-right to bottom-left
                line.style.transform = 'rotate(-45deg)';
                line.style.transformOrigin = 'right center';
                line.style.left = 'auto';
                line.style.right = `${-gap}px`;
            }
        }
        
        this.board.appendChild(line);
    }

    checkDraw() {
        return !this.gameState.includes('');
    }

    handleWin() {
        this.message.textContent = `Player ${this.currentPlayer} wins!`;
        this.scores[this.currentPlayer]++;
        this.updateScores();
        this.gameActive = false;
    }

    handleDraw() {
        this.message.textContent = 'Game ended in a draw!';
        this.gameActive = false;
    }

    updateScores() {
        this.scoreX.textContent = this.scores.X;
        this.scoreO.textContent = this.scores.O;
    }

    showRestartModal() {
        this.modal.style.display = 'flex';
    }

    hideModal() {
        this.modal.style.display = 'none';
    }

    restartGame() {
        this.currentPlayer = 'X';
        this.gameActive = true;
        this.gameState = ['', '', '', '', '', '', '', '', ''];
        this.cells.forEach(cell => {
            cell.textContent = '';
            cell.classList.remove('filled', 'winner');
        });
        // Remove winning line if it exists
        const winningLine = this.board.querySelector('.winning-line');
        if (winningLine) {
            winningLine.remove();
        }
        this.message.textContent = `Player ${this.currentPlayer}'s turn`;
        this.hideModal();
    }
}

// Initialize the game
document.addEventListener('DOMContentLoaded', () => {
    new TicTacToe();
});
