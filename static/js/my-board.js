var init = function() {
  namespace = '/test'; // change to an empty string to use the global namespace

  // the socket.io documentation recommends sending an explicit package upon connection
  // this is specially important when using the global namespace
  var socket = io.connect('http://' + document.domain + ':' + location.port + namespace);
  socket.on('connect', function() {
    socket.emit('my event', {data: 'I\'m connected!'});
  });

  // event handler for server sent data
  // the data is displayed in the "Received" section of the page
  socket.on('my response', function(msg) {
    $('#log').append('<br>Received #' + msg.count + ': ' + msg.data);
  });

  socket.emit('join', {room: 'game_001'});

  $('form#send_room').submit(function(event) {
    socket.emit('my room event', {room: 'game_001', data: $('#room_data').val()});
    return false;
  });

  //--- start example JS ---
  var board,
    boardEl = $('#board'),
    game = new Chess(),
    squareToHighlight;

  var removeHighlights = function(color) {
    boardEl.find('.square-55d63')
      .removeClass('highlight-' + color);
  };

  // do not pick up pieces if the game is over
  // only pick up pieces for White
  var onDragStart = function(source, piece, position, orientation) {
    if (game.in_checkmate() === true || game.in_draw() === true ||
      piece.search(/^b/) !== -1) {
      return false;
    }
  };

  var makeRandomMove = function() {
    var possibleMoves = game.moves({
      verbose: true
    });

    // game over
    if (possibleMoves.length === 0) return;

    var randomIndex = Math.floor(Math.random() * possibleMoves.length);
    var move = possibleMoves[randomIndex];
    game.move(move.san);

    // highlight black's move
    removeHighlights('black');
    boardEl.find('.square-' + move.from).addClass('highlight-black');
    squareToHighlight = move.to;

    // update the board to the new position
    socket.emit('move', {room: 'game_001', data: game.fen()});
    board.position(game.fen());
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

    // highlight white's move
    removeHighlights('white');
    boardEl.find('.square-' + source).addClass('highlight-white');
    boardEl.find('.square-' + target).addClass('highlight-white');

    // make random move for black
    window.setTimeout(makeRandomMove, 250);
  };

  var onMoveEnd = function() {
    boardEl.find('.square-' + squareToHighlight)
      .addClass('highlight-black');
  };

  // update the board position after the piece snap
  // for castling, en passant, pawn promotion
  var onSnapEnd = function() {
    board.position(game.fen());
    socket.emit('move', {room: 'game_001', data: game.fen()});
  };

  function get(name){
    if(name=(new RegExp('[?&]'+encodeURIComponent(name)+'=([^&]*)')).exec(location.search))
      return decodeURIComponent(name[1]);
  }
  var orientation = 'white';
  if (get('orientation') === 'black') {
    orientation = 'black';
  }
  var cfg = {
    orientation: orientation,
    draggable: true,
    position: 'start',
    onDragStart: onDragStart,
    onDrop: onDrop,
    onMoveEnd: onMoveEnd,
    onSnapEnd: onSnapEnd
  };
  board = new ChessBoard('board', cfg);
  //--- end example JS ---

  namespace = '/test';
  var socket = io.connect('http://' + document.domain + ':' + location.port + namespace);
  socket.on('my response', function(msg) {
    console.log(msg.data);
  });


}; // end init()
$(document).ready(init);
