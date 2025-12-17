/*
 * File: script.js
 * Author: Kaden Gardiner
 * Email: kaden_gardiner@student.uml.edu
 * Date: December 2025
 * Description: Main JavaScript file for one-line Scrabble game. Handles all game logic
 *              including drag-and-drop, scoring, tile distribution, and game state.
 * Assignment: HW5 - Scrabble
 *
 * Sources:
 * - jQuery UI for drag-and-drop: https://jqueryui.com/
 */

// This is the main data structure for all Scrabble tiles
// Each letter has a point value, how many exist in the game (original-distribution),
// and how many are left to draw (number-remaining)
var ScrabbleTiles = {
    "A": { "value": 1, "original-distribution": 9, "number-remaining": 9 },
    "B": { "value": 3, "original-distribution": 2, "number-remaining": 2 },
    "C": { "value": 3, "original-distribution": 2, "number-remaining": 2 },
    "D": { "value": 2, "original-distribution": 4, "number-remaining": 4 },
    "E": { "value": 1, "original-distribution": 12, "number-remaining": 12 },
    "F": { "value": 4, "original-distribution": 2, "number-remaining": 2 },
    "G": { "value": 2, "original-distribution": 3, "number-remaining": 3 },
    "H": { "value": 4, "original-distribution": 2, "number-remaining": 2 },
    "I": { "value": 1, "original-distribution": 9, "number-remaining": 9 },
    "J": { "value": 8, "original-distribution": 1, "number-remaining": 1 },
    "K": { "value": 5, "original-distribution": 1, "number-remaining": 1 },
    "L": { "value": 1, "original-distribution": 4, "number-remaining": 4 },
    "M": { "value": 3, "original-distribution": 2, "number-remaining": 2 },
    "N": { "value": 1, "original-distribution": 6, "number-remaining": 6 },
    "O": { "value": 1, "original-distribution": 8, "number-remaining": 8 },
    "P": { "value": 3, "original-distribution": 2, "number-remaining": 2 },
    "Q": { "value": 10, "original-distribution": 1, "number-remaining": 1 },
    "R": { "value": 1, "original-distribution": 6, "number-remaining": 6 },
    "S": { "value": 1, "original-distribution": 4, "number-remaining": 4 },
    "T": { "value": 1, "original-distribution": 6, "number-remaining": 6 },
    "U": { "value": 1, "original-distribution": 4, "number-remaining": 4 },
    "V": { "value": 4, "original-distribution": 2, "number-remaining": 2 },
    "W": { "value": 4, "original-distribution": 2, "number-remaining": 2 },
    "X": { "value": 8, "original-distribution": 1, "number-remaining": 1 },
    "Y": { "value": 4, "original-distribution": 2, "number-remaining": 2 },
    "Z": { "value": 10, "original-distribution": 1, "number-remaining": 1 },
    "_": { "value": 0, "original-distribution": 2, "number-remaining": 2 }  // Blank tile
};

// Game state object - keeps track of scores and what tiles the player has
var gameState = {
    totalScore: 0,           // Total score across all submitted words
    currentWordScore: 0,     // Score for the word currently on the board
    playerTiles: []          // Array of letters the player currently has
};

// When the page loads, start the game
$(document).ready(function() {
    initGame();
    setupEventHandlers();
});

// Initialize the game - deal tiles and update displays
function initGame() {
    dealTiles();
    updateScoreDisplay();
    updateTilesRemaining();
}

// Deal tiles to the player - we always want 7 tiles total
function dealTiles() {
    // Figure out how many tiles we need to deal
    var tilesToDeal = 7 - gameState.playerTiles.length;

    // Deal that many tiles
    for (var i = 0; i < tilesToDeal; i++) {
        var letter = getRandomTile();
        if (letter) {
            gameState.playerTiles.push(letter);
            addTileToRack(letter);
        }
    }
    updateTilesRemaining();
}

// Get a random tile from the bag
// This mimics drawing a random tile from the Scrabble bag
function getRandomTile() {
    var availableLetters = [];

    // Build an array with all available letters
    // If there are 9 A's left, we add 'A' to the array 9 times
    for (var letter in ScrabbleTiles) {
        var count = ScrabbleTiles[letter]["number-remaining"];
        for (var i = 0; i < count; i++) {
            availableLetters.push(letter);
        }
    }

    // Check if we're out of tiles
    if (availableLetters.length === 0) {
        showMessage("No more tiles available!", "error");
        return null;
    }

    // Pick a random index from the available letters
    var randomIndex = Math.floor(Math.random() * availableLetters.length);
    var selectedLetter = availableLetters[randomIndex];

    // Decrease the count for this letter since we just drew it
    ScrabbleTiles[selectedLetter]["number-remaining"]--;

    return selectedLetter;
}

