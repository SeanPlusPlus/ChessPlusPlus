var init = function() {

  function get(name){
    if(name=(new RegExp('[?&]'+encodeURIComponent(name)+'=([^&]*)')).exec(location.search))
      return decodeURIComponent(name[1]);
  }
  var orientation = get('orientation');

  namespace = '/test'; 
  var socket = io.connect('http://' + document.domain + ':' + location.port + namespace);
  socket.on('my response', function(msg) {
    console.log(msg);

    // initialize variables
    var current = { color: orientation.split('')[0]};
    var move    = {};

    // get color of board that made move
    try {
      move.color = msg.data.move.color;
    }
    catch (e) {
      move.color = null;
    }

    // evaluate if we need to update board
    if (move.color !== null) {
      if (current.color !== move.color) {
        console.log('update');
      }
    }


  });
  socket.emit('join', {room: 'game_001'});

  // baord
  var board,
    game = new Chess(),
    statusEl = $('#status'),
    fenEl = $('#fen'),
    pgnEl = $('#pgn');

  // do not pick up pieces if the game is over
  // only pick up pieces for the side to move
  var onDragStart = function(source, piece, position, orientation) {
    if (game.game_over() === true ||
        (game.turn() === 'w' && piece.search(/^b/) !== -1) ||
        (game.turn() === 'b' && piece.search(/^w/) !== -1)) {
      return false;
    }
  };

  var onDrop = function(source, target) {
    // see if the move is legal
    var move = game.move({
      from: source,
      to: target,
      promotion: 'q' // NOTE: always promote to a queen for example simplicity
    });

    // illegal move
    if (move === null) return 'snapback';

    socket.emit('move', {
      room: 'game_001',
      data: {
        game: game.fen(),
        move: move,
        orientation: orientation,
      }
    });

    updateStatus();
  };

  // update the board position after the piece snap 
  // for castling, en passant, pawn promotion
  var onSnapEnd = function() {
    board.position(game.fen());
  };

  var updateStatus = function() {
    var status = '';

    var moveColor = 'White';
    if (game.turn() === 'b') {
      moveColor = 'Black';
    }

    // checkmate?
    if (game.in_checkmate() === true) {
      status = 'Game over, ' + moveColor + ' is in checkmate.';
    }

    // draw?
    else if (game.in_draw() === true) {
      status = 'Game over, drawn position';
    }

    // game still on
    else {
      status = moveColor + ' to move';

      // check?
      if (game.in_check() === true) {
        status += ', ' + moveColor + ' is in check';
      }
    }

    statusEl.html(status);
    fenEl.html(game.fen());
    pgnEl.html(game.pgn());
  };

  var cfg = {
    orientation: orientation,
    draggable: true,
    position: 'start',
    onDragStart: onDragStart,
    onDrop: onDrop,
    onSnapEnd: onSnapEnd
  };
  board = new ChessBoard('board', cfg);

  updateStatus();

}; // end init()
$(document).ready(init);