// Add a tile to the rack on screen
function addTileToRack(letter) {
    // Create a new div for the tile
    var tileDiv = $('<div></div>')
        .addClass('tile')
        .attr('data-letter', letter)  // Store the letter in the div
        .attr('data-value', ScrabbleTiles[letter].value);  // Store point value

    // Create an image element for the tile graphic
    var img = $('<img>')
        .attr('src', 'graphics_data/Scrabble_Tile_' + letter + '.jpg')
        .attr('alt', letter);

    // Put the image inside the tile div
    tileDiv.append(img);
    // Add the tile to the rack
    $('#tile-rack').append(tileDiv);

    // Make the tile draggable using jQuery UI
    makeTileDraggable(tileDiv);
}

// Make a tile draggable using jQuery UI
function makeTileDraggable(tile) {
    tile.draggable({
        revert: "invalid",        // Snap back if not dropped on valid target
        snap: ".board-square",    // Snap to board squares when nearby
        snapMode: "inner",        // Snap to inside of the square
        snapTolerance: 20,        // How close before snapping
        cursor: "move",           // Change cursor while dragging
        start: function() {
            // When we start dragging, put tile on top of everything
            $(this).css('z-index', 1000);
        }
    });
}

// Setup droppable areas (board squares and rack)
function setupDroppableSquares() {
    // Make each board square accept dropped tiles
    $('.board-square').droppable({
        accept: '.tile',
        drop: function(event, ui) {
            var square = $(this);
            var tile = ui.draggable;

            // Don't allow dropping on a square that already has a tile
            if (square.children('.tile').length > 0) {
                return false;
            }

            // Center the tile in the square
            tile.position({
                my: "center",
                at: "center",
                of: square
            });

            // Move the tile from wherever it was to this square
            tile.detach().appendTo(square);

            // Adjust tile size and position for the board square
            tile.css({
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '70px',
                height: '70px'
            });

            // Keep it draggable so user can move it back
            tile.draggable('option', 'revert', 'invalid');

            // Recalculate the score since we added a tile
            calculateScore();
        }
    });

    // Make the rack droppable too, so tiles can be returned
    $('#tile-rack').droppable({
        accept: '.tile',
        drop: function(event, ui) {
            var tile = ui.draggable;

            // Reset tile to rack size and styling
            tile.css({
                position: 'relative',
                top: 'auto',
                left: 'auto',
                transform: 'none',
                width: '75px',
                height: '75px'
            });

            // Move tile back to rack
            tile.detach().appendTo('#tile-rack');

            // Recalculate score since we removed a tile from board
            calculateScore();
        }
    });
}

// Calculate the score for tiles currently on the board
// This is the main scoring algorithm for Scrabble
function calculateScore() {
    var score = 0;
    var wordMultiplier = 1;  // Starts at 1, gets multiplied by 2 or 3 for word bonuses
    var tilesOnBoard = [];

    // Go through each square on the board and collect tiles
    $('.board-square').each(function() {
        var tile = $(this).find('.tile');
        if (tile.length > 0) {
            var letter = tile.attr('data-letter');
            var value = parseInt(tile.attr('data-value'));
            var bonus = $(this).attr('data-bonus');

            tilesOnBoard.push({
                letter: letter,
                value: value,
                bonus: bonus
            });
        }
    });

    // Now calculate the score
    // Letter bonuses apply to individual tiles, word bonuses apply to total
    tilesOnBoard.forEach(function(tileInfo) {
        var tileScore = tileInfo.value;

        // Apply letter multipliers directly to the tile score
        if (tileInfo.bonus === 'double-letter') {
            tileScore *= 2;
        } else if (tileInfo.bonus === 'triple-letter') {
            tileScore *= 3;
        }
        // Word multipliers get saved and applied at the end
        else if (tileInfo.bonus === 'double-word') {
            wordMultiplier *= 2;
        } else if (tileInfo.bonus === 'triple-word') {
            wordMultiplier *= 3;
        }

        score += tileScore;
    });

    // Apply word multiplier last (this is important for Scrabble rules!)
    score *= wordMultiplier;

    // Update the game state and display
    gameState.currentWordScore = score;
    updateScoreDisplay();
}

// Setup all the button click handlers
function setupEventHandlers() {
    // First setup the droppable areas
    setupDroppableSquares();

    // Submit word button - finalizes the word and adds to total score
    $('#submit-word').click(function() {
        submitWord();
    });

    // Clear board button - returns all tiles to rack without scoring
    $('#clear-board').click(function() {
        clearBoard();
    });

    // New tiles button - deals more tiles (if player has less than 7)
    $('#new-tiles').click(function() {
        if (gameState.playerTiles.length < 7) {
            dealTiles();
            showMessage("New tiles dealt!", "success");
        } else {
            showMessage("You already have 7 tiles. Submit a word first!", "error");
        }
    });

    // Restart game button - resets everything
    $('#restart-game').click(function() {
        if (confirm("Are you sure you want to restart? This will reset your score.")) {
            restartGame();
        }
    });
}

// Submit the current word on the board
// This adds the score to the total and deals new tiles
function submitWord() {
    var tilesOnBoard = $('.board-square .tile').length;

    // Can't submit an empty board
    if (tilesOnBoard === 0) {
        showMessage("Please place tiles on the board first!", "error");
        return;
    }

    // Check if tiles are placed next to each other (no gaps)
    if (!areTilesConsecutive()) {
        showMessage("Tiles must be placed consecutively with no gaps!", "error");
        return;
    }

    // Add current word score to the running total
    gameState.totalScore += gameState.currentWordScore;

    showMessage("Word submitted! Score: " + gameState.currentWordScore + " points", "success");

    // Remove submitted tiles from board and from player's hand
    $('.board-square .tile').each(function() {
        var letter = $(this).attr('data-letter');
        // Remove this letter from playerTiles array
        var index = gameState.playerTiles.indexOf(letter);
        if (index > -1) {
            gameState.playerTiles.splice(index, 1);
        }
        // Remove tile from DOM
        $(this).remove();
    });

    // Reset current word score
    gameState.currentWordScore = 0;
    updateScoreDisplay();

    // Deal new tiles to bring player back to 7 tiles
    dealTiles();
}

// Check if all tiles on board are next to each other (no gaps)
// This prevents invalid words like "C_AT" with a gap
function areTilesConsecutive() {
    var positions = [];

    // Get positions of all tiles on board
    $('.board-square').each(function(index) {
        if ($(this).find('.tile').length > 0) {
            positions.push(index);
        }
    });

    // No tiles = not valid
    if (positions.length === 0) return false;
    // Single tile is ok
    if (positions.length === 1) return true;

    // Sort positions in order
    positions.sort(function(a, b) { return a - b; });

    // Check if each position is exactly 1 more than the previous
    // If not, there's a gap
    for (var i = 1; i < positions.length; i++) {
        if (positions[i] !== positions[i-1] + 1) {
            return false;  // Found a gap!
        }
    }

    return true;  // All tiles are consecutive
}

// Clear the board and return all tiles to the rack
// This doesn't submit the word, just resets the board
function clearBoard() {
    $('.board-square .tile').each(function() {
        var tile = $(this);

        // Reset tile styling to rack size
        tile.css({
            position: 'relative',
            top: 'auto',
            left: 'auto',
            transform: 'none',
            width: '75px',
            height: '75px'
        });

        // Move back to rack
        tile.detach().appendTo('#tile-rack');
    });

    // Reset current word score to 0
    gameState.currentWordScore = 0;
    updateScoreDisplay();
    showMessage("Board cleared!", "info");
}

// Restart the entire game from scratch
// Resets tile bag, scores, everything
function restartGame() {
    // Reset all tile counts back to original distribution
    for (var letter in ScrabbleTiles) {
        ScrabbleTiles[letter]["number-remaining"] = ScrabbleTiles[letter]["original-distribution"];
    }

    // Remove all tiles from screen
    $('.tile').remove();

    // Reset game state
    gameState = {
        totalScore: 0,
        currentWordScore: 0,
        playerTiles: []
    };

    // Start fresh
    initGame();
    showMessage("Game restarted!", "info");
}

// Update the score displays on screen
function updateScoreDisplay() {
    $('#current-score').text(gameState.currentWordScore);
    $('#total-score').text(gameState.totalScore);
}

// Update the tiles remaining counter
function updateTilesRemaining() {
    var remaining = 0;
    // Count up all the remaining tiles in the bag
    for (var letter in ScrabbleTiles) {
        remaining += ScrabbleTiles[letter]["number-remaining"];
    }
    $('#tiles-remaining').text(remaining);
}

// Show a message to the user
// type can be 'success', 'error', or 'info' for different colors
function showMessage(message, type) {
    var messageDiv = $('#message');
    messageDiv.removeClass('success error info');
    messageDiv.addClass(type);
    messageDiv.text(message);

    // Auto-clear the message after 3 seconds
    setTimeout(function() {
        messageDiv.text('');
        messageDiv.removeClass('success error info');
    }, 3000);
}
